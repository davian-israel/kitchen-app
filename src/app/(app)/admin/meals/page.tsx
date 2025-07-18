'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Meal {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  ingredients: string[]
  allergens: string[]
  available: boolean
}

export default function AdminMealsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'ADMIN') {
      router.push('/dashboard')
    } else if (status === 'authenticated') {
      fetchMeals()
    }
  }, [status, session, router])

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/admin/meals')
      if (response.ok) {
        const data = await response.json()
        setMeals(data)
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAvailability = async (mealId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/meals/${mealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          available: !currentStatus,
        }),
      })

      if (response.ok) {
        setMeals(meals.map(meal => 
          meal.id === mealId 
            ? { ...meal, available: !currentStatus }
            : meal
        ))
      }
    } catch (error) {
      console.error('Error toggling availability:', error)
    }
  }

  const deleteMeal = async (mealId: string) => {
    try {
      const response = await fetch(`/api/admin/meals/${mealId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMeals(meals.filter(meal => meal.id !== mealId))
        setDeleteConfirm(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete meal')
      }
    } catch (error) {
      console.error('Error deleting meal:', error)
      alert('An error occurred while deleting the meal')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading meals...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
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
                <Link href="/admin/meals" className="text-orange-600 font-medium">
                  Meals
                </Link>
                <Link href="/admin/inventory" className="text-gray-700 hover:text-orange-600 font-medium">
                  Inventory
                </Link>
                <Link href="/admin/users" className="text-gray-700 hover:text-orange-600 font-medium">
                  Users
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meal Management</h1>
            <p className="text-gray-600">Manage your restaurant's menu items</p>
          </div>
          <Link
            href="/admin/meals/new"
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Add New Meal
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🍽️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Meals</h3>
                <p className="text-2xl font-bold text-orange-600">{meals.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Available</h3>
                <p className="text-2xl font-bold text-green-600">
                  {meals.filter(meal => meal.available).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">❌</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Unavailable</h3>
                <p className="text-2xl font-bold text-red-600">
                  {meals.filter(meal => !meal.available).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(meals.map(meal => meal.category)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Meals Table */}
        {meals.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Meals</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {meals.map((meal) => (
                    <tr key={meal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {meal.imageUrl && (
                            <img
                              className="h-10 w-10 rounded-full object-cover mr-4"
                              src={meal.imageUrl}
                              alt={meal.name}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {meal.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {meal.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {meal.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${meal.price.toString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          meal.available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {meal.available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/admin/meals/${meal.id}/edit`}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => setDeleteConfirm(meal.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                        <button 
                          onClick={() => toggleAvailability(meal.id, meal.available)}
                          className={`${
                            meal.available 
                              ? 'text-gray-600 hover:text-gray-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {meal.available ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Meals Yet</h2>
            <p className="text-gray-600 mb-6">
              Start building your menu by adding your first meal.
            </p>
            <Link
              href="/admin/meals/new"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Add First Meal
            </Link>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Meal</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this meal? This action cannot be undone.
                  </p>
                </div>
                <div className="items-center px-4 py-3">
                  <button
                    onClick={() => deleteMeal(deleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}