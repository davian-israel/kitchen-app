import { auth } from '@/auth'
import Link from 'next/link'
import { Star, Menu, Package, User, Heart, ChefHat } from 'lucide-react'
import ResponsiveHeader from '@/components/navigation/ResponsiveHeader'

export default async function DashboardPage() {
  const session = await auth()

  // Layout already handles authentication, but we still need session data
  if (!session) {
    return null // This shouldn't happen due to layout, but safety check
  }

  const userName = (session as any)?.user?.name?.split(' ')[0] || 'Friend'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Component */}
      <ResponsiveHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Welcome Section */}
        <div className="bg-gradient-to-br from-blue-600 to-orange-500 cultural-pattern rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back {userName}!
              </h1>
              <p className="text-white/90 text-lg mb-1">
                Welcome to Israel Kitchen
              </p>
              <p className="text-white/80">
                Ready to explore authentic Israel cuisine? Browse our menu and discover the flavors of the 12 tribes.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <ChefHat className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/menu"
            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] card-israel group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Menu className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Browse Menu</h3>
                <p className="text-gray-600 text-sm">Explore our delicious Israel dishes</p>
              </div>
            </div>
          </Link>

          <Link
            href="/orders"
            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] card-israel group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">My Orders</h3>
                <p className="text-gray-600 text-sm">Track your order history</p>
              </div>
            </div>
          </Link>

          <Link
            href="/profile"
            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] card-israel group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Profile</h3>
                <p className="text-gray-600 text-sm">Manage your account settings</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Featured Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cultural Info Card */}
          <div className="bg-white p-6 rounded-2xl shadow-lg card-israel">
            <div className="flex items-center mb-4">
              <Star className="w-6 h-6 text-orange-500 mr-2" fill="currentColor" />
              <h2 className="text-xl font-bold text-gray-900">About Our Kitchen</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Experience the authentic flavors of Israel cuisine, inspired by the traditions of the 12 tribes. 
              Each dish is prepared with fresh ingredients and time-honored recipes passed down through generations.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="badge-kosher">Kosher Certified</span>
              <span className="badge-fresh">Fresh Daily</span>
              <span className="badge-traditional">Traditional Recipes</span>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-2xl shadow-lg card-israel">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-orange-500" />
              </div>
              <p className="text-gray-600 mb-4">No recent orders yet.</p>
              <p className="text-sm text-gray-500 mb-6">Ready to taste authentic Israel cuisine?</p>
              <Link
                href="/menu"
                className="btn-primary-israel inline-flex items-center space-x-2"
              >
                <Menu className="w-4 h-4" />
                <span>Browse Menu</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Cultural Footer */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            Enjoy Your Meal
          </p>
        </div>
      </main>
    </div>
  )
}