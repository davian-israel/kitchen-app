'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, CheckCircle, Package, ChefHat, AlertCircle, MapPin, Phone, User, RefreshCw } from 'lucide-react'
import ResponsiveHeader from '@/components/navigation/ResponsiveHeader'

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED'
  totalAmount: number
  paymentMethod: string
  customerInfo: {
    name: string
    email: string
    phone: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
    }
    deliveryInstructions?: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    meal: {
      id: string
      name: string
      description: string
      imageUrl?: string
      category: string
    }
  }>
  createdAt: string
  updatedAt: string
  statusHistory: Array<{
    id: string
    status: string
    timestamp: string
    notes?: string
  }>
}

const statusConfig = {
  PENDING: {
    label: 'Order Received',
    description: 'Your order has been received and is being prepared',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    icon: Clock
  },
  IN_PROGRESS: {
    label: 'Cooking',
    description: 'Our chefs are preparing your delicious meal',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    icon: ChefHat
  },
  READY: {
    label: 'Ready for Pickup/Delivery',
    description: 'Your order is ready and will be delivered soon',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
    icon: Package
  },
  COMPLETED: {
    label: 'Delivered',
    description: 'Your order has been completed and delivered',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    icon: CheckCircle
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'This order has been cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    icon: AlertCircle
  }
}

const statusOrder = ['PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED']

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (session) {
      fetchOrders()
    }
  }, [session])

  const fetchOrders = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
        setError('')
      } else {
        setError('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const getOrderProgress = (order: Order) => {
    const currentIndex = statusOrder.indexOf(order.status)
    return currentIndex >= 0 ? currentIndex + 1 : 0
  }

  const getEstimatedTime = (order: Order) => {
    const createdAt = new Date(order.createdAt)
    const now = new Date()
    const elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60))
    
    switch (order.status) {
      case 'PENDING':
        return '5-10 minutes until cooking starts'
      case 'IN_PROGRESS':
        const cookingTime = Math.max(20 - elapsedMinutes, 5)
        return `${cookingTime}-${cookingTime + 10} minutes until ready`
      case 'READY':
        return '5-15 minutes for delivery'
      case 'COMPLETED':
        return 'Order completed'
      case 'CANCELLED':
        return 'Order cancelled'
      default:
        return 'Calculating...'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const reorderItems = (order: Order) => {
    // This would typically add items back to cart
    // For now, we'll just redirect to menu
    window.location.href = '/menu'
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <ResponsiveHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your orders and view order history</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {orders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            {/* Orders List */}
            <div className="space-y-4 lg:space-y-6">
              {orders.map((order) => {
                const config = statusConfig[order.status]
                const StatusIcon = config.icon
                const progress = getOrderProgress(order)
                const isActive = ['PENDING', 'IN_PROGRESS', 'READY'].includes(order.status)
                
                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all touch-manipulation ${
                      selectedOrder?.id === order.id ? 'ring-2 ring-orange-500' : 'hover:shadow-lg'
                    } ${isActive ? 'border-l-4 border-orange-500' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="p-4 sm:p-6">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div className="mb-2 sm:mb-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-lg font-bold text-orange-600">
                            ${order.totalAmount.toFixed(2)}
                          </p>
                          {isActive && (
                            <p className="text-xs text-gray-500 hidden sm:block">
                              Click for details
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.color} ${config.borderColor} mb-4`}>
                        <StatusIcon className="w-4 h-4 mr-2" />
                        {config.label}
                      </div>

                      {/* Progress Bar for Active Orders */}
                      {isActive && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>Order Progress</span>
                            <span>{progress}/4 steps</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${(progress / 4) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Estimated Time */}
                      {isActive && (
                        <div className="mb-4 p-3 bg-orange-50 rounded-md">
                          <p className="text-sm font-medium text-orange-800">
                            {getEstimatedTime(order)}
                          </p>
                        </div>
                      )}

                      {/* Order Items Preview */}
                      <div className="space-y-2">
                        {order.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 text-sm">
                            <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {item.quantity}
                            </span>
                            <span className="text-gray-900">{item.meal.name}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-sm text-gray-500">
                            +{order.items.length - 2} more items
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrder(order)
                          }}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                        >
                          View Details
                        </button>
                        {order.status === 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              reorderItems(order)
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm font-medium"
                          >
                            Reorder
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Details Panel */}
            <div className="lg:sticky lg:top-8">
              {selectedOrder ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Order Details
                  </h2>

                  {/* Order Info */}
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Order Number</p>
                        <p className="font-medium">{selectedOrder.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Amount</p>
                        <p className="font-medium">${selectedOrder.totalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Method</p>
                        <p className="font-medium capitalize">{selectedOrder.paymentMethod.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Order Date</p>
                        <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Order Status</h3>
                    <div className="space-y-3">
                      {selectedOrder.statusHistory.map((status, index) => {
                        const config = statusConfig[status.status as keyof typeof statusConfig]
                        const StatusIcon = config?.icon || Clock
                        
                        return (
                          <div key={status.id} className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${config?.bgColor || 'bg-gray-100'}`}>
                              <StatusIcon className={`w-4 h-4 ${config?.color || 'text-gray-600'}`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {config?.label || status.status}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(status.timestamp)}
                              </p>
                              {status.notes && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {status.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Delivery Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{selectedOrder.customerInfo.name}</p>
                          <p className="text-sm text-gray-600">{selectedOrder.customerInfo.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <p className="text-gray-900">{selectedOrder.customerInfo.phone}</p>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-gray-900">{selectedOrder.customerInfo.address.street}</p>
                          <p className="text-gray-600">
                            {selectedOrder.customerInfo.address.city}, {selectedOrder.customerInfo.address.state} {selectedOrder.customerInfo.address.zipCode}
                          </p>
                          {selectedOrder.customerInfo.deliveryInstructions && (
                            <p className="text-sm text-gray-500 mt-1">
                              <strong>Instructions:</strong> {selectedOrder.customerInfo.deliveryInstructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Order Items</h3>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          {item.meal.imageUrl ? (
                            <img
                              src={item.meal.imageUrl}
                              alt={item.meal.name}
                              className="w-12 h-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.meal.name}</h4>
                            <p className="text-sm text-gray-600">{item.meal.category}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                            <p className="text-sm text-gray-600">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Order</h3>
                  <p className="text-gray-600">Click on an order to view detailed tracking information</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start by browsing our delicious menu!
            </p>
            <Link
              href="/menu"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Browse Menu
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}