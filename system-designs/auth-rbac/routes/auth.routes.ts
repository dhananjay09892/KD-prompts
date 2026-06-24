import { z } from 'zod'
import type { FastifyInstance } from 'fastify'
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  revokeRefreshToken,
} from '../services/auth.service'

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  name: z.string().min(2).max(80).trim(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/auth/register', async (req, reply) => {
    const body = registerSchema.parse(req.body)
    const tokens = await registerUser(body)

    // Refresh token in HttpOnly cookie — not in JS-accessible response body
    reply.setCookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/auth',
    })

    return reply.status(201).send({
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    })
  })

  // POST /auth/login
  app.post('/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body)
    const tokens = await loginUser(body)

    reply.setCookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/auth',
    })

    return reply.send({
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    })
  })

  // POST /auth/refresh — reads from HttpOnly cookie
  app.post('/auth/refresh', async (req, reply) => {
    // Prefer cookie; fallback to body (for non-browser clients)
    const cookieToken = req.cookies?.refresh_token
    const bodyToken = refreshSchema.safeParse(req.body).data?.refreshToken
    const rawToken = cookieToken ?? bodyToken

    if (!rawToken) {
      return reply.status(401).send({ error: 'No refresh token provided' })
    }

    const tokens = await refreshAccessToken(rawToken)

    reply.setCookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/auth',
    })

    return reply.send({
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    })
  })

  // POST /auth/logout
  app.post('/auth/logout', async (req, reply) => {
    const rawToken = req.cookies?.refresh_token
    if (rawToken) {
      await revokeRefreshToken(rawToken)
      reply.clearCookie('refresh_token', { path: '/auth' })
    }
    return reply.send({ success: true })
  })

  // GET /auth/me — returns current user from access token
  app.get('/auth/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    return reply.send({
      id: req.user.sub,
      email: req.user.email,
      roles: req.user.roles,
      permissions: req.user.permissions,
    })
  })
}
