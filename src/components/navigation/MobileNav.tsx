'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, UtensilsCrossed, Package, User, LogOut, ChefHat } from 'lucide-react'
import { useSession } from 'next-auth/react'
import CartButton from '@/components/cart/CartButton'

interface MobileNavProps {
  userRole?: 'CUSTOMER' | 'ADMIN' | 'KITCHEN_STAFF'
}

export default function MobileNav({ userRole }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const customerLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: '/orders', label: 'My Orders', icon: Package },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/meals', label: 'Meals', icon: UtensilsCrossed },
    { href: '/admin/inventory', label: 'Inventory', icon: Package },
    { href: '/admin/users', label: 'Users', icon: User },
  ]

  const kitchenStaffLinks = [
    { href: '/kitchen/orders', label: 'Kitchen Orders', icon: ChefHat },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  let links = customerLinks
  if (userRole === 'ADMIN') {
    links = adminLinks
  } else if (userRole === 'KITCHEN_STAFF') {
    links = kitchenStaffLinks
  }

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center space-x-2">
        <CartButton />
        <button
          onClick={toggleMenu}
          className="p-2 text-gray-600 hover:text-orange-600 transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-orange-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-600">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={closeMenu}
            className="p-2 hover:bg-orange-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className={`
                      flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-orange-100 text-orange-600 border-r-2 border-orange-600' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-orange-600'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </>
  )
}