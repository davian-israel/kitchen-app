import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { securityHeaders } from '@/lib/validation'
import { apiRateLimit, authRateLimit, adminRateLimit, addRateLimitHeaders, getClientIdentifier } from '@/lib/rate-limit'
import { auditLogger, AuditAction } from '@/lib/audit-logger'
import { createCSRFMiddleware } from '@/lib/csrf'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create response with security headers
  const response = NextResponse.next()
  
  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    let rateLimitResult
    
    // Apply stricter rate limiting to auth endpoints
    if (pathname.startsWith('/api/auth/') || pathname.includes('login') || pathname.includes('register')) {
      rateLimitResult = authRateLimit(request)
    } else if (pathname.startsWith('/api/admin/')) {
      rateLimitResult = adminRateLimit(request)
    } else {
      rateLimitResult = apiRateLimit(request)
    }
    
    if (!rateLimitResult.success) {
      // Log rate limit exceeded
      await auditLogger.logSecurity(
        AuditAction.RATE_LIMIT_EXCEEDED,
        undefined,
        request,
        {
          path: pathname,
          limit: rateLimitResult.limit,
          resetTime: rateLimitResult.resetTime,
          clientId: getClientIdentifier(request)
        }
      )

      const rateLimitResponse = NextResponse.json(
        {
          error: 'Too many requests',
          message: rateLimitResult.message || 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      )
      
      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        rateLimitResponse.headers.set(key, value)
      })
      
      // Add rate limit headers
      addRateLimitHeaders(rateLimitResponse.headers, rateLimitResult)
      
      return rateLimitResponse
    }

    // Add rate limit headers to successful responses
    addRateLimitHeaders(response.headers, rateLimitResult)

  }

  const session = await auth()

  // Apply CSRF protection to API routes (except auth endpoints) after getting session
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const csrfMiddleware = createCSRFMiddleware()
    const csrfResult = csrfMiddleware(request)
    
    if (!csrfResult.valid) {
      // Log CSRF token validation failure
      await auditLogger.logSecurity(
        AuditAction.INVALID_TOKEN,
        session?.user?.id,
        request,
        {
          path: pathname,
          error: csrfResult.error,
          tokenType: 'csrf'
        }
      )

      const csrfResponse = NextResponse.json(
        {
          error: 'Invalid CSRF token',
          message: csrfResult.error || 'CSRF token validation failed',
        },
        { status: 403 }
      )
      
      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        csrfResponse.headers.set(key, value)
      })
      
      return csrfResponse
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/register',
    '/api/auth/register',
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/session',
    '/api/auth/providers',
    '/api/auth/csrf',
    '/api/auth/callback',
    '/_next',
    '/favicon.ico'
  ]

  // Admin routes
  const adminRoutes = [
    '/admin',
    '/api/admin',
  ]

  // Check if the route is public
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (session && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/register'))) {
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
      Object.entries(securityHeaders).forEach(([key, value]) => {
        redirectResponse.headers.set(key, value)
      })
      return redirectResponse
    }
    return response
  }

  // Check if user is authenticated
  if (!session) {
    // Log unauthorized access attempt
    await auditLogger.logSecurity(
      AuditAction.UNAUTHORIZED_ACCESS,
      undefined,
      request,
      { path: pathname, reason: 'no_session' }
    )

    // Return 401 for API routes
    if (pathname.startsWith('/api/')) {
      const unauthorizedResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      Object.entries(securityHeaders).forEach(([key, value]) => {
        unauthorizedResponse.headers.set(key, value)
      })
      return unauthorizedResponse
    }
    
    // Redirect to signin for web routes
    const redirectResponse = NextResponse.redirect(new URL('/auth/signin', request.url))
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value)
    })
    return redirectResponse
  }

  // Check admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (session.user.role !== 'ADMIN') {
      // Log unauthorized admin access attempt
      await auditLogger.logSecurity(
        AuditAction.UNAUTHORIZED_ACCESS,
        session.user.id,
        request,
        { 
          path: pathname, 
          reason: 'insufficient_privileges', 
          userRole: session.user.role 
        }
      )

      if (pathname.startsWith('/api/')) {
        const forbiddenResponse = NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        Object.entries(securityHeaders).forEach(([key, value]) => {
          forbiddenResponse.headers.set(key, value)
        })
        return forbiddenResponse
      }
      
      const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url))
      Object.entries(securityHeaders).forEach(([key, value]) => {
        redirectResponse.headers.set(key, value)
      })
      return redirectResponse
    }

    // Log successful admin access
    if (pathname.startsWith('/admin')) {
      await auditLogger.logAdmin(
        AuditAction.ADMIN_ACCESS,
        session.user.id,
        request,
        undefined,
        { path: pathname }
      )
    }
  }

  // Check if user account is disabled
  if (session.user.status === 'DISABLED') {
    await auditLogger.logSecurity(
      AuditAction.UNAUTHORIZED_ACCESS,
      session.user.id,
      request,
      { path: pathname, reason: 'account_disabled' }
    )

    if (pathname.startsWith('/api/')) {
      const disabledResponse = NextResponse.json({ error: 'Account disabled' }, { status: 403 })
      Object.entries(securityHeaders).forEach(([key, value]) => {
        disabledResponse.headers.set(key, value)
      })
      return disabledResponse
    }
    
    const redirectResponse = NextResponse.redirect(new URL('/auth/signin', request.url))
    Object.entries(securityHeaders).forEach(([key, value]) => {
      redirectResponse.headers.set(key, value)
    })
    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}