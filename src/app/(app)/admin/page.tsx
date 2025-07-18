import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/admin" className="text-xl font-bold text-orange-600">
                Israel Kitchen Admin
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link href="/admin/orders" className="text-gray-700 hover:text-orange-600 font-medium">
                  Orders
                </Link>
                <Link href="/admin/inventory" className="text-gray-700 hover:text-orange-600 font-medium">
                  Inventory
                </Link>
                <Link href="/admin/users" className="text-gray-700 hover:text-orange-600 font-medium">
                  Users
                </Link>
                <Link href="/admin/reports" className="text-gray-700 hover:text-orange-600 font-medium">
                  Reports
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-600 font-medium">
                Admin: {session.user.name || session.user.email}
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
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage orders, inventory, users, and monitor restaurant operations.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📋</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pending Orders</h3>
                <p className="text-2xl font-bold text-orange-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📦</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Low Stock Items</h3>
                <p className="text-2xl font-bold text-red-600">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
                <p className="text-2xl font-bold text-blue-600">2</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">💰</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Today's Revenue</h3>
                <p className="text-2xl font-bold text-green-600">$0</p>
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
      </main>
    </div>
  )
}