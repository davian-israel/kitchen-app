'use client'

import Link from 'next/link'
import { ShoppingBag, ChefHat, Utensils } from 'lucide-react'

interface EmptyCartProps {
  onContinueShopping?: () => void
}

export default function EmptyCart({ onContinueShopping }: EmptyCartProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center">
      {/* Empty Cart Icon */}
      <div className="relative mb-8">
        <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto" />
        <div className="absolute -top-2 -right-2 bg-orange-100 rounded-full p-2">
          <ChefHat className="w-6 h-6 text-orange-600" />
        </div>
      </div>

      {/* Main Message */}
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Your cart is empty
      </h2>
      
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        Looks like you haven't added any delicious meals to your cart yet. 
        Start exploring our authentic Israel cuisine!
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link
          href="/menu"
          onClick={onContinueShopping}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold text-center transition-colors duration-200 flex items-center justify-center"
        >
          <Utensils className="w-5 h-5 mr-2" />
          Browse Menu
        </Link>
        
        <Link
          href="/dashboard"
          className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-3 rounded-lg font-semibold text-center transition-colors duration-200"
        >
          Go to Dashboard
        </Link>
      </div>

      {/* Featured Categories or Recommendations */}
      <div className="mt-12 w-full max-w-4xl">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Popular Categories
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Main Dishes', emoji: '🍽️', href: '/menu?category=main' },
            { name: 'Appetizers', emoji: '🥙', href: '/menu?category=appetizer' },
            { name: 'Desserts', emoji: '🍰', href: '/menu?category=dessert' },
          ].map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group bg-white border border-gray-200 hover:border-orange-300 rounded-lg p-6 text-center transition-all duration-200 hover:shadow-md"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                {category.emoji}
              </div>
              <h4 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                {category.name}
              </h4>
            </Link>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-sm text-gray-500">
        <p>Need help? Contact us at support@israelkitchen.com</p>
      </div>
    </div>
  )
}