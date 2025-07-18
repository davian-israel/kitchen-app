import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/auth'

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/register',
    '/api/auth/register',
  ]

  // API routes that require authentication
  const protectedApiRoutes = [
    '/api/orders',
    '/api/meals',
    '/api/inventory',
    '/api/users',
  ]

  // Admin routes
  const adminRoutes = [
    '/admin',
    '/api/admin',
  ]

  // Check if the route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (session && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/register'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!session) {
    // Redirect to signin for protected routes
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Check admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (session.user.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Check if user account is disabled
  if (session.user.status === 'DISABLED') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Account disabled' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return NextResponse.next()
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