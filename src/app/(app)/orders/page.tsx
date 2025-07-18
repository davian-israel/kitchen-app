import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function OrdersPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  // TODO: Fetch user's orders from database
  const orders: any[] = []

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
                <Link href="/orders" className="text-orange-600 font-medium">
                  My Orders
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-orange-600 font-medium">
                  Profile
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your order history and current orders</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'READY' ? 'bg-green-100 text-green-800' :
                      order.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      ${order.totalAmount}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                  <div className="space-y-2">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.meal.name}</span>
                        <span>${item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <button className="text-orange-600 hover:text-orange-700 font-medium">
                    View Details
                  </button>
                  {order.status === 'COMPLETED' && (
                    <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Reorder
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Ready to try our delicious Israeli cuisine?
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