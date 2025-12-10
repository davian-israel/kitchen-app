'use client'

import { useState } from 'react'
import { Clock, User, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import OrderStatusToggle from './OrderStatusToggle'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  createdAt: string
  customer: {
    name: string
    email: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    meal: {
      id: string
      name: string
      imageUrl: string
      category: string
    }
  }>
  statusHistory: Array<{
    status: string
    timestamp: string
    notes: string
  }>
}

interface OrderCardProps {
  order: Order
  onStatusUpdate: (orderId: string, newStatus: string) => Promise<void>
}

export default function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)} hr ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'IN_PREPARATION':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'READY':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      await onStatusUpdate(order.id, newStatus)
    } finally {
      setUpdating(false)
    }
  }

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                Order #{order.orderNumber}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{order.customer.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(order.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>{totalItems} items</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Items Summary (Always Visible) */}
        <div className="space-y-2 mb-4">
          {order.items.slice(0, expanded ? undefined : 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                {item.meal.imageUrl && (
                  <img
                    src={item.meal.imageUrl}
                    alt={item.meal.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{item.meal.name}</p>
                  <p className="text-sm text-gray-500">{item.meal.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">x{item.quantity}</p>
                <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
          {!expanded && order.items.length > 3 && (
            <p className="text-sm text-gray-500 text-center py-2">
              +{order.items.length - 3} more items
            </p>
          )}
        </div>

        {/* Status Actions */}
        <OrderStatusToggle
          currentStatus={order.status}
          onStatusChange={handleStatusChange}
          updating={updating}
        />

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Customer Details</h4>
                <p className="text-sm text-gray-600">{order.customer.name}</p>
                <p className="text-sm text-gray-500">{order.customer.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Order Summary</h4>
                <p className="text-sm text-gray-600">Total: ${order.totalAmount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Payment: {order.paymentStatus}</p>
              </div>
            </div>

            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Status History</h4>
                <div className="space-y-2">
                  {order.statusHistory.map((history, index) => (
                    <div key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                      <span className="text-gray-400">•</span>
                      <div>
                        <span className="font-medium">{history.status}</span>
                        {history.notes && <span className="text-gray-500"> - {history.notes}</span>}
                        <span className="text-gray-400 text-xs ml-2">
                          {new Date(history.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

