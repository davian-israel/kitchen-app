'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import CartButton from '@/components/cart/CartButton'
import ResponsiveHeader from '@/components/navigation/ResponsiveHeader'

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
  const router = useRouter()
  const { addItem, openCart } = useCart()
  const [meals, setMeals] = useState<Meal[]>([])
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

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

  // Initialize quantities for all meals
  useEffect(() => {
    const initialQuantities: Record<string, number> = {}
    meals.forEach(meal => {
      initialQuantities[meal.id] = 1
    })
    setQuantities(initialQuantities)
  }, [meals])

  const updateQuantity = (mealId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantities(prev => ({
        ...prev,
        [mealId]: newQuantity
      }))
    }
  }

  const handleAddToCart = (meal: Meal) => {
    const quantity = quantities[meal.id] || 1
    addItem({
      id: meal.id,
      name: meal.name,
      price: meal.price,
      imageUrl: meal.imageUrl,
      category: meal.category,
      quantity
    })
    
    // Show visual feedback by opening cart briefly
    openCart()
    
    // Reset quantity to 1 after adding
    setQuantities(prev => ({
      ...prev,
      [meal.id]: 1
    }))
  }

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
      <ResponsiveHeader />

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredMeals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {meal.imageUrl && (
                  <img
                    src={meal.imageUrl}
                    alt={meal.name}
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                )}
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-0">{meal.name}</h3>
                    <span className="text-lg font-bold text-orange-600 flex-shrink-0">
                      ${typeof meal.price === 'number' ? meal.price.toFixed(2) : Number(meal.price).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm sm:text-base line-clamp-2">{meal.description}</p>
                  
                  {/* Category */}
                  <div className="mb-3">
                    <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      {meal.category}
                    </span>
                  </div>

                  {/* Ingredients - Collapsible on mobile */}
                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Ingredients:</p>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {meal.ingredients.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Allergens */}
                  {meal.allergens && meal.allergens.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Allergens:</p>
                      <div className="flex flex-wrap gap-1">
                        {meal.allergens.slice(0, 3).map((allergen) => (
                          <span
                            key={allergen}
                            className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full"
                          >
                            {allergen}
                          </span>
                        ))}
                        {meal.allergens.length > 3 && (
                          <span className="text-xs text-gray-500">+{meal.allergens.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Add to Cart Section - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center justify-center sm:justify-start space-x-3">
                      <button 
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center font-medium touch-manipulation"
                        onClick={() => updateQuantity(meal.id, (quantities[meal.id] || 1) - 1)}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium text-lg">{quantities[meal.id] || 1}</span>
                      <button 
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-10 h-10 rounded-full flex items-center justify-center font-medium touch-manipulation"
                        onClick={() => updateQuantity(meal.id, (quantities[meal.id] || 1) + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-md font-medium transition-colors w-full sm:w-auto sm:flex-1 sm:ml-4 touch-manipulation"
                      onClick={() => handleAddToCart(meal)}
                    >
                      Add to Cart
                    </button>
                  </div>
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