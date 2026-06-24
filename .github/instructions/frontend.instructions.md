---
applyTo: "**/*.{tsx,jsx,ts,js,css,scss}"
---

# Frontend Engineering Rules

Channel: `agents/development-team/frontend-developer.md`

## Component Rules
- Default to **Server Components** — add `'use client'` only for events/state
- Props interface required on every component — no implicit `any`
- Export named (not default) — easier to refactor
- One component per file, filename matches export name

## Styling Rules
- Tailwind utility classes — no inline `style=` unless truly dynamic
- Use `cn()` (clsx + tailwind-merge) for conditional classes
- Design tokens only — never hardcode color hex values in components
- Mobile-first breakpoints: `sm:` `md:` `lg:`

## State Rules
- Server data → TanStack Query (not useState + useEffect)
- Global UI state → Zustand (not Context for performance-sensitive state)
- Forms → React Hook Form + Zod resolver

## Performance Rules
- `next/image` for all images — explicit width/height required
- Dynamic import for components > 10KB not in critical path
- Never `useEffect` to fetch data — use Server Components or TanStack Query

## Design System Quick Reference
When user mentions a brand/style, reference the matching `design-md/{brand}/README.md`:
- "clean / minimal / developer" → `design-md/vercel/`
- "dashboard / SaaS" → `design-md/linear.app/`
- "financial / payments" → `design-md/stripe/`
- "docs / content" → `design-md/notion/`
- "dark / developer" → `design-md/supabase/`
- "media / entertainment" → `design-md/spotify/`
- "premium / product" → `design-md/apple/`
