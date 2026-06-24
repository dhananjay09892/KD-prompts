# SaaS Platform Architecture

## Constraints
- Multi-tenant (users belong to organizations)
- Auth required (email/social/SSO)
- Subscription billing
- Dashboard UI with data-heavy pages
- Team target: 1–5 engineers, < $500/month infra

## Stack Decision

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js 15 (App Router) | SSR + static hybrid, Vercel-native |
| Styling | Tailwind CSS v4 | Zero runtime, design token support |
| Auth | Clerk or Supabase Auth | Managed, handles SSO + orgs |
| Database | Supabase (Postgres) | Free tier, RLS for multi-tenancy |
| ORM | Drizzle ORM | Type-safe, lightweight, edge-compatible |
| Billing | Stripe Billing | Industry standard, webhooks |
| Email | Resend + React Email | Developer-friendly, templated |
| File Storage | Supabase Storage or Cloudflare R2 | Cheap egress |
| Deployment | Vercel | Zero-config, preview envs |
| Monitoring | Sentry + Vercel Analytics | Free tiers sufficient early |

## Folder Structure

```
├── app/
│   ├── (auth)/          # Login, signup, onboarding
│   ├── (dashboard)/     # Authenticated app shell
│   │   ├── layout.tsx   # Sidebar + nav wrapper
│   │   ├── settings/    # Org + user settings
│   │   └── [feature]/   # Domain pages
│   ├── api/             # Route handlers (webhooks, etc.)
│   └── layout.tsx       # Root layout + providers
├── components/
│   ├── ui/              # shadcn/ui primitives
│   └── [feature]/       # Domain-specific components
├── lib/
│   ├── db/              # Drizzle schema + client
│   ├── auth/            # Auth helpers
│   └── stripe/          # Billing helpers
├── actions/             # Server Actions (mutations)
├── hooks/               # Client-side React hooks
└── types/               # Shared TypeScript types
```

## Multi-Tenancy Pattern (RLS)

```sql
-- Every table gets tenant isolation via RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON items
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

```typescript
// Set org context before every query
await supabase.rpc('set_config', {
  setting: 'app.current_org_id',
  value: session.orgId
});
```

## Auth Flow

```
User visits /dashboard
  → Middleware checks Clerk/Supabase session
  → No session → redirect /login
  → Valid session → inject org context
  → Page renders with tenant-scoped data
```

## Billing Webhook Pattern

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!  // never inline
  );

  switch (event.type) {
    case 'customer.subscription.created':
      await db.update(orgs)
        .set({ plan: 'pro', stripeSubscriptionId: event.data.object.id })
        .where(eq(orgs.stripeCustomerId, event.data.object.customer as string));
      break;
    // handle other events
  }

  return Response.json({ received: true });
}
```

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Stripe webhook signature verified
- [ ] Env vars: never committed, validated at startup
- [ ] CORS: restrict to known origins
- [ ] Rate limiting on auth endpoints (Upstash Redis)
- [ ] Input validation: Zod on all Server Actions and API routes
- [ ] Error messages: never expose stack traces to client

## Design Reference

Default to `design-md/vercel/` for dashboard aesthetic.
For financial/billing UI: reference `design-md/stripe/`.
