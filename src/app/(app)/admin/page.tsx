import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Star, Package, Users, DollarSign, TrendingUp } from 'lucide-react'

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session || !(session as any)?.user?.role || (session as any).user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Admin Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl shadow-lg p-8 mb-8 text-white cultural-pattern">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-6 backdrop-blur-sm">
                <Star className="w-8 h-8 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Israel Kitchen Admin
                </h1>
                <p className="text-white/90 text-lg mb-1">
                  Dashboard Control
                </p>
                <p className="text-white/80">
                  Manage orders, inventory, users, and monitor restaurant operations
                </p>
              </div>
            </div>
            <div className="hidden lg:block text-right">
              <p className="text-sm text-white/80">Welcome back</p>
              <p className="font-semibold">{(session as any)?.user?.name || (session as any)?.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg card-israel hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending Orders</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
                <p className="text-xs text-gray-500 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  All caught up!
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg card-israel hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Low Stock</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">0</p>
                <p className="text-xs text-gray-500 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Stock healthy
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg card-israel hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Users</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">2</p>
                <p className="text-xs text-gray-500 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Active accounts
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg card-israel hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Today&apos;s Revenue</h3>
                <p className="text-3xl font-bold text-orange-600 mt-2">₪0</p>
                <p className="text-xs text-gray-500 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Ready for orders
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/orders"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-blue-500"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">🍽️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
                <p className="text-gray-600">Process and track customer orders</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/inventory"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">📦</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Inventory Management</h3>
                <p className="text-gray-600">Track stock levels and expiration dates</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <p className="text-gray-600">Manage customer and admin accounts</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/meals"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-yellow-500"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">🥙</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Menu Management</h3>
                <p className="text-gray-600">Add and edit menu items</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/reports"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-indigo-500"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reports & Analytics</h3>
                <p className="text-gray-600">View sales and performance reports</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-gray-500"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">⚙️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
                <p className="text-gray-600">Configure restaurant settings</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity. System is ready for operations.</p>
          </div>
        </div>
      </div>
    </div>
  )
}