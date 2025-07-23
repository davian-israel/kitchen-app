'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
    
    // In production, you would send this to your error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error)
    }
  }, [error])

  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isAuthError = error.message.includes('auth') || error.message.includes('unauthorized')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {/* Error Icon */}
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isNetworkError ? 'Connection Problem' : 
             isAuthError ? 'Authentication Error' : 
             'Something went wrong'}
          </h1>
          
          <p className="text-gray-600 mb-4">
            {isNetworkError ? 
              'We\'re having trouble connecting to our servers. Please check your internet connection and try again.' :
             isAuthError ?
              'There was a problem with your authentication. Please try signing in again.' :
              'We encountered an unexpected error. Our team has been notified and is working on a fix.'}
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-gray-100 p-4 rounded-md mb-6">
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
              Error Details (Development)
            </summary>
            <div className="space-y-2">
              <div>
                <strong className="text-xs text-gray-600">Message:</strong>
                <pre className="text-xs text-red-600 whitespace-pre-wrap mt-1">
                  {error.message}
                </pre>
              </div>
              {error.digest && (
                <div>
                  <strong className="text-xs text-gray-600">Digest:</strong>
                  <pre className="text-xs text-gray-600 mt-1">{error.digest}</pre>
                </div>
              )}
              {error.stack && (
                <div>
                  <strong className="text-xs text-gray-600">Stack:</strong>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-1 max-h-32 overflow-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          
          {isAuthError && (
            <Link
              href="/auth/signin"
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Sign In Again
            </Link>
          )}
          
          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </div>

        {/* Support Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">
            If this problem persists, please contact our support team:
          </p>
          <a
            href="mailto:support@israelkitchen.com"
            className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            <Mail className="w-4 h-4 mr-1" />
            support@israelkitchen.com
          </a>
          
          {error.digest && (
            <p className="text-xs text-gray-500 mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}