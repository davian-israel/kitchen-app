'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
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

export default function MenuPage() {
  const { data: session, status } = useSession()
  const [meals, setMeals] = useState<Meal[]>([])
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (session) {
      fetchMeals()
    }
  }, [session])

  useEffect(() => {
    filterMeals()
  }, [meals, selectedCategory, searchTerm])

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/meals')
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

  const filterMeals = () => {
    let filtered = meals

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(meal => meal.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(meal =>
        meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meal.ingredients.some(ingredient => 
          ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    setFilteredMeals(filtered)
  }

  const categories = ['All', ...new Set(meals.map(meal => meal.category))]

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
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
                <Link href="/menu" className="text-orange-600 font-medium">
                  Menu
                </Link>
                <Link href="/orders" className="text-gray-700 hover:text-orange-600 font-medium">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Menu</h1>
          <p className="text-gray-600">Authentic israel cuisine made with fresh ingredients</p>
        </div>

        {meals.length > 0 && (
          <>
            {/* Search and Filter */}
            <div className="mb-8 space-y-4">
              {/* Search Bar */}
              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Search meals, ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-orange-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                Showing {filteredMeals.length} of {meals.length} meals
                {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            </div>
          </>
        )}

        {/* Menu Items */}
        {filteredMeals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {meal.imageUrl && (
                  <img
                    src={meal.imageUrl}
                    alt={meal.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{meal.name}</h3>
                    <span className="text-lg font-bold text-orange-600">
                      ${meal.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{meal.description}</p>
                  
                  {/* Category */}
                  <div className="mb-3">
                    <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      {meal.category}
                    </span>
                  </div>

                  {/* Ingredients */}
                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
                      <p className="text-sm text-gray-600">
                        {meal.ingredients.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Allergens */}
                  {meal.allergens && meal.allergens.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Allergens:</p>
                      <div className="flex flex-wrap gap-1">
                        {meal.allergens.map((allergen) => (
                          <span
                            key={allergen}
                            className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add to Cart Button */}
                  <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md font-medium transition-colors">
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : meals.length > 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No meals found</h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('All')
              }}
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Menu Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              We're preparing our delicious israel dishes for you. Check back soon!
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}