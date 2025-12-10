'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Star, User, LogOut, ChefHat } from 'lucide-react'
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
  const isKitchenStaff = session?.user?.role === 'KITCHEN_STAFF'
  const isAdminRoute = pathname?.startsWith('/admin')
  const isKitchenRoute = pathname?.startsWith('/kitchen')

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

  // Kitchen staff navigation links
  const kitchenLinks = [
    { href: '/kitchen/orders', label: 'Kitchen Orders' },
    { href: '/profile', label: 'Profile' },
  ]

  // Determine which links to show
  let links = customerLinks
  if (isAdminRoute) {
    links = adminLinks
  } else if (isKitchenRoute || isKitchenStaff) {
    links = kitchenLinks
  }
  
  // Determine home link based on user role and current route
  let homeLink = '/dashboard'
  if (isAdminRoute) {
    homeLink = '/admin'
  } else if (isKitchenRoute || isKitchenStaff) {
    homeLink = '/kitchen/orders'
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-1.5">
          {/* Logo/Title */}
          <div className="flex items-center space-x-8">
            <Link 
              href={homeLink} 
              className="flex items-center space-x-2 group transition-all duration-200"
            >
              <div className="bg-gradient-to-br from-blue-600 to-orange-500 p-2 rounded-full group-hover:scale-105 transition-transform">
                <Star className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {title}
                </h1>
                {isAdminRoute && (
                  <span className="text-xs font-medium text-orange-500">Admin Portal</span>
                )}
                {isKitchenRoute && (
                  <span className="text-xs font-medium text-blue-500">Kitchen Portal</span>
                )}
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-black text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-black'
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
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 bg-gray-50 rounded-full pr-2 py-1">
              <div className="text-right px-3">
                <p className="text-sm font-semibold text-gray-900">
                  Hello {session?.user?.name?.split(' ')[0] || 'User'}!
                </p>
                <p className="text-xs text-gray-600">
                  {isAdminRoute ? 'Administrator' : 'Customer'}
                </p>
              </div>
              
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">
                  {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-transparent hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>

          {/* Mobile Navigation */}
          <MobileNav userRole={session?.user?.role as 'CUSTOMER' | 'ADMIN' | 'KITCHEN_STAFF' | undefined} />
        </div>
      </div>
      
      {/* Cultural Accent Line */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-white to-orange-500"></div>
    </nav>
  )
}