'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import MobileNav from './MobileNav'
import CartButton from '@/components/cart/CartButton'

interface ResponsiveHeaderProps {
  title?: string
  showCart?: boolean
}

export default function ResponsiveHeader({ 
  title = "Israel Kitchen", 
  showCart = true 
}: ResponsiveHeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  
  const isAdmin = session?.user?.role === 'ADMIN'
  const isAdminRoute = pathname?.startsWith('/admin')

  // Customer navigation links
  const customerLinks = [
    { href: '/menu', label: 'Menu' },
    { href: '/orders', label: 'My Orders' },
    { href: '/profile', label: 'Profile' },
  ]

  // Admin navigation links
  const adminLinks = [
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/meals', label: 'Meals' },
    { href: '/admin/inventory', label: 'Inventory' },
    { href: '/admin/users', label: 'Users' },
  ]

  const links = isAdminRoute ? adminLinks : customerLinks
  const homeLink = isAdminRoute ? '/admin' : '/dashboard'

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Title */}
          <div className="flex items-center space-x-8">
            <Link 
              href={homeLink} 
              className="text-xl font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              {title}
              {isAdminRoute && <span className="text-sm font-normal text-gray-500 ml-2">Admin</span>}
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-medium transition-colors ${
                      isActive
                        ? 'text-orange-600'
                        : 'text-gray-700 hover:text-orange-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            {showCart && !isAdminRoute && <CartButton />}
            
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-600">
                  {session?.user?.email}
                </p>
              </div>
              
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </div>

            {/* Sign Out */}
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>

          {/* Mobile Navigation */}
          <MobileNav userRole={session?.user?.role} />
        </div>
      </div>
    </nav>
  )
}