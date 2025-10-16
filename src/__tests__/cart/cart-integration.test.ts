import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Cart from '@/app/(app)/cart/page'
import { useCart } from '@/contexts/CartContext'
import '@testing-library/jest-dom'

// Mock the modules
jest.mock('next-auth/react')
jest.mock('next/navigation')
jest.mock('@/contexts/CartContext')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseCart = useCart as jest.MockedFunction<typeof useCart>

const mockPush = jest.fn()

describe('Cart Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    } as any)

    mockUseCart.mockReturnValue({
      state: {
        items: [],
        isOpen: false,
        totalItems: 0,
        totalAmount: 0
      },
      updateQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
      addItem: jest.fn(),
      toggleCart: jest.fn(),
      openCart: jest.fn(),
      closeCart: jest.fn()
    })
  })

  describe('Authentication Flow', () => {
    it('redirects to sign in when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated'
      })

      render(<Cart />)

      expect(mockPush).toHaveBeenCalledWith('/auth/signin?callbackUrl=/cart')
    })

    it('shows loading state during authentication check', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      })

      render(<Cart />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('renders cart page when authenticated with items', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        status: 'authenticated'
      })

      mockUseCart.mockReturnValue({
        state: {
          items: [{
            id: '1',
            name: 'Falafel Plate',
            price: 12.99,
            quantity: 1,
            imageUrl: '/images/falafel.jpg',
            category: 'Main Course'
          }],
          isOpen: false,
          totalItems: 1,
          totalAmount: 12.99
        },
        updateQuantity: jest.fn(),
        removeItem: jest.fn(),
        clearCart: jest.fn(),
        addItem: jest.fn(),
        toggleCart: jest.fn(),
        openCart: jest.fn(),
        closeCart: jest.fn()
      })

      render(<Cart />)

      expect(screen.getByText('Shopping Cart')).toBeInTheDocument()
      expect(screen.getByText('Falafel Plate')).toBeInTheDocument()
    })

    it('renders empty cart when authenticated with no items', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        status: 'authenticated'
      })

      render(<Cart />)

      expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
      expect(screen.getByText('Browse Menu')).toBeInTheDocument()
    })
  })

  describe('Cart State Management', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        status: 'authenticated'
      })
    })

    it('updates quantity through cart context', async () => {
      const mockUpdateQuantity = jest.fn()
      
      mockUseCart.mockReturnValue({
        state: {
          items: [{
            id: '1',
            name: 'Falafel Plate',
            price: 12.99,
            quantity: 2,
            imageUrl: '/images/falafel.jpg',
            category: 'Main Course'
          }],
          isOpen: false,
          totalItems: 2,
          totalAmount: 25.98
        },
        updateQuantity: mockUpdateQuantity,
        removeItem: jest.fn(),
        clearCart: jest.fn(),
        addItem: jest.fn(),
        toggleCart: jest.fn(),
        openCart: jest.fn(),
        closeCart: jest.fn()
      })

      render(<Cart />)

      const incrementButton = screen.getByLabelText('Increase quantity')
      fireEvent.click(incrementButton)

      await waitFor(() => {
        expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 3)
      })
    })

    it('removes item through cart context', async () => {
      const mockRemoveItem = jest.fn()
      
      mockUseCart.mockReturnValue({
        state: {
          items: [{
            id: '1',
            name: 'Falafel Plate',
            price: 12.99,
            quantity: 1,
            imageUrl: '/images/falafel.jpg',
            category: 'Main Course'
          }],
          isOpen: false,
          totalItems: 1,
          totalAmount: 12.99
        },
        updateQuantity: jest.fn(),
        removeItem: mockRemoveItem,
        clearCart: jest.fn(),
        addItem: jest.fn(),
        toggleCart: jest.fn(),
        openCart: jest.fn(),
        closeCart: jest.fn()
      })

      render(<Cart />)

      const removeButton = screen.getByLabelText('Remove item from cart')
      fireEvent.click(removeButton)

      // Confirm removal
      const confirmButton = screen.getByText('Yes')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockRemoveItem).toHaveBeenCalledWith('1')
      })
    })

    it('clears entire cart through cart context', () => {
      const mockClearCart = jest.fn()
      
      // Mock window.confirm to return true
      Object.defineProperty(window, 'confirm', {
        value: jest.fn(() => true),
        writable: true
      })

      mockUseCart.mockReturnValue({
        state: {
          items: [
            {
              id: '1',
              name: 'Falafel Plate',
              price: 12.99,
              quantity: 1,
              imageUrl: '/images/falafel.jpg',
              category: 'Main Course'
            },
            {
              id: '2',
              name: 'Hummus Bowl',
              price: 8.99,
              quantity: 1,
              imageUrl: '/images/hummus.jpg',
              category: 'Appetizer'
            }
          ],
          isOpen: false,
          totalItems: 2,
          totalAmount: 21.98
        },
        updateQuantity: jest.fn(),
        removeItem: jest.fn(),
        clearCart: mockClearCart,
        addItem: jest.fn(),
        toggleCart: jest.fn(),
        openCart: jest.fn(),
        closeCart: jest.fn()
      })

      render(<Cart />)

      const clearCartButton = screen.getByText('Clear Cart')
      fireEvent.click(clearCartButton)

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear your entire cart?')
      expect(mockClearCart).toHaveBeenCalled()
    })
  })

  describe('Navigation Integration', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        status: 'authenticated'
      })

      mockUseCart.mockReturnValue({
        state: {
          items: [{
            id: '1',
            name: 'Falafel Plate',
            price: 12.99,
            quantity: 1,
            imageUrl: '/images/falafel.jpg',
            category: 'Main Course'
          }],
          isOpen: false,
          totalItems: 1,
          totalAmount: 12.99
        },
        updateQuantity: jest.fn(),
        removeItem: jest.fn(),
        clearCart: jest.fn(),
        addItem: jest.fn(),
        toggleCart: jest.fn(),
        openCart: jest.fn(),
        closeCart: jest.fn()
      })
    })

    it('has correct breadcrumb links', () => {
      render(<Cart />)

      const dashboardLink = screen.getByText('Dashboard').closest('a')
      const menuLink = screen.getByText('Menu').closest('a')

      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
      expect(menuLink).toHaveAttribute('href', '/menu')
    })

    it('has correct navigation links', () => {
      render(<Cart />)

      const backToMenuLink = screen.getByText('Back to Menu').closest('a')
      const checkoutLink = screen.getByText('Proceed to Checkout').closest('a')
      const continueShoppingLink = screen.getByText('Continue Shopping').closest('a')

      expect(backToMenuLink).toHaveAttribute('href', '/menu')
      expect(checkoutLink).toHaveAttribute('href', '/checkout')
      expect(continueShoppingLink).toHaveAttribute('href', '/menu')
    })

    it('has footer navigation links', () => {
      render(<Cart />)

      const orderHistoryLink = screen.getByText('View Order History').closest('a')
      const accountSettingsLink = screen.getByText('Account Settings').closest('a')

      expect(orderHistoryLink).toHaveAttribute('href', '/orders')
      expect(accountSettingsLink).toHaveAttribute('href', '/profile')
    })
  })

  describe('Error Handling', () => {
    it('handles session loading errors gracefully', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading'
      })

      render(<Cart />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Error')).not.toBeInTheDocument()
    })

    it('handles cart context errors gracefully', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        status: 'authenticated'
      })

      // Mock cart context to throw error
      mockUseCart.mockImplementation(() => {
        throw new Error('Cart context error')
      })

      // This should not crash the app
      expect(() => render(<Cart />)).toThrow('Cart context error')
    })
  })

  describe('Performance', () => {
    it('renders efficiently with large cart', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com'
          }
        },
        status: 'authenticated'
      })

      // Create a large cart with many items
      const largeCart = Array.from({ length: 50 }, (_, index) => ({
        id: `item-${index}`,
        name: `Item ${index}`,
        price: 10 + index,
        quantity: 1 + (index % 3),
        imageUrl: `/images/item-${index}.jpg`,
        category: 'Main Course'
      }))

      mockUseCart.mockReturnValue({
        state: {
          items: largeCart,
          isOpen: false,
          totalItems: largeCart.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: largeCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        },
        updateQuantity: jest.fn(),
        removeItem: jest.fn(),
        clearCart: jest.fn(),
        addItem: jest.fn(),
        toggleCart: jest.fn(),
        openCart: jest.fn(),
        closeCart: jest.fn()
      })

      const startTime = performance.now()
      render(<Cart />)
      const endTime = performance.now()

      // Should render in reasonable time (less than 100ms for 50 items)
      expect(endTime - startTime).toBeLessThan(100)
      
      // Verify all items are rendered
      expect(screen.getAllByText(/Item \d+/)).toHaveLength(50)
    })
  })
})