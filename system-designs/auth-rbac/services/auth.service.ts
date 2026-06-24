import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { db } from '../db/client'
import { users, roles, permissions, userRoles, rolePermissions, refreshTokens } from '../db/schema'
import { eq, and, inArray, gt, isNull } from 'drizzle-orm'
import { UnauthorizedError, NotFoundError, ConflictError, ForbiddenError } from '../lib/errors'
import { env } from '../lib/env'

const BCRYPT_ROUNDS = 12
const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL_DAYS = 30

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string        // user id
  email: string
  roles: string[]    // role names for fast RBAC check
  permissions: string[] // resolved permission actions
  iat: number
  exp: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─── Token Generation ─────────────────────────────────────────────────────────

export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL })
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload
  } catch {
    throw new UnauthorizedError('Invalid or expired access token')
  }
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex')
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ─── Role Resolution ──────────────────────────────────────────────────────────
// Resolves all permissions for a user's assigned roles — flattened into a unique set

export async function resolveUserPermissions(userId: string): Promise<{
  roleNames: string[]
  permissionActions: string[]
}> {
  const rows = await db
    .select({
      roleName: roles.name,
      permissionAction: permissions.action,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
    .where(eq(userRoles.userId, userId))

  const roleNames = [...new Set(rows.map((r) => r.roleName))]
  const permissionActions = [...new Set(
    rows.map((r) => r.permissionAction).filter(Boolean) as string[]
  )]

  return { roleNames, permissionActions }
}

// ─── Auth Operations ─────────────────────────────────────────────────────────

export async function registerUser(data: {
  email: string
  password: string
  name: string
}): Promise<TokenPair> {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email.toLowerCase()),
  })
  if (existing) throw new ConflictError('Email already registered')

  const passwordHash = await hashPassword(data.password)

  const [user] = await db
    .insert(users)
    .values({
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
    })
    .returning()

  // Auto-assign default "user" role if it exists
  const defaultRole = await db.query.roles.findFirst({
    where: eq(roles.name, 'user'),
  })
  if (defaultRole) {
    await db.insert(userRoles).values({ userId: user.id, roleId: defaultRole.id })
  }

  return createTokenPair(user.id, user.email)
}

export async function loginUser(data: {
  email: string
  password: string
}): Promise<TokenPair> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, data.email.toLowerCase()),
  })

  // Constant-time comparison even when user doesn't exist
  const dummyHash = '$2a$12$invalidhashfortimingprotection000000000000000000000000'
  const isValid = user
    ? await verifyPassword(data.password, user.passwordHash)
    : await verifyPassword(data.password, dummyHash)

  if (!user || !isValid) throw new UnauthorizedError('Invalid email or password')
  if (!user.isActive) throw new ForbiddenError('Account is disabled')

  return createTokenPair(user.id, user.email)
}

export async function refreshAccessToken(rawRefreshToken: string): Promise<TokenPair> {
  const tokenHash = hashToken(rawRefreshToken)

  const stored = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.tokenHash, tokenHash),
      isNull(refreshTokens.revokedAt),
      gt(refreshTokens.expiresAt, new Date())
    ),
  })

  if (!stored) throw new UnauthorizedError('Invalid or expired refresh token')

  // Rotate: revoke old, issue new (prevents token reuse)
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, stored.id))

  const user = await db.query.users.findFirst({ where: eq(users.id, stored.userId) })
  if (!user || !user.isActive) throw new UnauthorizedError('User not found or disabled')

  return createTokenPair(user.id, user.email)
}

export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken)
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash))
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

async function createTokenPair(userId: string, email: string): Promise<TokenPair> {
  const { roleNames, permissionActions } = await resolveUserPermissions(userId)

  const accessToken = generateAccessToken({
    sub: userId,
    email,
    roles: roleNames,
    permissions: permissionActions,
  })

  const rawRefreshToken = generateRefreshToken()
  const tokenHash = hashToken(rawRefreshToken)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86_400_000)

  await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt })

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    expiresIn: 15 * 60, // seconds
  }
}
