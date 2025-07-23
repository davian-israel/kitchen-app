'use client'

import { useCart } from '@/contexts/CartContext'
import { ShoppingBag } from 'lucide-react'

export default function CartButton() {
  const { state, toggleCart } = useCart()

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors"
    >
      <ShoppingBag className="w-6 h-6" />
      {state.totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {state.totalItems > 99 ? '99+' : state.totalItems}
        </span>
      )}
    </button>
  )
}