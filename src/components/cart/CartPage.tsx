'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, AlertTriangle, Star, ShoppingBag } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import CartItem from './CartItem'
import CartSummary from './CartSummary'
import EmptyCart from './EmptyCart'
import ResponsiveHeader from '../navigation/ResponsiveHeader'

export default function CartPage() {
  const { data: session } = useSession()
  const { state, updateQuantity, removeItem, clearCart } = useCart()
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  // Simulate cart validation on mount
  useEffect(() => {
    validateCart()
  }, [])

  const validateCart = async () => {
    setIsValidating(true)
    setValidationError(null)
    
    try {
      // Simulate API call to validate cart items
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock validation logic - check for out of stock items
      const outOfStockItems = state.items.filter(item => 
        // Simulate some items being out of stock
        item.name.toLowerCase().includes('special')
      )
      
      if (outOfStockItems.length > 0) {
        setValidationError(
          `Some items may no longer be available: ${outOfStockItems.map(item => item.name).join(', ')}`
        )
      }
    } catch (error) {
      setValidationError('Failed to validate cart. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    setUpdatingItems(prev => new Set([...prev, id]))
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      updateQuantity(id, quantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (id: string) => {
    setUpdatingItems(prev => new Set([...prev, id]))
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      removeItem(id)
    } catch (error) {
      console.error('Failed to remove item:', error)
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      try {
        clearCart()
      } catch (error) {
        console.error('Failed to clear cart:', error)
      }
    }
  }

  const handleSaveForLater = (id: string) => {
    // Mock save for later functionality
    console.log('Save for later:', id)
    // In a real app, this would update the item's savedForLater status
  }

  const handleMoveToCart = (id: string) => {
    // Mock move to cart functionality
    console.log('Move to cart:', id)
    // In a real app, this would move item from saved list back to cart
  }

  // Show empty cart if no items
  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ResponsiveHeader />
        <EmptyCart />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ResponsiveHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/menu" className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Menu
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl shadow-lg p-6 mb-8 text-white cultural-pattern">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4 backdrop-blur-sm">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  Shopping Cart
                </h1>
                <p className="text-white/90">
                  {state.totalItems} item{state.totalItems !== 1 ? 's' : ''} ready for checkout
                </p>
              </div>
            </div>
            
            {state.items.length > 1 && (
              <button
                onClick={handleClearCart}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium transition-all border border-white/30"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {/* Validation Status */}
        {isValidating && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl card-israel">
            <div className="flex items-center">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mr-3" />
              <span className="text-blue-800 font-medium">Validating cart items...</span>
            </div>
          </div>
        )}

        {validationError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl card-israel">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  Cart Validation Warning
                </h3>
                <p className="text-sm text-yellow-700">{validationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items - Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg card-israel">
              {/* Cart Items Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-orange-500 mr-2" fill="currentColor" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Your Selected Items
                  </h2>
                </div>
                <div className="flex items-center mt-2">
                  <button
                    onClick={validateCart}
                    disabled={isValidating}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isValidating ? 'animate-spin' : ''}`} />
                    Refresh Cart
                  </button>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="p-6">
                <div className="space-y-6">
                  {state.items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemoveItem={handleRemoveItem}
                      onSaveForLater={handleSaveForLater}
                      onMoveToCart={handleMoveToCart}
                      isUpdating={updatingItems.has(item.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cart Summary - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <CartSummary
                items={state.items}
                total={state.totalAmount}
                onProceedToCheckout={() => {
                  // Optional callback for analytics or other actions
                  console.log('Proceeding to checkout')
                }}
              />
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-6 text-sm text-gray-500">
            <Link href="/menu" className="hover:text-gray-700 transition-colors">
              Continue Shopping
            </Link>
            <span>•</span>
            <Link href="/orders" className="hover:text-gray-700 transition-colors">
              View Order History
            </Link>
            <span>•</span>
            <Link href="/profile" className="hover:text-gray-700 transition-colors">
              Account Settings
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}