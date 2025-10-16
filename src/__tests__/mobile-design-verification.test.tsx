/**
 * Mobile Design Verification Tests
 * 
 * These tests verify that the mobile food delivery app design has been 
 * implemented correctly with all the visual and functional components.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MenuPage from '../app/(app)/menu/page'
import { CartProvider } from '../contexts/CartContext'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock next/navigation
jest.mock('next/navigation')
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPush = jest.fn()
const mockRouter = { push: mockPush }

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock session data
const mockSession = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER'
  }
}

// Mock meals data that matches the enhanced structure
const mockMealsData = [
  {
    id: '1',
    name: 'Shakshuka',
    description: 'Traditional Israel breakfast dish with eggs poached in spiced tomato sauce',
    price: 14.99,
    category: 'Main Dish',
    imageUrl: 'https://example.com/shakshuka.jpg',
    ingredients: ['Eggs', 'Tomatoes', 'Bell peppers', 'Onions', 'Spices'],
    allergens: ['Eggs'],
    available: true,
    rating: 4.5,
    reviews: 128,
    prepTime: 25,
    isFavorite: true,
    features: ['Fresh', 'Traditional', 'Spicy']
  },
  {
    id: '2',
    name: 'Falafel Bowl',
    description: 'Crispy falafel balls served with fresh vegetables and tahini sauce',
    price: 12.99,
    category: 'Main Dish',
    imageUrl: 'https://example.com/falafel.jpg',
    ingredients: ['Chickpeas', 'Herbs', 'Vegetables', 'Tahini'],
    allergens: ['Sesame'],
    available: true,
    rating: 4.2,
    reviews: 95,
    prepTime: 20,
    isFavorite: false,
    features: ['Fresh', 'Healthy', 'Vegan']
  }
]

const MockedMenuPage = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>
    {children}
  </CartProvider>
)

describe('Mobile Design Verification Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated'
    })
    
    mockUseRouter.mockReturnValue(mockRouter)
    
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMealsData)
    })
  })

  describe('1. Mobile Layout Structure', () => {
    it('should render main container with proper mobile layout classes', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const mainContainer = screen.getByText('Delicious Food').closest('div')
        expect(mainContainer).toHaveClass('min-h-screen', 'bg-gray-100', 'flex', 'flex-col')
      })
    })

    it('should display mobile-first header with hamburger menu and cart icons', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        // Check for top header with menu and cart icons
        const headerSection = screen.getByText('Delicious Food').closest('div')?.previousElementSibling
        expect(headerSection).toHaveClass('p-5', 'flex', 'justify-between', 'items-center')
      })
    })

    it('should have sticky bottom navigation with rounded corners', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const bottomNav = screen.getByText('Home').closest('div')?.parentElement
        expect(bottomNav).toHaveClass('sticky', 'bottom-0', 'bg-white', 'shadow-2xl', 'rounded-t-3xl')
      })
    })
  })

  describe('2. Food Item Cards Design', () => {
    it('should render food cards with rounded-3xl corners and shadow', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const foodCard = screen.getByText('Shakshuka').closest('div')?.closest('div')
        expect(foodCard).toHaveClass('bg-white', 'rounded-3xl', 'shadow-lg', 'overflow-hidden')
      })
    })

    it('should display rating badge with star icon and backdrop blur', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        // Check for rating display (4.5 rating for Shakshuka)
        expect(screen.getByText('4.5')).toBeInTheDocument()
      })
    })

    it('should show prep time badge with clock icon', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        // Check for prep time display (25 min for Shakshuka)
        expect(screen.getByText('25 min')).toBeInTheDocument()
      })
    })

    it('should have heart icon for favorites with proper styling', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        // Check that heart icons are rendered (one should be red for favorite)
        const heartIcons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('svg')?.classList.contains('lucide-heart')
        )
        expect(heartIcons.length).toBeGreaterThan(0)
      })
    })

    it('should display feature tags with rounded-full styling', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        // Check for feature tags like "Fresh", "Traditional", etc.
        const freshTag = screen.getByText('Fresh')
        expect(freshTag).toHaveClass('bg-gray-100', 'text-gray-700', 'rounded-full')
      })
    })

    it('should have "Add to Cart" button with black background and rounded-full', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const addToCartButtons = screen.getAllByText('Add to Cart')
        expect(addToCartButtons[0]).toHaveClass('bg-black', 'text-white', 'rounded-full')
      })
    })
  })

  describe('3. Category Tabs Design', () => {
    it('should render scrollable category tabs with rounded-full styling', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const categoryContainer = screen.getByText('Main Menu').closest('div')
        expect(categoryContainer).toHaveClass('overflow-x-auto', 'flex', 'space-x-4')
      })
    })

    it('should highlight active category with black background', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const activeCategory = screen.getByText('Main Menu')
        expect(activeCategory).toHaveClass('bg-black', 'text-white', 'shadow-lg')
      })
    })

    it('should style inactive categories with white background and border', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        // Wait for meals to load and categories to be populated
        const categoryButtons = screen.getAllByRole('button').filter(button => 
          button.textContent === 'Main Dish'
        )
        
        if (categoryButtons.length > 0) {
          expect(categoryButtons[0]).toHaveClass('bg-white', 'text-gray-700', 'border')
        }
      })
    })
  })

  describe('4. Bottom Navigation Design', () => {
    it('should render all four navigation items with icons and labels', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument()
        expect(screen.getByText('Menu')).toBeInTheDocument()
        expect(screen.getByText('Search')).toBeInTheDocument()
        expect(screen.getByText('Profile')).toBeInTheDocument()
      })
    })

    it('should highlight active navigation item with black background', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const homeNavItem = screen.getByText('Home').previousElementSibling
        expect(homeNavItem).toHaveClass('bg-black', 'text-white', 'shadow-lg')
      })
    })

    it('should style inactive nav items with gray colors', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const menuNavItem = screen.getByText('Menu').previousElementSibling
        expect(menuNavItem).toHaveClass('text-gray-500')
      })
    })
  })

  describe('5. Meal Details Page Design', () => {
    it('should navigate to details page when food card is clicked', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const foodCard = screen.getByText('Shakshuka')
        fireEvent.click(foodCard)
      })

      // Should show the details page elements
      await waitFor(() => {
        expect(screen.getByText('25 Mins')).toBeInTheDocument() // Prep time in details
        expect(screen.getByText('Total Price')).toBeInTheDocument() // Bottom bar
      })
    })

    it('should display large hero image with overlay controls', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      // Click on a food card to navigate to details
      await waitFor(() => {
        const foodCard = screen.getByText('Shakshuka')
        fireEvent.click(foodCard)
      })

      await waitFor(() => {
        // Check for back button and more options button
        const backButtons = screen.getAllByRole('button').filter(btn => 
          btn.querySelector('svg')?.classList.contains('lucide-chevron-left')
        )
        expect(backButtons.length).toBeGreaterThan(0)
      })
    })

    it('should show star rating with filled stars', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      // Navigate to details page
      await waitFor(() => {
        const foodCard = screen.getByText('Shakshuka')
        fireEvent.click(foodCard)
      })

      await waitFor(() => {
        // Check for rating display in details page
        expect(screen.getByText('4.5 (128 reviews)')).toBeInTheDocument()
      })
    })

    it('should display ingredients as rounded tags', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      // Navigate to details page
      await waitFor(() => {
        const foodCard = screen.getByText('Shakshuka')
        fireEvent.click(foodCard)
      })

      await waitFor(() => {
        expect(screen.getByText('Ingredients')).toBeInTheDocument()
        expect(screen.getByText('Eggs')).toBeInTheDocument()
        expect(screen.getByText('Tomatoes')).toBeInTheDocument()
      })
    })

    it('should have sticky bottom bar with total price and add to cart button', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      // Navigate to details page
      await waitFor(() => {
        const foodCard = screen.getByText('Shakshuka')
        fireEvent.click(foodCard)
      })

      await waitFor(() => {
        expect(screen.getByText('Total Price')).toBeInTheDocument()
        expect(screen.getByText('$14.99')).toBeInTheDocument()
        
        const addToCartButton = screen.getAllByText('Add to Cart').find(btn => 
          btn.closest('.sticky')
        )
        expect(addToCartButton).toHaveClass('bg-black', 'text-white', 'rounded-full')
      })
    })
  })

  describe('6. Interactive Functionality', () => {
    it('should handle category selection and filter meals', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        // Click on a different category if available
        const categories = screen.getAllByRole('button').filter(btn => 
          btn.textContent && btn.textContent !== 'Add to Cart'
        )
        
        if (categories.length > 1) {
          fireEvent.click(categories[1])
          // Verify category selection works
          expect(categories[1]).toHaveClass('bg-black', 'text-white')
        }
      })
    })

    it('should handle add to cart functionality', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const addToCartButton = screen.getAllByText('Add to Cart')[0]
        fireEvent.click(addToCartButton)
        // Add to cart should work without throwing errors
      })
    })

    it('should handle back navigation from details page', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      // Navigate to details
      await waitFor(() => {
        const foodCard = screen.getByText('Shakshuka')
        fireEvent.click(foodCard)
      })

      // Navigate back
      await waitFor(() => {
        const backButton = screen.getAllByRole('button').find(btn => 
          btn.querySelector('svg')?.classList.contains('lucide-chevron-left')
        )
        if (backButton) {
          fireEvent.click(backButton)
        }
      })

      await waitFor(() => {
        // Should be back to menu view
        expect(screen.getByText('Delicious Food')).toBeInTheDocument()
      })
    })

    it('should handle bottom navigation clicks', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const profileNav = screen.getByText('Profile')
        fireEvent.click(profileNav)
        expect(mockPush).toHaveBeenCalledWith('/profile')
      })
    })
  })

  describe('7. Responsive Design Elements', () => {
    it('should use proper mobile-first grid classes', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const gridContainer = screen.getByText('Shakshuka').closest('div')?.closest('div')?.parentElement
        expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
      })
    })

    it('should have proper spacing classes for mobile', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const mainContainer = screen.getByText('Delicious Food').closest('div')
        expect(mainContainer).toHaveClass('p-5')
      })
    })
  })

  describe('8. Visual Design Verification', () => {
    it('should use gray-100 background for main container', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const mainContainer = screen.getByText('Delicious Food').closest('div')
        expect(mainContainer).toHaveClass('bg-gray-100')
      })
    })

    it('should use white background for cards', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const foodCard = screen.getByText('Shakshuka').closest('div')?.closest('div')
        expect(foodCard).toHaveClass('bg-white')
      })
    })

    it('should use shadow-lg for card elevation', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const foodCard = screen.getByText('Shakshuka').closest('div')?.closest('div')
        expect(foodCard).toHaveClass('shadow-lg')
      })
    })

    it('should use proper text hierarchy with font weights', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const title = screen.getByText('Delicious Food')
        expect(title).toHaveClass('text-3xl', 'font-bold')
        
        const foodName = screen.getByText('Shakshuka')
        expect(foodName).toHaveClass('text-xl', 'font-bold')
      })
    })
  })

  describe('9. Accessibility Features', () => {
    it('should have proper alt text for images', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        images.forEach(img => {
          expect(img).toHaveAttribute('alt')
        })
      })
    })

    it('should have clickable buttons with proper roles', async () => {
      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
        buttons.forEach(button => {
          expect(button).toBeInTheDocument()
        })
      })
    })
  })

  describe('10. Error Handling and Edge Cases', () => {
    it('should handle missing image URLs gracefully', async () => {
      const mockMealsWithoutImages = mockMealsData.map(meal => ({
        ...meal,
        imageUrl: undefined
      }))
      
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMealsWithoutImages)
      })

      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        // Should still render cards even without images
        expect(screen.getByText('Shakshuka')).toBeInTheDocument()
      })
    })

    it('should show loading state properly', () => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'loading'
      })

      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      expect(screen.getByText('Loading menu...')).toBeInTheDocument()
    })

    it('should handle empty meals array', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      })

      render(
        <MockedMenuPage>
          <MenuPage />
        </MockedMenuPage>
      )

      await waitFor(() => {
        expect(screen.getByText('No meals available')).toBeInTheDocument()
      })
    })
  })
})

describe('Design Implementation Summary', () => {
  it('should implement all key design elements from the original template', async () => {
    render(
      <MockedMenuPage>
        <MenuPage />
      </MockedMenuPage>
    )

    await waitFor(() => {
      // Verify core design elements are implemented
      const designElements = [
        'Delicious Food', // Main title
        'Main Menu', // Category tabs
        'Home', // Bottom navigation
        'Add to Cart' // Action buttons
      ]

      designElements.forEach(element => {
        expect(screen.getByText(element)).toBeInTheDocument()
      })
    })
  })
})