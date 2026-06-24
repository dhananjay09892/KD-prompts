import { db } from '../db/client'
import { roles, permissions, rolePermissions, userRoles, users } from '../db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { NotFoundError, ConflictError, ForbiddenError } from '../lib/errors'
import type { NewRole } from '../db/schema'

// ─── Role CRUD ────────────────────────────────────────────────────────────────

export async function listRoles() {
  return db.query.roles.findMany({
    with: {
      rolePermissions: {
        with: { permission: true },
      },
    },
    orderBy: (r, { asc }) => asc(r.name),
  })
}

export async function createRole(data: { name: string; description?: string }) {
  const existing = await db.query.roles.findFirst({ where: eq(roles.name, data.name) })
  if (existing) throw new ConflictError(`Role "${data.name}" already exists`)

  const [role] = await db.insert(roles).values(data).returning()
  return role
}

export async function deleteRole(roleId: string) {
  const role = await db.query.roles.findFirst({ where: eq(roles.id, roleId) })
  if (!role) throw new NotFoundError('Role not found')
  if (role.isSystem) throw new ForbiddenError('System roles cannot be deleted')

  await db.delete(roles).where(eq(roles.id, roleId))
}

// ─── Permission CRUD ──────────────────────────────────────────────────────────

export async function listPermissions() {
  return db.query.permissions.findMany({
    orderBy: (p, { asc }) => [asc(p.resource), asc(p.action)],
  })
}

export async function createPermission(data: { action: string; resource: string; description?: string }) {
  const existing = await db.query.permissions.findFirst({
    where: eq(permissions.action, data.action),
  })
  if (existing) throw new ConflictError(`Permission "${data.action}" already exists`)

  const [permission] = await db.insert(permissions).values(data).returning()
  return permission
}

// ─── Role ↔ Permission Assignment ────────────────────────────────────────────

export async function assignPermissionsToRole(roleId: string, permissionIds: string[]) {
  const role = await db.query.roles.findFirst({ where: eq(roles.id, roleId) })
  if (!role) throw new NotFoundError('Role not found')

  // Remove existing, replace with new set (idempotent)
  await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))

  if (permissionIds.length > 0) {
    await db.insert(rolePermissions).values(
      permissionIds.map((pid) => ({ roleId, permissionId: pid }))
    )
  }

  return getRoleWithPermissions(roleId)
}

export async function getRoleWithPermissions(roleId: string) {
  const role = await db.query.roles.findFirst({
    where: eq(roles.id, roleId),
    with: { rolePermissions: { with: { permission: true } } },
  })
  if (!role) throw new NotFoundError('Role not found')
  return role
}

// ─── User ↔ Role Assignment ───────────────────────────────────────────────────

export async function listUserRoles(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) throw new NotFoundError('User not found')

  return db.query.userRoles.findMany({
    where: eq(userRoles.userId, userId),
    with: { role: true },
  })
}

export async function assignRolesToUser(userId: string, roleIds: string[], assignedBy: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) throw new NotFoundError('User not found')

  // Validate all roleIds exist
  const foundRoles = await db.query.roles.findMany({
    where: inArray(roles.id, roleIds),
  })
  if (foundRoles.length !== roleIds.length) throw new NotFoundError('One or more roles not found')

  // Remove existing, replace with new set
  await db.delete(userRoles).where(eq(userRoles.userId, userId))

  if (roleIds.length > 0) {
    await db.insert(userRoles).values(
      roleIds.map((roleId) => ({ userId, roleId, assignedBy }))
    )
  }

  return listUserRoles(userId)
}

export async function addRoleToUser(userId: string, roleId: string, assignedBy: string) {
  const [user, role] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.roles.findFirst({ where: eq(roles.id, roleId) }),
  ])
  if (!user) throw new NotFoundError('User not found')
  if (!role) throw new NotFoundError('Role not found')

  await db
    .insert(userRoles)
    .values({ userId, roleId, assignedBy })
    .onConflictDoNothing()

  return listUserRoles(userId)
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
}

// ─── User Listing ─────────────────────────────────────────────────────────────

export async function listUsersWithRoles() {
  return db.query.users.findMany({
    columns: { passwordHash: false }, // never expose
    with: {
      userRoles: {
        with: { role: true },
      },
    },
    orderBy: (u, { asc }) => asc(u.createdAt),
  })
}
