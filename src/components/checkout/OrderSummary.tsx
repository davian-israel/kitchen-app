'use client'

import { CartItem } from '@/contexts/CartContext'

interface OrderSummaryProps {
  items: CartItem[]
  total: number
}

export default function OrderSummary({ items, total }: OrderSummaryProps) {
  const subtotal = total
  const deliveryFee = 5.99
  const tax = subtotal * 0.08 // 8% tax
  const finalTotal = subtotal + deliveryFee + tax

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
      
      {/* Order Items */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-12 h-12 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 text-xs">No Image</span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
              <p className="text-sm text-gray-500">{item.category}</p>
              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
            </div>
            
            <div className="text-sm font-semibold text-gray-900">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      
      {/* Order Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="text-gray-900">${deliveryFee.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (8%)</span>
          <span className="text-gray-900">${tax.toFixed(2)}</span>
        </div>
        
        <div className="border-t pt-2 flex justify-between text-lg font-semibold">
          <span className="text-gray-900">Total</span>
          <span className="text-orange-600">${finalTotal.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Estimated Delivery */}
      <div className="mt-6 p-3 bg-orange-50 rounded-md">
        <div className="flex items-center justify-between text-sm">
          <span className="text-orange-800 font-medium">Estimated Delivery</span>
          <span className="text-orange-600">30-45 minutes</span>
        </div>
      </div>
      
      {/* Order Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• All orders are prepared fresh to order</p>
        <p>• Delivery times may vary based on location and demand</p>
        <p>• You will receive order updates via email and SMS</p>
      </div>
    </div>
  )
}