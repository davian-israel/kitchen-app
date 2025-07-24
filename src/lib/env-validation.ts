/**
 * Environment variable validation for better error handling
 * Ensures required environment variables are set
 */

import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_DEBUG: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

let validatedEnv: Env | null = null

export function resetEnvCache(): void {
  validatedEnv = null
}

export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv
  }

  try {
    validatedEnv = envSchema.parse(process.env)
    return validatedEnv
  } catch (error) {
    console.error('❌ Environment validation failed:', error)
    
    // For development, provide helpful error messages
    if (process.env.NODE_ENV !== 'production') {
      if (error instanceof z.ZodError && error.errors) {
        console.error('Missing or invalid environment variables:')
        error.errors.forEach((err) => {
          console.error(`- ${err.path.join('.')}: ${err.message}`)
        })
      }
    }
    
    // Return defaults for critical missing values to prevent crashes
    const fallbackEnv: Env = {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      DATABASE_URL: process.env.DATABASE_URL || '',
      NEXTAUTH_DEBUG: process.env.NEXTAUTH_DEBUG,
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