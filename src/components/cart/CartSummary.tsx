'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ShoppingBag, Truck, Clock, Tag, Info } from 'lucide-react'
import { CartItem } from '@/contexts/CartContext'

interface CartSummaryProps {
  items: CartItem[]
  total: number
  onProceedToCheckout?: () => void
  className?: string
}

interface DeliveryOption {
  id: string
  name: string
  description: string
  price: number
  estimatedTime: string
  icon: React.ReactNode
}

const deliveryOptions: DeliveryOption[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Regular delivery during business hours',
    price: 4.99,
    estimatedTime: '45-60 min',
    icon: <Truck className="w-4 h-4" />
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Priority delivery for faster service',
    price: 8.99,
    estimatedTime: '25-35 min',
    icon: <Clock className="w-4 h-4" />
  }
]

export default function CartSummary({
  items,
  total,
  onProceedToCheckout,
  className = ''
}: CartSummaryProps) {
  const [selectedDelivery, setSelectedDelivery] = useState(deliveryOptions[0].id)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState<{
    code: string
    discount: number
    type: 'percentage' | 'fixed'
  } | null>(null)
  const [showPromoInput, setShowPromoInput] = useState(false)

  // Calculate various totals
  const calculations = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    
    // Tax calculation (8.25% as example)
    const taxRate = 0.0825
    const taxAmount = subtotal * taxRate
    
    // Delivery fee
    const selectedDeliveryOption = deliveryOptions.find(opt => opt.id === selectedDelivery)
    const deliveryFee = selectedDeliveryOption?.price || 0
    
    // Promo discount
    let discountAmount = 0
    if (promoApplied) {
      if (promoApplied.type === 'percentage') {
        discountAmount = subtotal * (promoApplied.discount / 100)
      } else {
        discountAmount = promoApplied.discount
      }
    }
    
    // Free delivery threshold
    const freeDeliveryThreshold = 25
    const qualifiesForFreeDelivery = subtotal >= freeDeliveryThreshold
    const finalDeliveryFee = qualifiesForFreeDelivery ? 0 : deliveryFee
    
    const grandTotal = subtotal + taxAmount + finalDeliveryFee - discountAmount
    
    return {
      subtotal,
      itemCount,
      taxAmount,
      deliveryFee: finalDeliveryFee,
      originalDeliveryFee: deliveryFee,
      discountAmount,
      grandTotal,
      qualifiesForFreeDelivery,
      freeDeliveryThreshold
    }
  }, [items, selectedDelivery, promoApplied])

  const handlePromoCodeSubmit = () => {
    // Mock promo code validation
    const validPromoCodes: Record<string, { discount: number; type: 'percentage' | 'fixed' }> = {
      'WELCOME10': { discount: 10, type: 'percentage' },
      'SAVE5': { discount: 5, type: 'fixed' },
      'FIRSTORDER': { discount: 15, type: 'percentage' }
    }

    const upperCode = promoCode.toUpperCase()
    if (validPromoCodes[upperCode]) {
      setPromoApplied({
        code: upperCode,
        ...validPromoCodes[upperCode]
      })
      setShowPromoInput(false)
    } else {
      // Show error (in a real app, you'd handle this with proper error state)
      alert('Invalid promo code')
    }
  }

  const handleRemovePromo = () => {
    setPromoApplied(null)
    setPromoCode('')
  }

  const isEmpty = items.length === 0

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <ShoppingBag className="w-5 h-5 mr-2" />
          Order Summary
        </h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Items Summary */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">
              Subtotal ({calculations.itemCount} item{calculations.itemCount !== 1 ? 's' : ''})
            </span>
            <span className="font-medium text-gray-900">
              ${calculations.subtotal.toFixed(2)}
            </span>
          </div>
        </div>

        {!isEmpty && (
          <>
            {/* Delivery Options */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Delivery Options</h3>
              <div className="space-y-2">
                {deliveryOptions.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:border-orange-300 transition-colors"
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={option.id}
                      checked={selectedDelivery === option.id}
                      onChange={(e) => setSelectedDelivery(e.target.value)}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                    />
                    <div className="ml-3 flex-grow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {option.icon}
                          <span className="ml-2 font-medium text-gray-900">
                            {option.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {calculations.qualifiesForFreeDelivery && option.id === selectedDelivery ? (
                              <span className="text-green-600">FREE</span>
                            ) : (
                              `$${option.price.toFixed(2)}`
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {option.estimatedTime}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              
              {/* Free Delivery Info */}
              {!calculations.qualifiesForFreeDelivery && (
                <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <Info className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    Add ${(calculations.freeDeliveryThreshold - calculations.subtotal).toFixed(2)} more for free delivery
                  </span>
                </div>
              )}
            </div>

            {/* Promo Code */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Promo Code</h3>
                {!promoApplied && !showPromoInput && (
                  <button
                    onClick={() => setShowPromoInput(true)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Add code
                  </button>
                )}
              </div>

              {showPromoInput && !promoApplied && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <button
                    onClick={handlePromoCodeSubmit}
                    disabled={!promoCode.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Apply
                  </button>
                </div>
              )}

              {promoApplied && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      {promoApplied.code} applied
                    </span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Order Breakdown */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${calculations.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span>
                  {calculations.qualifiesForFreeDelivery && calculations.originalDeliveryFee > 0 ? (
                    <>
                      <span className="line-through text-gray-400">
                        ${calculations.originalDeliveryFee.toFixed(2)}
                      </span>
                      <span className="ml-2 text-green-600">FREE</span>
                    </>
                  ) : (
                    `$${calculations.deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>
              
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${calculations.taxAmount.toFixed(2)}</span>
              </div>
              
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({promoApplied?.code})</span>
                  <span>-${calculations.discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-orange-600">
                  ${calculations.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Estimated Delivery Time */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  Estimated delivery: {
                    deliveryOptions.find(opt => opt.id === selectedDelivery)?.estimatedTime
                  }
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {!isEmpty && (
        <div className="p-6 border-t border-gray-200 space-y-3">
          <Link
            href="/checkout"
            onClick={onProceedToCheckout}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-md font-semibold text-center block transition-colors duration-200"
          >
            Proceed to Checkout
          </Link>
          <Link
            href="/menu"
            className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 py-2 px-4 rounded-md font-medium text-center block transition-colors duration-200"
          >
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  )
}