import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CartSummary from '@/components/cart/CartSummary'
import '@testing-library/jest-dom'

const mockItems = [
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
]

const mockTotal = 34.97

describe('CartSummary Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders order summary correctly', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    expect(screen.getByText('Order Summary')).toBeInTheDocument()
    expect(screen.getByText('Subtotal (3 items)')).toBeInTheDocument()
    expect(screen.getByText('$34.97')).toBeInTheDocument()
  })

  it('displays correct item count pluralization', () => {
    const singleItem = [mockItems[0]]
    render(<CartSummary items={singleItem} total={25.98} />)

    expect(screen.getByText('Subtotal (2 items)')).toBeInTheDocument()
  })

  it('renders delivery options', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    expect(screen.getByText('Delivery Options')).toBeInTheDocument()
    expect(screen.getByText('Standard Delivery')).toBeInTheDocument()
    expect(screen.getByText('Express Delivery')).toBeInTheDocument()
    expect(screen.getByText('45-60 min')).toBeInTheDocument()
    expect(screen.getByText('25-35 min')).toBeInTheDocument()
  })

  it('selects standard delivery by default', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    const standardDeliveryRadio = screen.getByDisplayValue('standard')
    expect(standardDeliveryRadio).toBeChecked()
  })

  it('allows changing delivery option', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    const expressDeliveryRadio = screen.getByDisplayValue('express')
    fireEvent.click(expressDeliveryRadio)

    expect(expressDeliveryRadio).toBeChecked()
  })

  it('shows free delivery for orders over threshold', () => {
    const largeOrder = [
      { ...mockItems[0], quantity: 3, price: 15.00 } // $45 total
    ]
    render(<CartSummary items={largeOrder} total={45.00} />)

    expect(screen.getByText('FREE')).toBeInTheDocument()
  })

  it('shows free delivery promotion message for orders under threshold', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    // Should show how much more is needed for free delivery
    const freeDeliveryMessage = screen.getByText(/Add.*more for free delivery/)
    expect(freeDeliveryMessage).toBeInTheDocument()
  })

  it('calculates tax correctly', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    // Tax should be calculated as 8.25% of subtotal
    const expectedTax = (34.97 * 0.0825).toFixed(2)
    expect(screen.getByText(`$${expectedTax}`)).toBeInTheDocument()
    expect(screen.getByText('Tax')).toBeInTheDocument()
  })

  it('shows promo code section', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    expect(screen.getByText('Promo Code')).toBeInTheDocument()
    expect(screen.getByText('Add code')).toBeInTheDocument()
  })

  it('allows entering and applying promo code', async () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    // Click "Add code" button
    fireEvent.click(screen.getByText('Add code'))

    // Enter promo code
    const promoInput = screen.getByPlaceholderText('Enter promo code')
    fireEvent.change(promoInput, { target: { value: 'WELCOME10' } })

    // Apply promo code
    fireEvent.click(screen.getByText('Apply'))

    await waitFor(() => {
      expect(screen.getByText('WELCOME10 applied')).toBeInTheDocument()
    })
  })

  it('shows discount when promo code is applied', async () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    // Apply promo code
    fireEvent.click(screen.getByText('Add code'))
    const promoInput = screen.getByPlaceholderText('Enter promo code')
    fireEvent.change(promoInput, { target: { value: 'WELCOME10' } })
    fireEvent.click(screen.getByText('Apply'))

    await waitFor(() => {
      expect(screen.getByText('Discount (WELCOME10)')).toBeInTheDocument()
      expect(screen.getByText('-$3.50')).toBeInTheDocument() // 10% of $34.97
    })
  })

  it('allows removing applied promo code', async () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    // Apply promo code
    fireEvent.click(screen.getByText('Add code'))
    const promoInput = screen.getByPlaceholderText('Enter promo code')
    fireEvent.change(promoInput, { target: { value: 'WELCOME10' } })
    fireEvent.click(screen.getByText('Apply'))

    await waitFor(() => {
      expect(screen.getByText('WELCOME10 applied')).toBeInTheDocument()
    })

    // Remove promo code
    fireEvent.click(screen.getByText('Remove'))

    expect(screen.queryByText('WELCOME10 applied')).not.toBeInTheDocument()
    expect(screen.queryByText('Discount (WELCOME10)')).not.toBeInTheDocument()
  })

  it('handles invalid promo codes', async () => {
    // Mock alert function
    Object.defineProperty(window, 'alert', {
      value: jest.fn(),
      writable: true
    })

    render(<CartSummary items={mockItems} total={mockTotal} />)

    fireEvent.click(screen.getByText('Add code'))
    const promoInput = screen.getByPlaceholderText('Enter promo code')
    fireEvent.change(promoInput, { target: { value: 'INVALID' } })
    fireEvent.click(screen.getByText('Apply'))

    expect(window.alert).toHaveBeenCalledWith('Invalid promo code')
  })

  it('calculates grand total correctly', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    // Should show calculated grand total including tax and delivery
    const subtotal = 34.97
    const tax = subtotal * 0.0825
    const delivery = 4.99 // Standard delivery
    const grandTotal = (subtotal + tax + delivery).toFixed(2)

    expect(screen.getByText(`$${grandTotal}`)).toBeInTheDocument()
  })

  it('shows estimated delivery time', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    expect(screen.getByText(/Estimated delivery:/)).toBeInTheDocument()
    expect(screen.getByText(/45-60 min/)).toBeInTheDocument()
  })

  it('updates estimated delivery time when delivery option changes', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    // Switch to express delivery
    const expressRadio = screen.getByDisplayValue('express')
    fireEvent.click(expressRadio)

    expect(screen.getByText(/25-35 min/)).toBeInTheDocument()
  })

  it('renders checkout button', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    const checkoutButton = screen.getByText('Proceed to Checkout')
    expect(checkoutButton).toBeInTheDocument()
    expect(checkoutButton.closest('a')).toHaveAttribute('href', '/checkout')
  })

  it('renders continue shopping button', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    const continueButton = screen.getByText('Continue Shopping')
    expect(continueButton).toBeInTheDocument()
    expect(continueButton.closest('a')).toHaveAttribute('href', '/menu')
  })

  it('does not show action buttons for empty cart', () => {
    render(<CartSummary items={[]} total={0} />)

    expect(screen.queryByText('Proceed to Checkout')).not.toBeInTheDocument()
    expect(screen.queryByText('Continue Shopping')).not.toBeInTheDocument()
  })

  it('calls onProceedToCheckout callback when provided', () => {
    const mockCallback = jest.fn()
    render(<CartSummary items={mockItems} total={mockTotal} onProceedToCheckout={mockCallback} />)

    const checkoutButton = screen.getByText('Proceed to Checkout')
    fireEvent.click(checkoutButton)

    expect(mockCallback).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    const { container } = render(
      <CartSummary items={mockItems} total={mockTotal} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles fixed discount promo codes', async () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    fireEvent.click(screen.getByText('Add code'))
    const promoInput = screen.getByPlaceholderText('Enter promo code')
    fireEvent.change(promoInput, { target: { value: 'SAVE5' } })
    fireEvent.click(screen.getByText('Apply'))

    await waitFor(() => {
      expect(screen.getByText('-$5.00')).toBeInTheDocument()
    })
  })

  it('shows crossed out delivery price when free delivery applies', () => {
    const largeOrder = [
      { ...mockItems[0], quantity: 3, price: 15.00 } // $45 total, qualifies for free delivery
    ]
    render(<CartSummary items={largeOrder} total={45.00} />)

    // Should show crossed out original delivery price
    expect(screen.getByText('$4.99')).toHaveClass('line-through')
    expect(screen.getByText('FREE')).toBeInTheDocument()
  })

  it('disables apply button when promo code input is empty', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    fireEvent.click(screen.getByText('Add code'))
    const applyButton = screen.getByText('Apply')
    
    expect(applyButton).toBeDisabled()
  })

  it('enables apply button when promo code is entered', () => {
    render(<CartSummary items={mockItems} total={mockTotal} />)

    fireEvent.click(screen.getByText('Add code'))
    const promoInput = screen.getByPlaceholderText('Enter promo code')
    const applyButton = screen.getByText('Apply')
    
    fireEvent.change(promoInput, { target: { value: 'TEST' } })
    
    expect(applyButton).not.toBeDisabled()
  })
})