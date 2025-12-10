'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChefHat, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import OrderList from '@/components/kitchen/OrderList'

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

export default function KitchenOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  // Check authorization
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'KITCHEN_STAFF' && session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/kitchen/orders')
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
      filterOrders(data.orders || [], activeFilter)
    } catch (err) {
      setError('Failed to load orders. Please try again.')
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'KITCHEN_STAFF' || session?.user?.role === 'ADMIN') {
      fetchOrders()
    }
  }, [session])

  // Filter orders by status
  const filterOrders = (orderList: Order[], filter: string) => {
    if (filter === 'all') {
      setFilteredOrders(orderList)
    } else {
      setFilteredOrders(orderList.filter(order => order.status === filter.toUpperCase()))
    }
  }

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    filterOrders(orders, filter)
  }

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      // Refresh orders after update
      await fetchOrders()
    } catch (err) {
      console.error('Error updating order status:', err)
      alert('Failed to update order status. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-orange-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  const pendingCount = orders.filter(o => o.status === 'PENDING').length
  const preparingCount = orders.filter(o => o.status === 'IN_PREPARATION').length
  const readyCount = orders.filter(o => o.status === 'READY').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChefHat className="w-8 h-8 text-orange-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kitchen Orders</h1>
                <p className="text-sm text-gray-600">Manage and prepare customer orders</p>
              </div>
            </div>
            <button
              onClick={fetchOrders}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">In Preparation</p>
                  <p className="text-2xl font-bold text-blue-900">{preparingCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Ready</p>
                  <p className="text-2xl font-bold text-green-900">{readyCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'in_preparation', 'ready'].map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === filter
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {filter === 'all' && 'All Orders'}
              {filter === 'pending' && 'Pending'}
              {filter === 'in_preparation' && 'In Preparation'}
              {filter === 'ready' && 'Ready'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {activeFilter === 'all'
                ? 'There are no paid orders at the moment.'
                : `No ${activeFilter.replace('_', ' ')} orders.`}
            </p>
          </div>
        ) : (
          <OrderList
            orders={filteredOrders}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>
    </div>
  )
}

