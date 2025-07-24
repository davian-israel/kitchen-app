'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, User, MapPin, Phone, ChefHat, CheckCircle, AlertCircle, Package } from 'lucide-react'

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

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  READY: 'bg-green-100 text-green-800 border-green-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200'
}

const statusIcons = {
  PENDING: Clock,
  IN_PROGRESS: ChefHat,
  READY: Package,
  COMPLETED: CheckCircle,
  CANCELLED: AlertCircle
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      // Check if user is admin
      if (session.user.role !== 'ADMIN') {
        router.push('/dashboard')
      } else {
        fetchOrders()
      }
    }
  }, [session])

  useEffect(() => {
    filterOrders()
  }, [orders, selectedStatus])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      } else {
        setError('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setError('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }

    // Sort by creation date (FIFO - oldest first for pending orders)
    filtered.sort((a, b) => {
      if (a.status === 'PENDING' && b.status === 'PENDING') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      // For other statuses, show most recent first
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string) => {
    setUpdatingOrder(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || `Status updated to ${newStatus}`
        }),
      })

      if (response.ok) {
        // Refresh orders
        await fetchOrders()
      } else {
        setError('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      setError('Failed to update order')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const getStatusActions = (order: Order) => {
    const actions = []
    
    switch (order.status) {
      case 'PENDING':
        actions.push({
          label: 'Start Cooking',
          status: 'IN_PROGRESS',
          color: 'bg-blue-600 hover:bg-blue-700'
        })
        actions.push({
          label: 'Cancel',
          status: 'CANCELLED',
          color: 'bg-red-600 hover:bg-red-700'
        })
        break
      case 'IN_PROGRESS':
        actions.push({
          label: 'Mark Ready',
          status: 'READY',
          color: 'bg-green-600 hover:bg-green-700'
        })
        break
      case 'READY':
        actions.push({
          label: 'Complete Order',
          status: 'COMPLETED',
          color: 'bg-gray-600 hover:bg-gray-700'
        })
        break
    }
    
    return actions
  }

  const getPreparationTime = (order: Order) => {
    const createdAt = new Date(order.createdAt)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`
    } else {
      const hours = Math.floor(diffMinutes / 60)
      const minutes = diffMinutes % 60
      return `${hours}h ${minutes}m ago`
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-xl font-bold text-orange-600">
                Israel Kitchen - Admin
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link href="/admin/orders" className="text-orange-600 font-medium">
                  Orders
                </Link>
                <Link href="/admin/meals" className="text-gray-700 hover:text-orange-600 font-medium">
                  Meals
                </Link>
                <Link href="/admin" className="text-gray-700 hover:text-orange-600 font-medium">
                  Dashboard
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session.user.name || session.user.email}
              </span>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
          <p className="text-gray-600">Manage incoming orders and track kitchen operations</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Order Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {['PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED'].map((status) => {
            const count = orders.filter(order => order.status === status).length
            const StatusIcon = statusIcons[status as keyof typeof statusIcons]
            
            return (
              <div key={status} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center">
                  <StatusIcon className="w-8 h-8 text-gray-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {status.replace('_', ' ').toLowerCase()}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['ALL', 'PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedStatus === status
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {status === 'ALL' ? 'All Orders' : status.replace('_', ' ')}
                  {status !== 'ALL' && (
                    <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                      {orders.filter(order => order.status === status).length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status]
              const actions = getStatusActions(order)
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[order.status]}`}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">
                          ${order.totalAmount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getPreparationTime(order)}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{order.customerInfo.name}</p>
                          <p className="text-sm text-gray-600">{order.customerInfo.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <p className="text-gray-900">{order.customerInfo.phone}</p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="flex items-start space-x-3 mb-4">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-900">
                          {order.customerInfo.address.street}
                        </p>
                        <p className="text-gray-600">
                          {order.customerInfo.address.city}, {order.customerInfo.address.state} {order.customerInfo.address.zipCode}
                        </p>
                        {order.customerInfo.deliveryInstructions && (
                          <p className="text-sm text-gray-500 mt-1">
                            <strong>Instructions:</strong> {order.customerInfo.deliveryInstructions}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {actions.length > 0 && (
                      <div className="flex space-x-3">
                        {actions.map((action) => (
                          <button
                            key={action.status}
                            onClick={() => updateOrderStatus(order.id, action.status)}
                            disabled={updatingOrder === order.id}
                            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${action.color} ${
                              updatingOrder === order.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {updatingOrder === order.id ? 'Updating...' : action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          {item.meal.imageUrl ? (
                            <img
                              src={item.meal.imageUrl}
                              alt={item.meal.name}
                              className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{item.meal.name}</h5>
                            <p className="text-sm text-gray-600">{item.meal.category}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                            <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedStatus === 'ALL' ? 'No orders yet' : `No ${selectedStatus.toLowerCase().replace('_', ' ')} orders`}
            </h2>
            <p className="text-gray-600">
              {selectedStatus === 'ALL' 
                ? 'Orders will appear here when customers place them.'
                : `Orders with ${selectedStatus.toLowerCase().replace('_', ' ')} status will appear here.`
              }
            </p>
          </div>
        )}
      </main>
    </div>
  )
}