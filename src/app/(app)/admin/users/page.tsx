'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Shield, 
  User, 
  Calendar, 
  Activity,
  Eye,
  Edit,
  RefreshCw,
  Download
} from 'lucide-react'

interface UserData {
  id: string
  name?: string
  email: string
  role: 'CUSTOMER' | 'ADMIN'
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
  updatedAt: string
  emailVerified?: string
  image?: string
  orders: Array<{
    id: string
    orderNumber: string
    totalAmount: number
    status: string
    createdAt: string
  }>
  activityLogs: Array<{
    id: string
    action: string
    details?: any
    ipAddress?: string
    userAgent?: string
    timestamp: string
  }>
}

const roleColors = {
  CUSTOMER: 'bg-blue-100 text-blue-800',
  ADMIN: 'bg-purple-100 text-purple-800'
}

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  DISABLED: 'bg-red-100 text-red-800'
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)

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
        fetchUsers()
      }
    }
  }, [session])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, selectedRole, selectedStatus])

  const fetchUsers = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setError('')
      } else {
        setError('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (selectedRole !== 'ALL') {
      filtered = filtered.filter(user => user.role === selectedRole)
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(user => user.status === selectedStatus)
    }

    setFilteredUsers(filtered)
  }

  const updateUserStatus = async (userId: string, newStatus: 'ACTIVE' | 'DISABLED') => {
    setUpdatingUser(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchUsers()
        // Update selected user if it's the one being updated
        if (selectedUser?.id === userId) {
          const updatedUser = users.find(u => u.id === userId)
          if (updatedUser) {
            setSelectedUser({ ...updatedUser, status: newStatus })
          }
        }
      } else {
        setError('Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      setError('Failed to update user')
    } finally {
      setUpdatingUser(null)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'CUSTOMER' | 'ADMIN') => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return
    }

    setUpdatingUser(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        await fetchUsers()
        // Update selected user if it's the one being updated
        if (selectedUser?.id === userId) {
          const updatedUser = users.find(u => u.id === userId)
          if (updatedUser) {
            setSelectedUser({ ...updatedUser, role: newRole })
          }
        }
      } else {
        setError('Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      setError('Failed to update user')
    } finally {
      setUpdatingUser(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' at ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Registration Date', 'Last Login', 'Total Orders'].join(','),
      ...filteredUsers.map(user => [
        user.name || '',
        user.email,
        user.role,
        user.status,
        formatDate(user.createdAt),
        user.activityLogs.length > 0 ? formatDate(user.activityLogs[0].timestamp) : 'Never',
        user.orders.length
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage user accounts and access control</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchUsers}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportUsers}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(user => user.status === 'ACTIVE').length}
                </p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(user => user.role === 'ADMIN').length}
                </p>
                <p className="text-sm text-gray-600">Administrators</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <UserX className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(user => user.status === 'DISABLED').length}
                </p>
                <p className="text-sm text-gray-600">Disabled Users</p>
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="ADMIN">Administrators</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-end">
              <span className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all ${
                    selectedUser?.id === user.id ? 'ring-2 ring-orange-500' : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.name || 'No Name'}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                        {user.role}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status]}`}>
                        {user.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <p className="font-medium">Registered</p>
                      <p>{formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total Orders</p>
                      <p>{user.orders.length}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedUser(user)
                      }}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded-md text-sm font-medium"
                    >
                      View Details
                    </button>
                    
                    {user.status === 'ACTIVE' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateUserStatus(user.id, 'DISABLED')
                        }}
                        disabled={updatingUser === user.id}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm font-medium"
                      >
                        {updatingUser === user.id ? 'Updating...' : 'Disable'}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateUserStatus(user.id, 'ACTIVE')
                        }}
                        disabled={updatingUser === user.id}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md text-sm font-medium"
                      >
                        {updatingUser === user.id ? 'Updating...' : 'Enable'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No users found</h2>
                <p className="text-gray-600">
                  {users.length === 0 
                    ? 'No users have registered yet.'
                    : 'No users match your current filters.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* User Details Panel */}
          <div className="lg:sticky lg:top-8">
            {selectedUser ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                  <div className="flex space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[selectedUser.role]}`}>
                      {selectedUser.role}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedUser.status]}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{selectedUser.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                    <p className="text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900">{formatDate(selectedUser.updatedAt)}</p>
                  </div>
                </div>

                {/* Role Management */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Role Management</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateUserRole(selectedUser.id, 'CUSTOMER')}
                      disabled={selectedUser.role === 'CUSTOMER' || updatingUser === selectedUser.id}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        selectedUser.role === 'CUSTOMER'
                          ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Make Customer
                    </button>
                    <button
                      onClick={() => updateUserRole(selectedUser.id, 'ADMIN')}
                      disabled={selectedUser.role === 'ADMIN' || updatingUser === selectedUser.id}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        selectedUser.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      Make Admin
                    </button>
                  </div>
                </div>

                {/* Order History */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Order History</h3>
                  {selectedUser.orders.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedUser.orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">#{order.orderNumber}</p>
                            <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">${order.totalAmount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{order.status}</p>
                          </div>
                        </div>
                      ))}
                      {selectedUser.orders.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{selectedUser.orders.length - 5} more orders
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No orders placed yet</p>
                  )}
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Activity</h3>
                  {selectedUser.activityLogs.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedUser.activityLogs.slice(0, 5).map((log) => (
                        <div key={log.id} className="p-2 bg-gray-50 rounded">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium">{log.action}</p>
                            <p className="text-xs text-gray-500">{formatDate(log.timestamp)}</p>
                          </div>
                          {log.ipAddress && (
                            <p className="text-xs text-gray-500">IP: {log.ipAddress}</p>
                          )}
                        </div>
                      ))}
                      {selectedUser.activityLogs.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{selectedUser.activityLogs.length - 5} more activities
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No activity logged yet</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a User</h3>
                <p className="text-gray-600">Click on a user to view detailed information and manage their account</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}