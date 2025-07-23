import Link from 'next/link'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-orange-600 mb-4">404</div>
          <div className="text-6xl mb-4">🍽️</div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-4">
            Oops! The page you're looking for seems to have wandered off to the kitchen. 
            Let's get you back to something delicious!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
          
          <Link
            href="/menu"
            className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
          >
            <Search className="w-4 h-4 mr-2" />
            Browse Menu
          </Link>
          
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Still can't find what you're looking for?</p>
          <p>
            <a 
              href="mailto:support@israelkitchen.com" 
              className="text-orange-600 hover:text-orange-700 underline"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}