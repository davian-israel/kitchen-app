import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

// Generate a secure random CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex')
}

// Set CSRF token in cookies
export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken()
  const cookieStore = cookies()
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  })
  
  return token
}

// Get CSRF token from cookies
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(CSRF_TOKEN_NAME)
  return token?.value || null
}

// Verify CSRF token from request
export function verifyCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  const formToken = request.headers.get('content-type')?.includes('application/x-www-form-urlencoded') 
    ? request.nextUrl.searchParams.get('csrf-token')
    : null

  if (!cookieToken) {
    return false
  }

  const submittedToken = headerToken || formToken
  if (!submittedToken) {
    return false
  }

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken, 'hex'),
    Buffer.from(submittedToken, 'hex')
  )
}

// Middleware helper for CSRF protection
export function createCSRFMiddleware() {
  return (request: NextRequest): { valid: boolean; error?: string } => {
    // Skip CSRF check for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return { valid: true }
    }

    // Skip CSRF check for auth endpoints (they have their own protection)
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
      return { valid: true }
    }

    const isValid = verifyCSRFToken(request)
    
    return {
      valid: isValid,
      error: isValid ? undefined : 'Invalid CSRF token'
    }
  }
}

// Client-side helper to get CSRF token for fetch requests
export async function getCSRFTokenForClient(): Promise<string> {
  try {
    const response = await fetch('/api/auth/csrf')
    const data = await response.json()
    return data.csrfToken || ''
  } catch (error) {
    console.error('Failed to get CSRF token:', error)
    return ''
  }
}

// Helper to add CSRF token to form data
export function addCSRFTokenToFormData(formData: FormData, token: string): void {
  formData.append('csrf-token', token)
}

// Helper to add CSRF token to headers
export function addCSRFTokenToHeaders(headers: Headers, token: string): void {
  headers.set(CSRF_HEADER_NAME, token)
}