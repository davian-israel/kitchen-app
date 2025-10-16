/**
 * Integration Tests for Menu Page
 * Verifies menu page displays meals with prices, descriptions, and add to cart buttons
 */

import { jest } from '@jest/globals'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Mock Next.js and NextAuth modules - using doMock for proper reset
const mockPush = jest.fn()
const mockUseSession = jest.fn()

jest.doMock('next-auth/react', () => ({
  useSession: mockUseSession
}))

jest.doMock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}))
jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: any) {
    return React.createElement('a', { href, className }, children)
  }
})

// Mock cart context
const mockAddItem = jest.fn()
const mockOpenCart = jest.fn()
jest.mock('@/contexts/CartContext', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    openCart: mockOpenCart
  })
}))

// Mock ResponsiveHeader component
jest.mock('@/components/navigation/ResponsiveHeader', () => {
  return function MockResponsiveHeader() {
    return React.createElement('div', { 'data-testid': 'responsive-header' }, 'Navigation Header')
  }
})

// Mock CartButton component  
jest.mock('@/components/cart/CartButton', () => {
  return function MockCartButton() {
    return React.createElement('div', { 'data-testid': 'cart-button' }, 'Cart Button')
  }
})

// Mock meals data
const mockMealsData = [
  {
    id: 'meal-1',
    name: 'Falafel Bowl',
    description: 'Crispy falafel balls served with hummus, tahini, and fresh vegetables',
    price: 12.99,
    category: 'Main Course',
    imageUrl: '/images/falafel-bowl.jpg',
    ingredients: ['chickpeas', 'tahini', 'cucumber', 'tomato', 'lettuce'],
    allergens: ['sesame'],
    available: true
  },
  {
    id: 'meal-2', 
    name: 'Shawarma Plate',
    description: 'Slow-cooked seasoned meat with pita bread and traditional sides',
    price: 15.50,
    category: 'Main Course',
    imageUrl: '/images/shawarma.jpg',
    ingredients: ['lamb', 'pita bread', 'onions', 'parsley'],
    allergens: ['gluten'],
    available: true
  },
  {
    id: 'meal-3',
    name: 'Hummus & Pita',
    description: 'Traditional hummus served with warm pita bread and olive oil',
    price: 8.75,
    category: 'Appetizer',
    imageUrl: '/images/hummus.jpg',
    ingredients: ['chickpeas', 'tahini', 'lemon', 'garlic', 'pita bread'],
    allergens: ['sesame', 'gluten'],
    available: true
  }
]

