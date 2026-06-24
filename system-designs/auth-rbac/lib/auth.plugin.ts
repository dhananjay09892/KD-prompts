import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { verifyAccessToken, type JWTPayload } from '../services/auth.service'
import { UnauthorizedError, ForbiddenError } from './errors'

// Augment Fastify types — available on req.user everywhere
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    requirePermission: (...actions: string[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRole: (...roleNames: string[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user: JWTPayload
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  // ── authenticate ──────────────────────────────────────────────────────────
  // Verifies Bearer token and attaches decoded payload to req.user
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or malformed Authorization header' })
    }

    try {
      req.user = verifyAccessToken(authHeader.slice(7))
    } catch {
      return reply.status(401).send({ error: 'Invalid or expired access token' })
    }
  })

  // ── requirePermission ─────────────────────────────────────────────────────
  // Use AFTER authenticate. Checks that user has ALL listed permissions.
  // Usage: preHandler: [app.authenticate, app.requirePermission('users:create')]
  app.decorate(
    'requirePermission',
    (...actions: string[]) =>
      async (req: FastifyRequest, reply: FastifyReply) => {
        const userPerms = new Set(req.user?.permissions ?? [])
        const missing = actions.filter((a) => !userPerms.has(a))
        if (missing.length > 0) {
          return reply.status(403).send({
            error: 'Insufficient permissions',
            required: missing,
          })
        }
      }
  )

  // ── requireRole ───────────────────────────────────────────────────────────
  // Checks user has AT LEAST ONE of the listed roles.
  // Usage: preHandler: [app.authenticate, app.requireRole('admin', 'super-admin')]
  app.decorate(
    'requireRole',
    (...roleNames: string[]) =>
      async (req: FastifyRequest, reply: FastifyReply) => {
        const userRoles = new Set(req.user?.roles ?? [])
        const hasRole = roleNames.some((r) => userRoles.has(r))
        if (!hasRole) {
          return reply.status(403).send({
            error: 'Insufficient role',
            required: roleNames,
          })
        }
      }
  )
})
