'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
})

const registerSchema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
})

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

interface AuthFormProps {
  onSuccess?: (accessToken: string) => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [serverError, setServerError] = useState<string | null>(null)

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })
  const registerForm = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  const handleLogin = async (data: LoginValues) => {
    setServerError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json()
        setServerError(err.error ?? 'Login failed')
        return
      }
      const { accessToken } = await res.json()
      onSuccess?.(accessToken)
    } catch {
      setServerError('Network error — please try again')
    }
  }

  const handleRegister = async (data: RegisterValues) => {
    setServerError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json()
        setServerError(err.error ?? 'Registration failed')
        return
      }
      const { accessToken } = await res.json()
      onSuccess?.(accessToken)
    } catch {
      setServerError('Network error — please try again')
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="rounded-xl border bg-white p-8 shadow-sm">
        {/* Tab switcher */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setServerError(null) }}
              className={cn(
                'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                mode === m
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {m === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {serverError && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}

        {mode === 'login' ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              error={loginForm.formState.errors.email?.message}
              {...loginForm.register('email')}
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              error={loginForm.formState.errors.password?.message}
              {...loginForm.register('password')}
            />
            <button
              type="submit"
              disabled={loginForm.formState.isSubmitting}
              className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <Field
              label="Name"
              type="text"
              autoComplete="name"
              error={registerForm.formState.errors.name?.message}
              {...registerForm.register('name')}
            />
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              error={registerForm.formState.errors.email?.message}
              {...registerForm.register('email')}
            />
            <Field
              label="Password"
              type="password"
              autoComplete="new-password"
              error={registerForm.formState.errors.password?.message}
              {...registerForm.register('password')}
            />
            <button
              type="submit"
              disabled={registerForm.formState.isSubmitting}
              className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {registerForm.formState.isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

function Field({ label, error, ...props }: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        className={cn(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none',
          'focus:ring-2 focus:ring-gray-900 focus:border-transparent',
          error ? 'border-red-400' : 'border-gray-200'
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
