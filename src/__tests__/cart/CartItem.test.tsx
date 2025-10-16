import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CartItem from '@/components/cart/CartItem'
import '@testing-library/jest-dom'

const mockItem = {
  id: '1',
  name: 'Falafel Plate',
  price: 12.99,
  quantity: 2,
  imageUrl: '/images/falafel.jpg',
  category: 'Main Course',
  availability: 'in_stock' as const,
  maxQuantity: 10
}

const mockHandlers = {
  onUpdateQuantity: jest.fn(),
  onRemoveItem: jest.fn(),
  onSaveForLater: jest.fn(),
  onMoveToCart: jest.fn()
}

describe('CartItem Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders item information correctly', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    expect(screen.getByText('Falafel Plate')).toBeInTheDocument()
    expect(screen.getByText('Main Course')).toBeInTheDocument()
    expect(screen.getByText('$12.99')).toBeInTheDocument()
    expect(screen.getByText('$25.98 total')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
  })

  it('displays item image correctly', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const image = screen.getByAltText('Falafel Plate')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', expect.stringContaining('falafel.jpg'))
  })

  it('handles missing image gracefully', () => {
    const itemWithoutImage = { ...mockItem, imageUrl: undefined }
    render(<CartItem item={itemWithoutImage} {...mockHandlers} />)

    expect(screen.getByText('Falafel Plate')).toBeInTheDocument()
    expect(screen.queryByAltText('Falafel Plate')).not.toBeInTheDocument()
  })

  it('handles quantity increase', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const incrementButton = screen.getByLabelText('Increase quantity')
    fireEvent.click(incrementButton)

    expect(mockHandlers.onUpdateQuantity).toHaveBeenCalledWith('1', 3)
  })

  it('handles quantity decrease', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const decrementButton = screen.getByLabelText('Decrease quantity')
    fireEvent.click(decrementButton)

    expect(mockHandlers.onUpdateQuantity).toHaveBeenCalledWith('1', 1)
  })

  it('prevents quantity from going below 1', () => {
    const singleQuantityItem = { ...mockItem, quantity: 1 }
    render(<CartItem item={singleQuantityItem} {...mockHandlers} />)

    const decrementButton = screen.getByLabelText('Decrease quantity')
    expect(decrementButton).toBeDisabled()
  })

  it('prevents quantity from exceeding maximum', () => {
    const maxQuantityItem = { ...mockItem, quantity: 10, maxQuantity: 10 }
    render(<CartItem item={maxQuantityItem} {...mockHandlers} />)

    const incrementButton = screen.getByLabelText('Increase quantity')
    expect(incrementButton).toBeDisabled()
  })

  it('handles direct quantity input', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const quantityInput = screen.getByDisplayValue('2')
    fireEvent.change(quantityInput, { target: { value: '5' } })
    fireEvent.blur(quantityInput)

    expect(mockHandlers.onUpdateQuantity).toHaveBeenCalledWith('1', 5)
  })

  it('validates quantity input and corrects invalid values', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const quantityInput = screen.getByDisplayValue('2')
    
    // Test invalid input
    fireEvent.change(quantityInput, { target: { value: 'abc' } })
    fireEvent.blur(quantityInput)

    // Should reset to minimum quantity (1)
    expect(mockHandlers.onUpdateQuantity).toHaveBeenCalledWith('1', 1)
  })

  it('corrects quantity input that exceeds maximum', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const quantityInput = screen.getByDisplayValue('2')
    fireEvent.change(quantityInput, { target: { value: '20' } })
    fireEvent.blur(quantityInput)

    // Should reset to maximum quantity (10)
    expect(mockHandlers.onUpdateQuantity).toHaveBeenCalledWith('1', 10)
  })

  it('shows remove confirmation dialog', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const removeButton = screen.getByLabelText('Remove item from cart')
    fireEvent.click(removeButton)

    expect(screen.getByText('Remove?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('confirms item removal', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const removeButton = screen.getByLabelText('Remove item from cart')
    fireEvent.click(removeButton)

    const confirmButton = screen.getByText('Yes')
    fireEvent.click(confirmButton)

    expect(mockHandlers.onRemoveItem).toHaveBeenCalledWith('1')
  })

  it('cancels item removal', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const removeButton = screen.getByLabelText('Remove item from cart')
    fireEvent.click(removeButton)

    const cancelButton = screen.getByText('No')
    fireEvent.click(cancelButton)

    expect(mockHandlers.onRemoveItem).not.toHaveBeenCalled()
    expect(screen.queryByText('Remove?')).not.toBeInTheDocument()
  })

  it('handles save for later functionality', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const saveButton = screen.getByLabelText('Save item for later')
    fireEvent.click(saveButton)

    expect(mockHandlers.onSaveForLater).toHaveBeenCalledWith('1')
  })

  it('displays low stock warning', () => {
    const lowStockItem = { ...mockItem, availability: 'low_stock' as const }
    render(<CartItem item={lowStockItem} {...mockHandlers} />)

    expect(screen.getByText('Low stock')).toBeInTheDocument()
  })

  it('displays out of stock status', () => {
    const outOfStockItem = { ...mockItem, availability: 'out_of_stock' as const }
    render(<CartItem item={outOfStockItem} {...mockHandlers} />)

    expect(screen.getByText('Out of Stock')).toBeInTheDocument()
    expect(screen.getByText('Out of stock')).toBeInTheDocument()
  })

  it('disables controls for out of stock items', () => {
    const outOfStockItem = { ...mockItem, availability: 'out_of_stock' as const }
    render(<CartItem item={outOfStockItem} {...mockHandlers} />)

    const incrementButton = screen.getByLabelText('Increase quantity')
    const decrementButton = screen.getByLabelText('Decrease quantity')
    const quantityInput = screen.getByDisplayValue('2')

    expect(incrementButton).toBeDisabled()
    expect(decrementButton).toBeDisabled()
    expect(quantityInput).toBeDisabled()
  })

  it('displays saved for later state correctly', () => {
    const savedItem = { ...mockItem, savedForLater: true }
    render(<CartItem item={savedItem} {...mockHandlers} />)

    expect(screen.getByText('Saved for Later')).toBeInTheDocument()
    expect(screen.getByText('Move to Cart')).toBeInTheDocument()
  })

  it('handles move to cart from saved items', () => {
    const savedItem = { ...mockItem, savedForLater: true }
    render(<CartItem item={savedItem} {...mockHandlers} />)

    const moveToCartButton = screen.getByText('Move to Cart')
    fireEvent.click(moveToCartButton)

    expect(mockHandlers.onMoveToCart).toHaveBeenCalledWith('1')
  })

  it('shows updating state correctly', () => {
    render(<CartItem item={mockItem} {...mockHandlers} isUpdating={true} />)

    // Component should show loading indicator and be non-interactive
    const container = screen.getByText('Falafel Plate').closest('div')
    expect(container).toHaveClass('opacity-60', 'pointer-events-none')
  })

  it('calculates item total correctly for different quantities', () => {
    const multipleQuantityItem = { ...mockItem, quantity: 5 }
    render(<CartItem item={multipleQuantityItem} {...mockHandlers} />)

    expect(screen.getByText('$64.95 total')).toBeInTheDocument()
  })

  it('handles single quantity items without showing total', () => {
    const singleQuantityItem = { ...mockItem, quantity: 1 }
    render(<CartItem item={singleQuantityItem} {...mockHandlers} />)

    expect(screen.queryByText('total')).not.toBeInTheDocument()
  })

  it('applies correct styling for different availability states', () => {
    const { rerender } = render(<CartItem item={mockItem} {...mockHandlers} />)
    
    // Normal item
    let container = screen.getByText('Falafel Plate').closest('div')
    expect(container).toHaveClass('border-gray-200', 'hover:shadow-md')

    // Out of stock item
    const outOfStockItem = { ...mockItem, availability: 'out_of_stock' as const }
    rerender(<CartItem item={outOfStockItem} {...mockHandlers} />)
    
    container = screen.getByText('Falafel Plate').closest('div')
    expect(container).toHaveClass('bg-gray-50', 'border-gray-200')
  })

  it('handles image loading errors', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    const image = screen.getByAltText('Falafel Plate')
    
    // Simulate image load error
    fireEvent.error(image)

    // Should fallback to placeholder
    expect(screen.queryByAltText('Falafel Plate')).not.toBeInTheDocument()
  })

  it('provides proper accessibility labels', () => {
    render(<CartItem item={mockItem} {...mockHandlers} />)

    expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument()
    expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument()
    expect(screen.getByLabelText('Remove item from cart')).toBeInTheDocument()
    expect(screen.getByLabelText('Save item for later')).toBeInTheDocument()
  })
})