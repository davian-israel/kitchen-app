'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { ShoppingBag } from 'lucide-react'

export default function CartButton() {
  const { state } = useCart()
  const router = useRouter()

  const handleCartClick = () => {
    router.push('/cart')
  }

  return (
    <button
      onClick={handleCartClick}
      className="relative p-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-700 hover:text-blue-600 transition-all duration-200 transform hover:scale-105"
      title="View Shopping Cart"
      aria-label={`Shopping cart with ${state.totalItems} items`}
    >
      <ShoppingBag className="w-5 h-5" />
      {state.totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-orange-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md animate-pulse">
          {state.totalItems > 99 ? '99+' : state.totalItems}
        </span>
      )}
    </button>
  )
}