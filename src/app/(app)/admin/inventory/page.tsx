'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Calendar, 
  TrendingDown, 
  Edit, 
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minThreshold?: number
  expirationDate?: string
  cost?: number
  supplier?: string
  createdAt: string
  updatedAt: string
  transactions: Array<{
    id: string
    type: string
    quantity: number
    reason?: string
    cost?: number
    timestamp: string
  }>
}


export default function InventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showExpiring, setShowExpiring] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

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
        fetchInventory()
      }
    }
  }, [session, router])

  const filterItems = useCallback(() => {
    let filtered = items

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Low stock filter
    if (showLowStock) {
      filtered = filtered.filter(item => 
        item.minThreshold && item.quantity <= item.minThreshold
      )
    }

    // Expiring soon filter
    if (showExpiring) {
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      
      filtered = filtered.filter(item => 
        item.expirationDate && new Date(item.expirationDate) <= sevenDaysFromNow
      )
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, selectedCategory, showLowStock, showExpiring])

  useEffect(() => {
    filterItems()
  }, [filterItems])

  const fetchInventory = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/admin/inventory')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
        setError('')
      } else {
        setError('Failed to fetch inventory')
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      setError('Failed to load inventory')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const categories = ['ALL', ...new Set(items.map(item => item.category))]

  const isLowStock = (item: InventoryItem) => {
    return item.minThreshold && item.quantity <= item.minThreshold
  }

  const isExpiringSoon = (item: InventoryItem) => {
    if (!item.expirationDate) return false
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    return new Date(item.expirationDate) <= sevenDaysFromNow
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/inventory/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchInventory()
      } else {
        setError('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      setError('Failed to delete item')
    }
  }

  const exportInventory = () => {
    const csvContent = [
      ['Name', 'Category', 'Quantity', 'Unit', 'Min Threshold', 'Expiration Date', 'Cost', 'Supplier'].join(','),
      ...filteredItems.map(item => [
        item.name,
        item.category,
        item.quantity,
        item.unit,
        item.minThreshold || '',
        item.expirationDate ? formatDate(item.expirationDate) : '',
        item.cost || '',
        item.supplier || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
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
                <Link href="/admin/orders" className="text-gray-700 hover:text-orange-600 font-medium">
                  Orders
                </Link>
                <Link href="/admin/meals" className="text-gray-700 hover:text-orange-600 font-medium">
                  Meals
                </Link>
                <Link href="/admin/inventory" className="text-orange-600 font-medium">
                  Inventory
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Track stock levels and manage inventory items</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchInventory}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportInventory}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Inventory Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                <p className="text-sm text-gray-600">Total Items</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {items.filter(item => isLowStock(item)).length}
                </p>
                <p className="text-sm text-gray-600">Low Stock</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {items.filter(item => isExpiringSoon(item)).length}
                </p>
                <p className="text-sm text-gray-600">Expiring Soon</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <TrendingDown className="w-8 h-8 text-gray-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${items.reduce((sum, item) => sum + (item.cost ? item.cost * item.quantity : 0), 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'ALL' ? 'All Categories' : category}
                </option>
              ))}
            </select>

            {/* Filter Toggles */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Low Stock</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showExpiring}
                  onChange={(e) => setShowExpiring(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Expiring</span>
              </label>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-end">
              <span className="text-sm text-gray-600">
                Showing {filteredItems.length} of {items.length} items
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        {filteredItems.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.supplier && (
                            <div className="text-sm text-gray-500">Supplier: {item.supplier}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.quantity} {item.unit}
                        </div>
                        {item.minThreshold && (
                          <div className="text-xs text-gray-500">
                            Min: {item.minThreshold} {item.unit}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {isLowStock(item) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Low Stock
                            </span>
                          )}
                          {isExpiringSoon(item) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Calendar className="w-3 h-3 mr-1" />
                              Expiring Soon
                            </span>
                          )}
                          {!isLowStock(item) && !isExpiringSoon(item) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Good
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.expirationDate ? formatDate(item.expirationDate) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.cost ? `$${item.cost.toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {items.length === 0 ? 'No inventory items' : 'No items match your filters'}
            </h2>
            <p className="text-gray-600 mb-6">
              {items.length === 0 
                ? 'Start by adding your first inventory item.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {items.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </button>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit Item Modal would go here */}
      {(showAddForm || editingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <p className="text-gray-600 mb-4">
              Item form would be implemented here with all the necessary fields.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingItem(null)
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-medium"
              >
                Cancel
              </button>
              <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md font-medium">
                {editingItem ? 'Update' : 'Add'} Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}