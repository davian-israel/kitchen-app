'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { 
  Menu, 
  Heart, 
  Clock, 
  Star, 
  ChevronLeft,
  MoreVertical
} from 'lucide-react'

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
  rating?: number
  reviews?: number
  prepTime?: number
  isFavorite?: boolean
  features?: string[]
}

// Food Item Card Component
const FoodItemCard = ({ item, onDetailsClick, onAddToCart }: {
  item: Meal
  onDetailsClick: () => void
  onAddToCart: () => void
}) => {
  // Enhanced features with cultural elements
  const getCulturalBadges = (features: string[]) => {
    const badgeMap: { [key: string]: string } = {
      'Kosher': 'badge-kosher',
      'Fresh': 'badge-fresh',
      'Traditional': 'badge-traditional',
      'Spicy': 'badge-spicy',
      'Premium': 'badge-traditional',
      'Hearty': 'badge-fresh'
    }
    return features.map((feature, index) => {
      const badgeClass = badgeMap[feature] || 'bg-gray-100 text-gray-700'
      return (
        <span
          key={index}
          className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass.startsWith('badge-') ? badgeClass : badgeClass + ' bg-gray-100 text-gray-700'}`}
        >
          {feature}
        </span>
      )
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] card-israel">
      {/* Image and overlays */}
      <div className="relative aspect-square" onClick={onDetailsClick}>
        <img
          src={item.imageUrl || `https://placehold.co/400x400/E3F2FD/0038A8?text=${encodeURIComponent(item.name)}`}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        
        {/* Favorite button */}
        <button 
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-all"
          onClick={(e) => {
            e.stopPropagation()
            // Toggle favorite logic here
          }}
        >
          <Heart 
            size={16} 
            className={`transition-colors ${item.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} 
          />
        </button>
        
        {/* Rating badge */}
        {item.rating && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center">
            <Star size={12} className="text-yellow-400 mr-1" fill="currentColor" />
            <span className="text-white text-xs font-semibold">{item.rating.toFixed(1)}</span>
          </div>
        )}
        
        {/* Prep time badge */}
        {item.prepTime && (
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center">
            <Clock size={10} className="text-gray-600 mr-1" />
            <span className="text-gray-800 text-xs font-medium">{item.prepTime}min</span>
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-3" onClick={onDetailsClick}>
        <h3 className="text-base font-bold text-gray-800 mb-1 line-clamp-1">{item.name}</h3>
        <p className="text-gray-500 text-xs mb-2 line-clamp-2">{item.description}</p>
        
        {/* Cultural Features/Tags */}
        {item.features && item.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {getCulturalBadges(item.features.slice(0, 2))}
          </div>
        )}
        
        {/* Price and Add to Cart */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-800">
            ₪{typeof item.price === 'number' ? item.price.toFixed(0) : Number(item.price).toFixed(0)}
          </span>
          <button 
            className="bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:bg-gray-800 hover:scale-105 active:scale-95"
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart()
            }}
          >
            Add +
          </button>
        </div>
      </div>
    </div>
  )
}

// Meal Details Page Component
const MealDetailsPage = ({ item, onBack, onAddToCart }: {
  item: Meal
  onBack: () => void
  onAddToCart: () => void
}) => {
  if (!item) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>No item selected.</p>
        <button onClick={onBack} className="ml-4 text-blue-500">
          Go back to menu
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header with back and menu buttons */}
      <div className="relative">
        <img
          src={item.imageUrl || `https://placehold.co/600x400/D4EDDA/155724?text=${encodeURIComponent(item.name)}`}
          alt={item.name}
          className="w-full h-80 object-cover rounded-b-3xl shadow-md"
        />
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white">
          <button
            onClick={onBack}
            className="bg-black/40 backdrop-blur-sm p-2 rounded-full focus:outline-none"
          >
            <ChevronLeft size={24} />
          </button>
          <button className="bg-black/40 backdrop-blur-sm p-2 rounded-full focus:outline-none">
            <MoreVertical size={24} />
          </button>
        </div>
        {/* Favorite button on the image */}
        <button className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg">
          <Heart size={20} className={item.isFavorite ? 'text-red-500' : 'text-gray-400'} />
        </button>
      </div>

      <div className="flex-grow p-5 space-y-5">
        {/* Name and stats section */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">{item.name}</h1>
          <div className="flex items-center text-sm text-gray-600">
            <Clock size={16} className="text-gray-400 mr-1" />
            <span className="font-semibold">{item.prepTime || 25} Mins</span>
          </div>
        </div>

        {/* Price and rating section */}
        <div className="flex items-center justify-between">
          <span className="text-4xl font-extrabold text-gray-800">
            ${typeof item.price === 'number' ? item.price.toFixed(2) : Number(item.price).toFixed(2)}
          </span>
          {item.rating && (
            <div className="flex items-center">
              <div className="flex items-center text-yellow-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star 
                    key={i} 
                    size={20} 
                    fill="currentColor" 
                    strokeWidth={i < Math.floor(item.rating!) ? 0 : 1} 
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600 font-semibold">
                {item.rating.toFixed(1)} ({item.reviews || 0} reviews)
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-500 leading-relaxed">{item.description}</p>

        {/* Tags */}
        {item.features && (
          <div className="flex flex-wrap gap-2">
            {item.features.map((feature, index) => (
              <span
                key={index}
                className="bg-gray-200 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full flex items-center"
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Ingredients section */}
        {item.ingredients && item.ingredients.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Ingredients</h3>
            <div className="flex flex-wrap gap-2">
              {item.ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-full"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allergens section */}
        {item.allergens && item.allergens.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Allergens</h3>
            <div className="flex flex-wrap gap-2">
              {item.allergens.map((allergen, index) => (
                <span
                  key={index}
                  className="bg-red-100 text-red-800 text-sm font-semibold px-4 py-2 rounded-full"
                >
                  {allergen}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 bg-white shadow-2xl p-4 rounded-t-3xl border-t border-gray-200 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Total Price</span>
          <span className="text-2xl font-bold text-gray-800">
            ${typeof item.price === 'number' ? item.price.toFixed(2) : Number(item.price).toFixed(2)}
          </span>
        </div>
        <button
          onClick={onAddToCart}
          className="bg-black text-white px-8 py-4 rounded-full font-semibold shadow-lg transition duration-300 transform hover:scale-105"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}

// Main Menu Page Component
export default function MenuPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addItem, openCart } = useCart()
  const [meals, setMeals] = useState<Meal[]>([])
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('Main Menu')
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<'menu' | 'details'>('menu')
  const [selectedItem, setSelectedItem] = useState<Meal | null>(null)

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
  }, [meals, selectedCategory])

  const fetchMeals = async () => {
    try {
      const response = await fetch('/api/meals')
      if (response.ok) {
        const data = await response.json()
        // Enhance meals with sample data for design purposes
        const enhancedMeals = data.map((meal: Meal) => ({
          ...meal,
          rating: Math.random() * 1.5 + 3.5, // Random rating between 3.5-5.0
          reviews: Math.floor(Math.random() * 200) + 50, // Random reviews 50-250
          prepTime: Math.floor(Math.random() * 30) + 15, // Random prep time 15-45 min
          isFavorite: Math.random() > 0.7, // 30% chance of being favorite
          features: getRandomFeatures(meal.category)
        }))
        setMeals(enhancedMeals)
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRandomFeatures = (category: string): string[] => {
    const featureOptions = {
      'Main Dish': ['Kosher', 'Traditional', 'Spicy', 'Fresh', 'Hearty', 'Premium'],
      'Appetizer': ['Fresh', 'Traditional', 'Kosher', 'Light', 'Crispy'],
      'Dessert': ['Traditional', 'Fresh', 'Premium', 'Kosher'],
      'Drink': ['Fresh', 'Traditional', 'Kosher', 'Premium'],
      'default': ['Fresh', 'Traditional', 'Kosher', 'Premium']
    }
    
    const features = featureOptions[category as keyof typeof featureOptions] || featureOptions.default
    const count = Math.floor(Math.random() * 2) + 1 // 1-2 features for better display
    return features.sort(() => 0.5 - Math.random()).slice(0, count)
  }

  const filterMeals = () => {
    let filtered = meals

    if (selectedCategory !== 'Main Menu') {
      filtered = filtered.filter(meal => meal.category === selectedCategory)
    }

    setFilteredMeals(filtered)
  }

  const menuCategories = ['Main Menu', ...new Set(meals.map(meal => meal.category))]

  const handleItemClick = (item: Meal) => {
    setSelectedItem(item)
    setCurrentPage('details')
  }

  const handleAddToCart = (meal: Meal) => {
    addItem({
      id: meal.id,
      name: meal.name,
      price: meal.price,
      imageUrl: meal.imageUrl,
      category: meal.category,
      quantity: 1
    })
    
    // Show visual feedback by opening cart briefly
    openCart()
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
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

  // Show meal details page
  if (currentPage === 'details' && selectedItem) {
    return (
      <MealDetailsPage
        item={selectedItem}
        onBack={() => setCurrentPage('menu')}
        onAddToCart={() => handleAddToCart(selectedItem)}
      />
    )
  }

  // Show main menu page
  return (
    <div className="bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-orange-500 cultural-pattern">
        <div className="px-5 py-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Delicious Israel Food
          </h1>
          <p className="text-white/90 text-lg mb-1">
            Authentic Israel Kitchen
          </p>
          <p className="text-white/80 text-sm">
            We make fresh and healthy authentic Israel cuisine
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white shadow-sm">
        <div className="overflow-x-auto flex px-5 py-4 space-x-3 scrollbar-hide">
          {menuCategories.map((category, index) => (
            <button
              key={index}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-black text-white shadow-md transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Food Items Grid */}
      <div className="flex-grow px-5 py-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeals.map((item) => (
            <FoodItemCard
              key={item.id}
              item={item}
              onDetailsClick={() => handleItemClick(item)}
              onAddToCart={() => handleAddToCart(item)}
            />
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredMeals.length === 0 && !isLoading && (
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl">🍽️</div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No meals available</h2>
            <p className="text-gray-600 text-sm mb-4">
              Check back soon for delicious Israel cuisine!
            </p>
            <button 
              onClick={() => setSelectedCategory('Main Menu')}
              className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Browse All Categories
            </button>
          </div>
        </div>
      )}

    </div>
  )
}