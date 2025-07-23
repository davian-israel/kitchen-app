import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MenuPage from '@/app/(app)/menu/page'
import CheckoutPage from '@/app/(app)/checkout/page'
import { CartProvider } from '@/contexts/CartContext'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('next/navigation')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockPush = jest.fn()
const mockFetch = jest.fn()

global.fetch = mockFetch

describe('Order Flow E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        },
      },
      status: 'authenticated',
    })

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    })
  })

  const mockMeals = [
    {
      id: 'meal-1',
      name: 'Delicious Pasta',
      description: 'Fresh pasta with tomato sauce',
      price: 15.99,
      category: 'Main Course',
      imageUrl: '/images/pasta.jpg',
      ingredients: ['pasta', 'tomato', 'basil'],
      allergens: ['gluten'],
      available: true,
    },
    {
      id: 'meal-2',
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with caesar dressing',
      price: 12.99,
      category: 'Salads',
      imageUrl: '/images/salad.jpg',
      ingredients: ['lettuce', 'parmesan', 'croutons'],
      allergens: ['dairy'],
      available: true,
    },
  ]

  it('should complete full order flow from menu to checkout', async () => {
    const user = userEvent.setup()

    // Mock meals API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMeals,
    })

    const MenuWithCart = () => (
      <CartProvider>
        <MenuPage />
      </CartProvider>
    )

    render(<MenuWithCart />)

    // Wait for meals to load
    await waitFor(() => {
      expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument()
    })

    // Add first meal to cart
    const addToCartButtons = screen.getAllByText(/add to cart/i)
    await user.click(addToCartButtons[0])

    // Verify item was added to cart
    await waitFor(() => {
      expect(screen.getByText(/1 item/i)).toBeInTheDocument()
    })

    // Add second meal to cart
    await user.click(addToCartButtons[1])

    // Verify cart updated
    await waitFor(() => {
      expect(screen.getByText(/2 items/i)).toBeInTheDocument()
    })

    // Open cart
    const cartButton = screen.getByRole('button', { name: /cart/i })
    await user.click(cartButton)

    // Verify cart contents
    expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
    expect(screen.getByText('Caesar Salad')).toBeInTheDocument()
    expect(screen.getByText('$15.99')).toBeInTheDocument()
    expect(screen.getByText('$12.99')).toBeInTheDocument()

    // Proceed to checkout
    const checkoutButton = screen.getByRole('button', { name: /checkout/i })
    await user.click(checkoutButton)

    expect(mockPush).toHaveBeenCalledWith('/checkout')
  })

  it('should handle quantity updates in cart', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMeals,
    })

    const MenuWithCart = () => (
      <CartProvider>
        <MenuPage />
      </CartProvider>
    )

    render(<MenuWithCart />)

    await waitFor(() => {
      expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
    })

    // Add meal to cart
    const addToCartButton = screen.getAllByText(/add to cart/i)[0]
    await user.click(addToCartButton)

    // Open cart
    const cartButton = screen.getByRole('button', { name: /cart/i })
    await user.click(cartButton)

    // Increase quantity
    const increaseButton = screen.getByRole('button', { name: /\+/i })
    await user.click(increaseButton)

    // Verify quantity updated
    await waitFor(() => {
      expect(screen.getByDisplayValue('2')).toBeInTheDocument()
    })

    // Verify total updated
    expect(screen.getByText('$31.98')).toBeInTheDocument() // 2 * $15.99
  })

  it('should handle item removal from cart', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMeals,
    })

    const MenuWithCart = () => (
      <CartProvider>
        <MenuPage />
      </CartProvider>
    )

    render(<MenuWithCart />)

    await waitFor(() => {
      expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
    })

    // Add meal to cart
    const addToCartButton = screen.getAllByText(/add to cart/i)[0]
    await user.click(addToCartButton)

    // Open cart
    const cartButton = screen.getByRole('button', { name: /cart/i })
    await user.click(cartButton)

    // Remove item
    const removeButton = screen.getByRole('button', { name: /remove/i })
    await user.click(removeButton)

    // Verify cart is empty
    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()
    })
  })

  it('should complete checkout process', async () => {
    const user = userEvent.setup()

    // Mock successful order creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          orderId: 'order-123',
          orderNumber: 'IK-123456789',
        },
      }),
    })

    // Mock Stripe payment intent creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        clientSecret: 'pi_test_client_secret',
      }),
    })

    const CheckoutWithCart = () => (
      <CartProvider>
        <CheckoutPage />
      </CartProvider>
    )

    render(<CheckoutWithCart />)

    // Fill out customer information
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const phoneInput = screen.getByLabelText(/phone/i)
    const streetInput = screen.getByLabelText(/street address/i)
    const cityInput = screen.getByLabelText(/city/i)
    const stateInput = screen.getByLabelText(/state/i)
    const zipInput = screen.getByLabelText(/zip code/i)

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(phoneInput, '+1234567890')
    await user.type(streetInput, '123 Main St')
    await user.type(cityInput, 'Anytown')
    await user.type(stateInput, 'CA')
    await user.type(zipInput, '12345')

    // Submit order
    const placeOrderButton = screen.getByRole('button', { name: /place order/i })
    await user.click(placeOrderButton)

    // Should redirect to success page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/checkout/success?orderId=order-123')
    })
  })

  it('should handle checkout validation errors', async () => {
    const user = userEvent.setup()

    const CheckoutWithCart = () => (
      <CartProvider>
        <CheckoutPage />
      </CartProvider>
    )

    render(<CheckoutWithCart />)

    // Try to submit without filling required fields
    const placeOrderButton = screen.getByRole('button', { name: /place order/i })
    await user.click(placeOrderButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
    })

    // Should not make API call
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle payment failures', async () => {
    const user = userEvent.setup()

    // Mock payment failure
    mockFetch.mockRejectedValueOnce(new Error('Payment failed'))

    const CheckoutWithCart = () => (
      <CartProvider>
        <CheckoutPage />
      </CartProvider>
    )

    render(<CheckoutWithCart />)

    // Fill out form
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/email/i), 'john@example.com')
    await user.type(screen.getByLabelText(/phone/i), '+1234567890')
    await user.type(screen.getByLabelText(/street address/i), '123 Main St')
    await user.type(screen.getByLabelText(/city/i), 'Anytown')
    await user.type(screen.getByLabelText(/state/i), 'CA')
    await user.type(screen.getByLabelText(/zip code/i), '12345')

    // Submit order
    const placeOrderButton = screen.getByRole('button', { name: /place order/i })
    await user.click(placeOrderButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/payment failed/i)).toBeInTheDocument()
    })

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('/checkout/success'))
  })

  it('should persist cart across page refreshes', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMeals,
    })

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(JSON.stringify([
        {
          id: 'meal-1',
          name: 'Delicious Pasta',
          price: 15.99,
          quantity: 2,
          category: 'Main Course',
        },
      ])),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    }
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })

    const MenuWithCart = () => (
      <CartProvider>
        <MenuPage />
      </CartProvider>
    )

    render(<MenuWithCart />)

    // Should load cart from localStorage
    await waitFor(() => {
      expect(screen.getByText(/2 items/i)).toBeInTheDocument()
    })

    // Open cart to verify contents
    const cartButton = screen.getByRole('button', { name: /cart/i })
    await user.click(cartButton)

    expect(screen.getByText('Delicious Pasta')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
  })

  it('should handle empty cart checkout attempt', async () => {
    const CheckoutWithCart = () => (
      <CartProvider>
        <CheckoutPage />
      </CartProvider>
    )

    render(<CheckoutWithCart />)

    // Should show empty cart message
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument()

    // Should not show checkout form
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument()
  })
})