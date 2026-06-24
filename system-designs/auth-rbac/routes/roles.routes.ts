import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import {
  listRoles,
  createRole,
  deleteRole,
  listPermissions,
  createPermission,
  assignPermissionsToRole,
  getRoleWithPermissions,
  listUsersWithRoles,
  assignRolesToUser,
  addRoleToUser,
  removeRoleFromUser,
  listUserRoles,
} from '../services/roles.service'

const createRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
  description: z.string().max(200).optional(),
})

const createPermissionSchema = z.object({
  action: z
    .string()
    .regex(/^[a-z0-9-]+:[a-z0-9-]+$/, 'Format: resource:action (e.g. users:create)'),
  resource: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
})

const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
})

const assignRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
})

export async function roleRoutes(app: FastifyInstance) {
  // All role management requires authentication + admin permission
  const adminGuard = [app.authenticate, app.requirePermission('roles:manage')]

  // ── Roles ─────────────────────────────────────────────────────────────────

  // GET /roles
  app.get('/roles', { preHandler: adminGuard }, async (_req, reply) => {
    return reply.send(await listRoles())
  })

  // POST /roles
  app.post('/roles', { preHandler: adminGuard }, async (req, reply) => {
    const body = createRoleSchema.parse(req.body)
    return reply.status(201).send(await createRole(body))
  })

  // GET /roles/:id
  app.get('/roles/:id', { preHandler: adminGuard }, async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
    return reply.send(await getRoleWithPermissions(id))
  })

  // DELETE /roles/:id
  app.delete('/roles/:id', { preHandler: adminGuard }, async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
    await deleteRole(id)
    return reply.status(204).send()
  })

  // PUT /roles/:id/permissions — replace permission set on a role
  app.put('/roles/:id/permissions', { preHandler: adminGuard }, async (req, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params)
    const { permissionIds } = assignPermissionsSchema.parse(req.body)
    return reply.send(await assignPermissionsToRole(id, permissionIds))
  })

  // ── Permissions ───────────────────────────────────────────────────────────

  // GET /permissions
  app.get('/permissions', { preHandler: adminGuard }, async (_req, reply) => {
    return reply.send(await listPermissions())
  })

  // POST /permissions
  app.post('/permissions', { preHandler: adminGuard }, async (req, reply) => {
    const body = createPermissionSchema.parse(req.body)
    return reply.status(201).send(await createPermission(body))
  })

  // ── User Role Management ──────────────────────────────────────────────────

  // GET /users — list all users with their roles
  app.get('/users', { preHandler: adminGuard }, async (_req, reply) => {
    return reply.send(await listUsersWithRoles())
  })

  // GET /users/:userId/roles
  app.get('/users/:userId/roles', { preHandler: adminGuard }, async (req, reply) => {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params)
    return reply.send(await listUserRoles(userId))
  })

  // PUT /users/:userId/roles — replace user's entire role set
  app.put('/users/:userId/roles', { preHandler: adminGuard }, async (req, reply) => {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.params)
    const { roleIds } = assignRolesSchema.parse(req.body)
    return reply.send(await assignRolesToUser(userId, roleIds, req.user.sub))
  })

  // POST /users/:userId/roles/:roleId — add one role
  app.post('/users/:userId/roles/:roleId', { preHandler: adminGuard }, async (req, reply) => {
    const { userId, roleId } = z
      .object({ userId: z.string().uuid(), roleId: z.string().uuid() })
      .parse(req.params)
    return reply.status(201).send(await addRoleToUser(userId, roleId, req.user.sub))
  })

  // DELETE /users/:userId/roles/:roleId — remove one role
  app.delete('/users/:userId/roles/:roleId', { preHandler: adminGuard }, async (req, reply) => {
    const { userId, roleId } = z
      .object({ userId: z.string().uuid(), roleId: z.string().uuid() })
      .parse(req.params)
    await removeRoleFromUser(userId, roleId)
    return reply.status(204).send()
  })
}
