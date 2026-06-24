import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { ZodError } from 'zod'
import { authPlugin } from './lib/auth.plugin'
import { AppError } from './lib/errors'
import { authRoutes } from './routes/auth.routes'
import { roleRoutes } from './routes/roles.routes'
import { env } from './lib/env'

export async function buildApp() {
  const app = Fastify({ logger: true })

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cookie)
  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  })
  await app.register(authPlugin)

  // ── Global Error Handler ───────────────────────────────────────────────────
  app.setErrorHandler((error, _req, reply) => {
    // Zod validation errors
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: 'Validation failed',
        issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      })
    }
    // Known app errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.message, code: error.code })
    }
    // Unknown — log full error, return generic message (never expose internals)
    app.log.error(error)
    return reply.status(500).send({ error: 'Internal server error' })
  })

  // ── Routes ─────────────────────────────────────────────────────────────────
  await app.register(authRoutes)
  await app.register(roleRoutes)

  // ── Health Check ───────────────────────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  return app
}

// ── Entry Point ────────────────────────────────────────────────────────────────
if (require.main === module) {
  buildApp().then((app) => {
    app.listen({ port: env.PORT, host: '0.0.0.0' }, (err) => {
      if (err) {
        app.log.error(err)
        process.exit(1)
      }
    })
  })
}