describe('Menu Page Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock authenticated session
    mockUseSession.mockReturnValue({
      data: {
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'USER' },
        expires: '2024-12-31'
      },
      status: 'authenticated'
    })
    
    // Mock fetch for meals API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMealsData)
    })
  })

  describe('Meal List Display', () => {
    it('should display a list of meals from the API', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      // Wait for meals to load
      await waitFor(() => {
        expect(screen.getByText('Falafel Bowl')).toBeInTheDocument()
      })
      
      // Verify all meals are displayed
      expect(screen.getByText('Falafel Bowl')).toBeInTheDocument()
      expect(screen.getByText('Shawarma Plate')).toBeInTheDocument()
      expect(screen.getByText('Hummus & Pita')).toBeInTheDocument()
      
      // Verify API was called
      expect(global.fetch).toHaveBeenCalledWith('/api/meals')
    })

    it('should display meal count information', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 meals')).toBeInTheDocument()
      })
    })

    it('should display meals in a responsive grid layout', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      const { container } = render(React.createElement(MenuPage))
      
      await waitFor(() => {
        const mealGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4')
        expect(mealGrid).toBeInTheDocument()
      })
    })
  })

  describe('Meal Price Display', () => {
    it('should display price for each meal in correct format', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        // Check prices are displayed with $ symbol and 2 decimal places
        expect(screen.getByText('$12.99')).toBeInTheDocument()
        expect(screen.getByText('$15.50')).toBeInTheDocument()
        expect(screen.getByText('$8.75')).toBeInTheDocument()
      })
      
      // Verify prices have correct styling
      const priceElements = screen.getAllByText(/^\$\d+\.\d{2}$/)
      priceElements.forEach(price => {
        expect(price).toHaveClass('text-lg', 'font-bold', 'text-orange-600')
      })
    })

    it('should display prices prominently in meal card header', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      const { container } = render(React.createElement(MenuPage))
      
      await waitFor(() => {
        // Find meal cards and verify price positioning
        const mealCards = container.querySelectorAll('.bg-white.rounded-lg.shadow-md')
        expect(mealCards.length).toBe(3)
        
        mealCards.forEach(card => {
          const priceElement = card.querySelector('.text-orange-600.font-bold')
          expect(priceElement).toBeInTheDocument()
        })
      })
    })
  })

  describe('Meal Description Display', () => {
    it('should display description for each meal', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        expect(screen.getByText('Crispy falafel balls served with hummus, tahini, and fresh vegetables')).toBeInTheDocument()
        expect(screen.getByText('Slow-cooked seasoned meat with pita bread and traditional sides')).toBeInTheDocument()
        expect(screen.getByText('Traditional hummus served with warm pita bread and olive oil')).toBeInTheDocument()
      })
    })

    it('should display descriptions with proper styling and truncation', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      const { container } = render(React.createElement(MenuPage))
      
      await waitFor(() => {
        const descriptions = container.querySelectorAll('.text-gray-600.mb-3.text-sm.sm\\:text-base.line-clamp-2')
        expect(descriptions.length).toBe(3)
        
        descriptions.forEach(desc => {
          expect(desc).toHaveClass('text-gray-600', 'mb-3', 'line-clamp-2')
        })
      })
    })
  })

  describe('Add to Cart Buttons', () => {
    it('should display "Add to Cart" button for each meal', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        const addToCartButtons = screen.getAllByText('Add to Cart')
        expect(addToCartButtons).toHaveLength(3)
        
        addToCartButtons.forEach(button => {
          expect(button).toHaveClass('bg-orange-600', 'hover:bg-orange-700', 'text-white')
          expect(button).toBeEnabled()
        })
      })
    })

    it('should handle add to cart functionality when clicked', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        expect(screen.getByText('Falafel Bowl')).toBeInTheDocument()
      })
      
      // Click the first "Add to Cart" button
      const addToCartButtons = screen.getAllByText('Add to Cart')
      fireEvent.click(addToCartButtons[0])
      
      // Verify cart functions were called
      expect(mockAddItem).toHaveBeenCalledWith({
        id: 'meal-1',
        name: 'Falafel Bowl',
        price: 12.99,
        imageUrl: '/images/falafel-bowl.jpg',
        category: 'Main Course',
        quantity: 1
      })
      expect(mockOpenCart).toHaveBeenCalled()
    })

    it('should display quantity controls with each add to cart button', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        // Check quantity controls exist
        const minusButtons = screen.getAllByText('-')
        const plusButtons = screen.getAllByText('+')
        
        expect(minusButtons).toHaveLength(3)
        expect(plusButtons).toHaveLength(3)
        
        // Check initial quantities are displayed
        const quantityDisplays = screen.getAllByText('1')
        expect(quantityDisplays.length).toBeGreaterThanOrEqual(3)
      })
    })

    it('should update quantity when plus/minus buttons are clicked', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        expect(screen.getByText('Falafel Bowl')).toBeInTheDocument()
      })
      
      // Find the first meal's plus button and click it
      const plusButtons = screen.getAllByText('+')
      fireEvent.click(plusButtons[0])
      
      // Quantity should increase to 2
      await waitFor(() => {
        const quantities = screen.getAllByText('2')
        expect(quantities.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Meal Card Structure', () => {
    it('should display meal category for each item', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        // Look for categories within meal cards specifically
        const categoryTags = screen.getAllByText('Main Course').filter(el => 
          el.classList.contains('bg-orange-100')
        )
        expect(categoryTags.length).toBe(2) // Two main course meals
        
        const appetizerTags = screen.getAllByText('Appetizer').filter(el =>
          el.classList.contains('bg-orange-100')
        )
        expect(appetizerTags.length).toBe(1) // One appetizer meal
      })
      
      // Verify category styling for meal tags (not filter buttons)
      const mealCategories = screen.getAllByText(/Main Course|Appetizer/).filter(el => 
        el.classList.contains('bg-orange-100')
      )
      mealCategories.forEach(cat => {
        expect(cat).toHaveClass('bg-orange-100', 'text-orange-800', 'text-xs')
      })
    })

    it('should display ingredients for each meal', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        expect(screen.getByText(/chickpeas, tahini, cucumber/)).toBeInTheDocument()
        expect(screen.getByText(/lamb, pita bread, onions/)).toBeInTheDocument()
      })
    })

    it('should display allergen information', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        // Check for allergen tags with specific styling
        const allergenTags = screen.getAllByText(/sesame|gluten/).filter(el =>
          el.classList.contains('bg-red-100')
        )
        expect(allergenTags.length).toBeGreaterThan(0)
        
        // Verify specific allergens exist
        expect(screen.getAllByText('sesame').some(el => el.classList.contains('bg-red-100'))).toBe(true)
        expect(screen.getAllByText('gluten').some(el => el.classList.contains('bg-red-100'))).toBe(true)
      })
    })

    it('should display meal images when available', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      const { container } = render(React.createElement(MenuPage))
      
      await waitFor(() => {
        const images = container.querySelectorAll('img')
        expect(images.length).toBe(3)
        
        expect(images[0]).toHaveAttribute('src', '/images/falafel-bowl.jpg')
        expect(images[0]).toHaveAttribute('alt', 'Falafel Bowl')
      })
    })
  })

  describe('Search and Filter Functionality', () => {
    it('should display search bar and category filters', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        // Search bar
        expect(screen.getByPlaceholderText('Search meals, ingredients...')).toBeInTheDocument()
        
        // Category filter buttons (look for buttons specifically)
        const allButton = screen.getAllByText('All').find(el => el.tagName === 'BUTTON')
        expect(allButton).toBeInTheDocument()
        
        const mainCourseButton = screen.getAllByText('Main Course').find(el => el.tagName === 'BUTTON')
        expect(mainCourseButton).toBeInTheDocument()
        
        const appetizerButton = screen.getAllByText('Appetizer').find(el => el.tagName === 'BUTTON')
        expect(appetizerButton).toBeInTheDocument()
      })
    })

    it('should filter meals by category when category button is clicked', async () => {
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        expect(screen.getByText('Showing 3 of 3 meals')).toBeInTheDocument()
      })
      
      // Click "Main Course" category button
      const mainCourseButton = screen.getAllByText('Main Course').find(el => el.tagName === 'BUTTON')
      fireEvent.click(mainCourseButton!)
      
      await waitFor(() => {
        expect(screen.getByText('Showing 2 of 3 meals in Main Course')).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should display loading state while fetching meals', async () => {
      // Mock slow API response
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve(mockMealsData)
        }), 100))
      )
      
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      // Should show loading state initially
      expect(screen.getByText('Loading menu...')).toBeInTheDocument()
      
      // Find the loading container (should be a parent div with loading classes)
      const loadingContainer = screen.getByText('Loading menu...').closest('.min-h-screen')
      expect(loadingContainer).toHaveClass('min-h-screen', 'bg-gray-50')
    })

    it('should display empty state when no meals are available', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      })
      
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        expect(screen.getByText('Menu Coming Soon')).toBeInTheDocument()
        expect(screen.getByText('We\'re preparing our delicious Israel dishes for you. Check back soon!')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication Requirements', () => {
    it('should redirect to signin when user is not authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      })
      
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(React.createElement(MenuPage))
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin')
      })
    })

    it('should render null while authentication is loading', async () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      })
      
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      const { container } = render(React.createElement(MenuPage))
      
      // Should show loading state
      expect(screen.getByText('Loading menu...')).toBeInTheDocument()
    })
  })
})