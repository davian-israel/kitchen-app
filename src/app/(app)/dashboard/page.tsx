import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-orange-600">
                Israel Kitchen
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link href="/menu" className="text-gray-700 hover:text-orange-600 font-medium">
                  Menu
                </Link>
                <Link href="/orders" className="text-gray-700 hover:text-orange-600 font-medium">
                  My Orders
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user.name || session.user.email}
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
            Welcome back, {session.user.name || 'Valued Customer'}!
          </h1>
          <p className="text-gray-600">
            Ready to explore authentic Israeli cuisine? Browse our menu and place your order.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/menu"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">🍽️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Browse Menu</h3>
                <p className="text-gray-600">Explore our delicious Israeli dishes</p>
              </div>
            </div>
          </Link>

          <Link
            href="/orders"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">📋</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">My Orders</h3>
                <p className="text-gray-600">Track your order history</p>
              </div>
            </div>
          </Link>

          <Link
            href="/profile"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">👤</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                <p className="text-gray-600">Manage your account settings</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <p>No recent orders. Ready to place your first order?</p>
            <Link
              href="/menu"
              className="inline-block mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}