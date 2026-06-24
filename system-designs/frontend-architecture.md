# Frontend Architecture

## Constraints
- React or Next.js application
- Multiple contributors
- Need design consistency
- Performance matters (Core Web Vitals)

## Stack Decision

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 15 App Router | Best SSR/SSG/ISR hybrid |
| Language | TypeScript (strict) | Catch errors at build time |
| Styling | Tailwind CSS v4 | Utility-first, zero runtime |
| Components | shadcn/ui | Copy-owned, customizable |
| State (server) | TanStack Query v5 | Cache + sync, no Redux |
| State (client) | Zustand | Minimal, no boilerplate |
| Forms | React Hook Form + Zod | Type-safe validation |
| Testing | Vitest + Testing Library | Fast, modern, Vite-based |
| Icons | Lucide React | Consistent, tree-shakeable |

## Folder Structure

```
src/
├── app/                  # Next.js App Router pages
├── components/
│   ├── ui/               # Primitive components (shadcn)
│   ├── layout/           # Shell, sidebar, header
│   └── [feature]/        # Feature-specific components
├── hooks/                # Custom React hooks
├── lib/
│   ├── api/              # API client + fetchers
│   ├── utils.ts          # cn() and pure helpers
│   └── validations/      # Zod schemas
├── stores/               # Zustand stores
└── types/                # Global TypeScript types
```

## Component Pattern

```typescript
// components/[feature]/user-card.tsx
import { type FC } from 'react'
import { cn } from '@/lib/utils'

interface UserCardProps {
  name: string
  role: string
  className?: string
}

export const UserCard: FC<UserCardProps> = ({ name, role, className }) => {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <p className="font-semibold">{name}</p>
      <p className="text-sm text-muted-foreground">{role}</p>
    </div>
  )
}
```

## Data Fetching Pattern

```typescript
// Server Component (preferred — no client bundle cost)
async function UserList() {
  const users = await db.query.users.findMany() // runs on server
  return <ul>{users.map(u => <UserCard key={u.id} {...u} />)}</ul>
}

// Client Component (only when interactivity needed)
'use client'
function InteractiveList() {
  const { data } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json())
  })
  return <ul>{data?.map(u => <UserCard key={u.id} {...u} />)}</ul>
}
```

## Form + Validation Pattern

```typescript
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(50)
})

function CreateUserForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: z.infer<typeof schema>) => {
    await createUser(data)  // Server Action
  }

  return <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)}>...</form></Form>
}
```

## Performance Rules

- Default to **Server Components** — only add `'use client'` when you need state/events
- Images: always `next/image` with explicit width/height
- Fonts: `next/font` with `display: swap`
- Code splitting: dynamic imports for heavy non-critical UI
- Bundle: `@next/bundle-analyzer` to catch size regressions

## Design Reference

Map brand to design system:
- Developer tool → `design-md/vercel/`
- Productivity / workspace → `design-md/linear.app/` or `design-md/notion/`
- Finance / payments → `design-md/stripe/`
- Media / content → `design-md/spotify/`
- Premium / hardware → `design-md/apple/`
