# Universal Auth + RBAC System

Multi-role authentication system. Drop into any Node.js project.

## Architecture

```
Users ──< UserRoles >── Roles ──< RolePermissions >── Permissions
                                                         
user.id    M:M          role.id        M:M          permission.id
                      "admin"                       "users:create"
                      "editor"                      "content:read"
                      "viewer"                      "billing:manage"
```

**Key design decisions:**
- Users can hold **multiple roles simultaneously** (e.g. `editor` + `billing`)
- Permissions are **action strings** (`resource:action`) — easy to check and extend
- Access tokens are **short-lived (15 min)** — permissions baked in at login time
- Refresh tokens are **hashed** in DB and **rotated on every use**
- System roles (`super-admin`, `admin`, `user`) cannot be deleted via API

## Setup

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env
# Fill: DATABASE_URL, JWT_SECRET (32+ chars)

# 3. Migrate
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev
```

`.env.example`:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
JWT_SECRET=your-secret-min-32-chars-here
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000
```

## API Reference

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Create account, returns access token |
| POST | `/auth/login` | — | Login, returns access token |
| POST | `/auth/refresh` | cookie | Rotate refresh token, new access token |
| POST | `/auth/logout` | cookie | Revoke refresh token |
| GET | `/auth/me` | Bearer | Current user info + roles + permissions |

### Role Management (requires `roles:manage` permission)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/roles` | List all roles with permissions |
| POST | `/roles` | Create a new role |
| DELETE | `/roles/:id` | Delete role (system roles protected) |
| PUT | `/roles/:id/permissions` | Replace role's permission set |
| GET | `/permissions` | List all permissions |
| POST | `/permissions` | Create a new permission |
| GET | `/users` | List users with their roles |
| GET | `/users/:id/roles` | List one user's roles |
| PUT | `/users/:id/roles` | Replace user's entire role set |
| POST | `/users/:id/roles/:roleId` | Add one role to user |
| DELETE | `/users/:id/roles/:roleId` | Remove one role from user |

## Usage in Routes

```typescript
// Require authentication only
app.get('/profile', { preHandler: [app.authenticate] }, handler)

// Require specific permission
app.delete('/users/:id', {
  preHandler: [app.authenticate, app.requirePermission('users:delete')]
}, handler)

// Require any of multiple roles
app.get('/admin', {
  preHandler: [app.authenticate, app.requireRole('admin', 'super-admin')]
}, handler)

// Multiple permissions (user must have ALL)
app.post('/content', {
  preHandler: [app.authenticate, app.requirePermission('content:create')]
}, handler)
```

## Default Roles + Permissions

| Role | Permissions |
|------|------------|
| `super-admin` | All permissions |
| `admin` | users:*, roles:* |
| `user` | (none by default — add as needed) |
| `viewer` | users:read, content:read, billing:read |
| `editor` | content:* |
| `billing` | billing:* |

## Security

- Passwords: bcrypt (12 rounds)
- Refresh tokens: stored as SHA-256 hash (raw token never saved)
- Token rotation: old refresh token revoked on every use
- HttpOnly cookies: refresh token not accessible to JS
- Timing-safe: constant-time password check even for unknown users
- Env validation: crashes on startup if secrets are missing/weak

## Files

```
auth-rbac/
├── db/
│   ├── schema.ts              ← Drizzle ORM schema
│   └── migrations/
│       ├── 001_init.sql       ← Table creation
│       └── 002_seed.sql       ← Default roles + permissions
├── services/
│   ├── auth.service.ts        ← Register, login, refresh, token logic
│   └── roles.service.ts       ← Role/permission CRUD + assignment
├── routes/
│   ├── auth.routes.ts         ← /auth/* endpoints
│   └── roles.routes.ts        ← /roles, /permissions, /users endpoints
├── lib/
│   ├── auth.plugin.ts         ← Fastify plugin: authenticate, requirePermission, requireRole
│   ├── errors.ts              ← Typed error classes
│   └── env.ts                 ← Env validation (Zod)
├── ui/components/
│   ├── auth-form.tsx          ← Login + Register UI (React)
│   └── role-manager.tsx       ← Admin: manage roles, permissions, user assignments
└── server.ts                  ← App bootstrap + error handler
```
