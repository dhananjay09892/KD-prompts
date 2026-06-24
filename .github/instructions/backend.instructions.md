---
applyTo: "**/routes/**,**/api/**,**/services/**,**/repositories/**,**/models/**"
---

# Backend Engineering Rules

Channel: `agents/development-team/backend-architect.md` for design decisions.
Channel: `agents/development-team/backend-developer.md` for implementation.

## Architecture Rules
- **Repository pattern**: all DB queries in `repositories/` — routes never import db directly
- **Service layer**: business logic in `services/` — pure functions, no HTTP concerns
- **Validate at boundary**: Zod/Pydantic on every route input, reject early

## Query Rules
- Parameterized queries only — ORM enforces this, never raw string interpolation
- Add indexes before production — check with `EXPLAIN ANALYZE`
- N+1 check: any loop that queries DB is a red flag — use joins or batch load

## Auth Rules
- JWT: verify signature AND expiry on every request
- Never trust JWT payload without verification
- Refresh token rotation — invalidate old on use
- RBAC checked at service layer, not just route level

## Error Handling
- Typed error classes (NotFoundError, ValidationError, UnauthorizedError)
- Never expose stack traces or DB errors to client responses
- Log full error server-side with request ID for correlation
- HTTP status codes: 400 (bad input), 401 (unauthed), 403 (forbidden), 404 (not found), 429 (rate limited), 500 (server bug)

## Secrets Rule
- All secrets in env vars — validated at startup with Zod `.parse(process.env)`
- Never log secrets, tokens, or PII

## Pattern Reference
- Auth flow → `system-designs/backend-scalable.md#auth-middleware`
- Rate limiting → `system-designs/backend-scalable.md#rate-limiting`
- Background jobs → `system-designs/backend-scalable.md#background-job-pattern`
