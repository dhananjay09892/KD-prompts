# Scalable Backend Architecture

## Constraints
- REST or GraphQL API
- Needs to grow without rewrites
- Database-backed
- May need background jobs
- Team target: 1–5 engineers

## Stack Decision

| Layer | Choice | Reason |
|-------|--------|--------|
| Runtime | Node.js (Fastify) or Python (FastAPI) | Fast, async-native |
| Language | TypeScript / Python with type hints | Catch bugs early |
| Database | PostgreSQL (Supabase or Railway) | Reliable, JSONB when needed |
| ORM | Drizzle (TS) / SQLAlchemy (Python) | Type-safe, no magic |
| Auth | JWT + refresh tokens (or delegate to Clerk) | Stateless, scalable |
| Cache | Upstash Redis | Serverless-native, free tier |
| Queue | BullMQ (Redis) or Inngest | Background jobs, retries |
| Validation | Zod (TS) / Pydantic (Python) | Schema-first validation |
| Observability | Sentry + structured JSON logs | Error tracking + log query |
| API Docs | OpenAPI 3.1 auto-generated | Contract-first development |

## Folder Structure

```
src/
├── routes/              # Route handlers grouped by domain
│   ├── auth/
│   ├── users/
│   └── [domain]/
├── services/            # Business logic (pure functions)
├── repositories/        # DB access layer (all queries here)
├── middleware/          # Auth, rate-limit, validation
├── jobs/                # Background job definitions
├── lib/
│   ├── db.ts            # DB client singleton
│   ├── redis.ts         # Cache client
│   └── errors.ts        # Typed error classes
└── types/               # Shared TypeScript types
```

## Route Handler Pattern

```typescript
// routes/users/get-user.ts
import { z } from 'zod'
import { getUserById } from '@/repositories/users'
import { NotFoundError } from '@/lib/errors'

const paramsSchema = z.object({ id: z.string().uuid() })

export async function getUser(req: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(req.params)  // validate at boundary
  const user = await getUserById(id)
  if (!user) throw new NotFoundError('User not found')
  return reply.send(user)
}
```

## Repository Pattern (DB Isolation)

```typescript
// repositories/users.ts
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// All DB queries live here — routes/services never import db directly
export async function getUserById(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) })
}

export async function createUser(data: NewUser) {
  const [user] = await db.insert(users).values(data).returning()
  return user
}
```

## Auth Middleware

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken'

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return reply.status(401).send({ error: 'Unauthorized' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = payload as JWTPayload  // typed on FastifyRequest
  } catch {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}
```

## Rate Limiting (Upstash)

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),  // 100 req/min
})

export async function rateLimitMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const { success } = await ratelimit.limit(req.ip)
  if (!success) return reply.status(429).send({ error: 'Too many requests' })
}
```

## Background Job Pattern

```typescript
// jobs/send-welcome-email.ts
import { inngest } from '@/lib/inngest'

export const sendWelcomeEmail = inngest.createFunction(
  { id: 'send-welcome-email' },
  { event: 'user/created' },
  async ({ event }) => {
    await resend.emails.send({
      from: 'noreply@yourapp.com',
      to: event.data.email,
      subject: 'Welcome!',
      react: WelcomeEmail({ name: event.data.name })
    })
  }
)
```

## Scaling Checklist

- [ ] All queries use indexes (check with EXPLAIN ANALYZE)
- [ ] N+1 queries eliminated (use joins or DataLoader)
- [ ] Redis cache on expensive/frequent reads
- [ ] DB connection pool configured (max 10 for serverless)
- [ ] Background jobs for anything > 200ms
- [ ] Structured JSON logs with request ID for tracing
- [ ] Health check endpoint at `GET /health`

## Security Checklist

- [ ] Input validation with Zod/Pydantic on every route
- [ ] Parameterized queries only (ORM enforces this)
- [ ] JWT expiry checked, refresh token rotation
- [ ] Rate limiting on auth + write endpoints
- [ ] Secrets in env vars, validated at startup
- [ ] SQL errors never exposed to client
- [ ] CORS allowlist — never `*` on authenticated routes
