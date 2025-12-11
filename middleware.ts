import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { securityHeaders } from '@/lib/validation'
import { apiRateLimit, authRateLimit, adminRateLimit, addRateLimitHeaders, getClientIdentifier } from '@/lib/rate-limit'
import { auditLogger, AuditAction } from '@/lib/audit-logger'
// CSRF middleware import removed - using NextAuth's built-in CSRF protection
// import { createCSRFMiddleware } from '@/lib/csrf'

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
    
    // Apply stricter rate limiting to auth endpoints (but exclude NextAuth callbacks)
    if ((pathname.startsWith('/api/auth/') && !pathname.includes('/callback/')) || pathname.includes('login') || pathname.includes('register')) {
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

  // CSRF protection is now handled by NextAuth's built-in CSRF protection
  // Custom CSRF middleware has been disabled to prevent conflicts

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/register',
    '/api/auth',  // This covers all NextAuth routes including callbacks
    '/_next',
    '/favicon.ico'
  ]

  // Admin routes
  const adminRoutes = [
    '/admin',
    '/api/admin',
  ]

  // Kitchen staff routes
  const kitchenRoutes = [
    '/kitchen',
    '/api/kitchen',
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
    const userRole = (session as any)?.user?.role;
    if (!userRole || userRole !== 'ADMIN') {
      // Log unauthorized admin access attempt
      await auditLogger.logSecurity(
        AuditAction.UNAUTHORIZED_ACCESS,
        (session as any)?.user?.id || 'anonymous',
        request,
        { 
          path: pathname, 
          reason: 'insufficient_privileges', 
          userRole: userRole 
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
        (session as any)?.user?.id || 'admin',
        request,
        undefined,
        { path: pathname }
      )
    }
  }

  // Check kitchen routes
  if (kitchenRoutes.some(route => pathname.startsWith(route))) {
    const userRole = (session as any)?.user?.role;
    if (!userRole || (userRole !== 'KITCHEN_STAFF' && userRole !== 'ADMIN')) {
      // Log unauthorized kitchen access attempt
      await auditLogger.logSecurity(
        AuditAction.UNAUTHORIZED_ACCESS,
        (session as any)?.user?.id || 'anonymous',
        request,
        { 
          path: pathname, 
          reason: 'insufficient_privileges_kitchen', 
          userRole: userRole 
        }
      )

      if (pathname.startsWith('/api/')) {
        const forbiddenResponse = NextResponse.json({ error: 'Forbidden - Kitchen staff access required' }, { status: 403 })
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
  }

  // Check if user account is disabled
  const userStatus = (session as any)?.user?.status;
  if (userStatus === 'DISABLED') {
    await auditLogger.logSecurity(
      AuditAction.UNAUTHORIZED_ACCESS,
      (session as any)?.user?.id || 'disabled-user',
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