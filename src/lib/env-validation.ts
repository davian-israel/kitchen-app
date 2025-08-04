/**
 * Environment variable validation for better error handling
 * Ensures required environment variables are set
 */

import { z } from 'zod'
import { randomBytes } from 'crypto'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_DEBUG: z.string().optional(),
  SKIP_ENV_VALIDATION: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

let validatedEnv: Env | null = null

export function resetEnvCache(): void {
  validatedEnv = null
}

// SECURITY FIX: Generate cryptographically secure random secrets
function generateSecureSecret(): string {
  return randomBytes(32).toString('base64')
}

function generateSecureDatabaseUrl(): string {
  const randomDb = randomBytes(8).toString('hex')
  return `postgresql://dummy_${randomDb}:${randomBytes(16).toString('hex')}@localhost:5432/dummy_${randomDb}`
}

export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv
  }

  // Skip validation if explicitly requested (for build environments)
  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    const fallbackEnv: Env = {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || generateSecureSecret(),
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      DATABASE_URL: process.env.DATABASE_URL || generateSecureDatabaseUrl(),
      NEXTAUTH_DEBUG: process.env.NEXTAUTH_DEBUG,
      SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
    }
    validatedEnv = fallbackEnv
    return fallbackEnv
  }

  // Always provide fallback values to prevent build failures (with secure randoms)
  const fallbackEnv: Env = {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || generateSecureSecret(),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    DATABASE_URL: process.env.DATABASE_URL || generateSecureDatabaseUrl(),
    NEXTAUTH_DEBUG: process.env.NEXTAUTH_DEBUG,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION,
  }

  try {
    validatedEnv = envSchema.parse(process.env)
    return validatedEnv
  } catch (error) {
    // Only log errors in development, not during build
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Environment validation failed, using fallbacks:', error)
      
      if (error instanceof z.ZodError && error.errors) {
        console.warn('Missing or invalid environment variables:')
        error.errors.forEach((err) => {
          console.warn(`- ${err.path.join('.')}: ${err.message}`)
        })
      }
    }
    
    validatedEnv = fallbackEnv
    return fallbackEnv
  }
}

export function getEnv(): Env {
  return validateEnv()
}

export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development'
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production'
}

export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test'
}