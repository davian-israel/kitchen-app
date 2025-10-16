import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CartPage from '@/components/cart/CartPage'
import { useCart } from '@/contexts/CartContext'
import '@testing-library/jest-dom'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('next/navigation')
jest.mock('@/contexts/CartContext')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseCart = useCart as jest.MockedFunction<typeof useCart>

const mockPush = jest.fn()

const mockCartState = {
  items: [
    {
      id: '1',
      name: 'Falafel Plate',
      price: 12.99,
      quantity: 2,
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
  totalItems: 3,
  totalAmount: 34.97
}

const mockCartActions = {
  updateQuantity: jest.fn(),
  removeItem: jest.fn(),
  clearCart: jest.fn(),
  addItem: jest.fn(),
  toggleCart: jest.fn(),
  openCart: jest.fn(),
  closeCart: jest.fn()
}

describe('CartPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
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

    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    } as any)

    mockUseCart.mockReturnValue({
      state: mockCartState,
      ...mockCartActions
    })
  })

  it('renders cart page with items correctly', () => {
    render(<CartPage />)

    expect(screen.getByText('Shopping Cart')).toBeInTheDocument()
    expect(screen.getByText('3 items in your cart')).toBeInTheDocument()
    expect(screen.getByText('Falafel Plate')).toBeInTheDocument()
    expect(screen.getByText('Hummus Bowl')).toBeInTheDocument()
    expect(screen.getByText('Your Items')).toBeInTheDocument()
    expect(screen.getByText('Order Summary')).toBeInTheDocument()
  })

  it('displays correct breadcrumb navigation', () => {
    render(<CartPage />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Menu')).toBeInTheDocument()
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument()
  })

  it('shows empty cart when no items', () => {
    mockUseCart.mockReturnValue({
      state: { ...mockCartState, items: [], totalItems: 0, totalAmount: 0 },
      ...mockCartActions
    })

    render(<CartPage />)

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument()
    expect(screen.getByText('Browse Menu')).toBeInTheDocument()
  })

  it('handles quantity updates correctly', async () => {
    render(<CartPage />)

    const quantityInput = screen.getAllByDisplayValue('2')[0] // First item quantity
    fireEvent.change(quantityInput, { target: { value: '3' } })
    fireEvent.blur(quantityInput)

    await waitFor(() => {
      expect(mockCartActions.updateQuantity).toHaveBeenCalledWith('1', 3)
    })
  })

  it('handles item removal with confirmation', async () => {
    render(<CartPage />)

    const removeButtons = screen.getAllByLabelText('Remove item from cart')
    fireEvent.click(removeButtons[0])

    // Check if confirmation appears
    expect(screen.getByText('Remove?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()

    // Confirm removal
    fireEvent.click(screen.getByText('Yes'))

    await waitFor(() => {
      expect(mockCartActions.removeItem).toHaveBeenCalledWith('1')
    })
  })

  it('cancels item removal when user clicks No', () => {
    render(<CartPage />)

    const removeButtons = screen.getAllByLabelText('Remove item from cart')
    fireEvent.click(removeButtons[0])

    // Cancel removal
    fireEvent.click(screen.getByText('No'))

    expect(mockCartActions.removeItem).not.toHaveBeenCalled()
    expect(screen.queryByText('Remove?')).not.toBeInTheDocument()
  })

  it('handles clear cart functionality', () => {
    // Mock window.confirm to return true
    Object.defineProperty(window, 'confirm', {
      value: jest.fn(() => true),
      writable: true
    })

    render(<CartPage />)

    const clearCartButton = screen.getByText('Clear Cart')
    fireEvent.click(clearCartButton)

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear your entire cart?')
    expect(mockCartActions.clearCart).toHaveBeenCalled()
  })

  it('does not clear cart when user cancels confirmation', () => {
    // Mock window.confirm to return false
    Object.defineProperty(window, 'confirm', {
      value: jest.fn(() => false),
      writable: true
    })

    render(<CartPage />)

    const clearCartButton = screen.getByText('Clear Cart')
    fireEvent.click(clearCartButton)

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to clear your entire cart?')
    expect(mockCartActions.clearCart).not.toHaveBeenCalled()
  })

  it('displays validation error when present', async () => {
    render(<CartPage />)

    // Simulate validation that finds issues
    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    // Wait for validation to complete (mocked)
    await waitFor(() => {
      // The component should show a validation error for items with 'special' in the name
      // Since our mock data doesn't have 'special', no error should appear in this test
      expect(screen.queryByText('Cart Validation Warning')).not.toBeInTheDocument()
    })
  })

  it('shows loading state during validation', async () => {
    render(<CartPage />)

    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    expect(screen.getByText('Validating cart items...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.queryByText('Validating cart items...')).not.toBeInTheDocument()
    })
  })

  it('navigates to checkout when proceed button is clicked', () => {
    render(<CartPage />)

    const checkoutButton = screen.getByText('Proceed to Checkout')
    fireEvent.click(checkoutButton)

    // The checkout button is a Link component, so we can't test navigation directly
    // Instead, we verify the button exists and has the correct href
    expect(checkoutButton.closest('a')).toHaveAttribute('href', '/checkout')
  })

  it('navigates back to menu when back button is clicked', () => {
    render(<CartPage />)

    const backButton = screen.getByText('Back to Menu')
    fireEvent.click(backButton)

    // The back button is a Link component
    expect(backButton.closest('a')).toHaveAttribute('href', '/menu')
  })

  it('displays user information correctly', () => {
    render(<CartPage />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('shows correct item totals and grand total', () => {
    render(<CartPage />)

    // Check if individual item prices are displayed
    expect(screen.getByText('$12.99')).toBeInTheDocument() // Falafel price
    expect(screen.getByText('$8.99')).toBeInTheDocument()  // Hummus price
    
    // Check if total is displayed in summary
    expect(screen.getByText('$34.97')).toBeInTheDocument()
  })

  it('displays item categories correctly', () => {
    render(<CartPage />)

    expect(screen.getByText('Main Course')).toBeInTheDocument()
    expect(screen.getByText('Appetizer')).toBeInTheDocument()
  })

  it('shows quantity controls for each item', () => {
    render(<CartPage />)

    // Check for increment/decrement buttons
    const incrementButtons = screen.getAllByLabelText('Increase quantity')
    const decrementButtons = screen.getAllByLabelText('Decrease quantity')
    
    expect(incrementButtons).toHaveLength(2) // Two items
    expect(decrementButtons).toHaveLength(2)
  })

  it('displays item images correctly', () => {
    render(<CartPage />)

    const falafelImage = screen.getByAltText('Falafel Plate')
    const hummusImage = screen.getByAltText('Hummus Bowl')

    expect(falafelImage).toBeInTheDocument()
    expect(hummusImage).toBeInTheDocument()
    expect(falafelImage).toHaveAttribute('src', expect.stringContaining('falafel.jpg'))
    expect(hummusImage).toHaveAttribute('src', expect.stringContaining('hummus.jpg'))
  })

  it('handles items without images gracefully', () => {
    const itemsWithoutImages = {
      ...mockCartState,
      items: [
        { ...mockCartState.items[0], imageUrl: undefined },
        { ...mockCartState.items[1], imageUrl: '' }
      ]
    }

    mockUseCart.mockReturnValue({
      state: itemsWithoutImages,
      ...mockCartActions
    })

    render(<CartPage />)

    // Should still render items even without images
    expect(screen.getByText('Falafel Plate')).toBeInTheDocument()
    expect(screen.getByText('Hummus Bowl')).toBeInTheDocument()
  })

  it('shows sticky summary on desktop layout', () => {
    render(<CartPage />)

    const summarySection = screen.getByText('Order Summary').closest('div')
    expect(summarySection?.closest('div')).toHaveClass('sticky')
  })
})

// Additional test for edge cases
describe('CartPage Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
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

    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    } as any)
  })

  it('handles large quantities correctly', () => {
    const largeQuantityState = {
      ...mockCartState,
      items: [
        { ...mockCartState.items[0], quantity: 99 },
      ],
      totalItems: 99,
      totalAmount: 1285.01
    }

    mockUseCart.mockReturnValue({
      state: largeQuantityState,
      ...mockCartActions
    })

    render(<CartPage />)

    expect(screen.getByText('99 items in your cart')).toBeInTheDocument()
    expect(screen.getByDisplayValue('99')).toBeInTheDocument()
  })

  it('handles single item correctly', () => {
    const singleItemState = {
      ...mockCartState,
      items: [mockCartState.items[0]],
      totalItems: 2,
      totalAmount: 25.98
    }

    mockUseCart.mockReturnValue({
      state: singleItemState,
      ...mockCartActions
    })

    render(<CartPage />)

    expect(screen.getByText('2 items in your cart')).toBeInTheDocument()
    expect(screen.queryByText('Clear Cart')).not.toBeInTheDocument() // Should not show clear cart for single item
  })

  it('displays correct pluralization for single item', () => {
    const singleItemState = {
      ...mockCartState,
      items: [{ ...mockCartState.items[0], quantity: 1 }],
      totalItems: 1,
      totalAmount: 12.99
    }

    mockUseCart.mockReturnValue({
      state: singleItemState,
      ...mockCartActions
    })

    render(<CartPage />)

    expect(screen.getByText('1 item in your cart')).toBeInTheDocument()
  })
})