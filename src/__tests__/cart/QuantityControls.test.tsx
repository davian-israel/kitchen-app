import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import QuantityControls from '@/components/cart/QuantityControls'
import '@testing-library/jest-dom'

const mockOnQuantityChange = jest.fn()

describe('QuantityControls Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with default props', () => {
    render(<QuantityControls quantity={5} onQuantityChange={mockOnQuantityChange} />)

    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument()
    expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument()
  })

  it('handles increment button click', () => {
    render(<QuantityControls quantity={5} onQuantityChange={mockOnQuantityChange} />)

    const incrementButton = screen.getByLabelText('Increase quantity')
    fireEvent.click(incrementButton)

    expect(mockOnQuantityChange).toHaveBeenCalledWith(6)
  })

  it('handles decrement button click', () => {
    render(<QuantityControls quantity={5} onQuantityChange={mockOnQuantityChange} />)

    const decrementButton = screen.getByLabelText('Decrease quantity')
    fireEvent.click(decrementButton)

    expect(mockOnQuantityChange).toHaveBeenCalledWith(4)
  })

  it('disables decrement button at minimum quantity', () => {
    render(<QuantityControls quantity={1} minQuantity={1} onQuantityChange={mockOnQuantityChange} />)

    const decrementButton = screen.getByLabelText('Decrease quantity')
    expect(decrementButton).toBeDisabled()
  })

  it('disables increment button at maximum quantity', () => {
    render(<QuantityControls quantity={10} maxQuantity={10} onQuantityChange={mockOnQuantityChange} />)

    const incrementButton = screen.getByLabelText('Increase quantity')
    expect(incrementButton).toBeDisabled()
  })

  it('handles direct input change', () => {
    render(<QuantityControls quantity={5} onQuantityChange={mockOnQuantityChange} />)

    const input = screen.getByDisplayValue('5')
    fireEvent.change(input, { target: { value: '8' } })

    expect(mockOnQuantityChange).toHaveBeenCalledWith(8)
  })

  it('validates input on blur and corrects invalid values', () => {
    render(<QuantityControls quantity={5} onQuantityChange={mockOnQuantityChange} />)

    const input = screen.getByDisplayValue('5')
    
    // Enter invalid value
    fireEvent.change(input, { target: { value: 'abc' } })
    fireEvent.blur(input)

    // Should correct to minimum value
    expect(mockOnQuantityChange).toHaveBeenCalledWith(1)
  })

  it('corrects value that exceeds maximum on blur', () => {
    render(<QuantityControls quantity={5} maxQuantity={8} onQuantityChange={mockOnQuantityChange} />)

    const input = screen.getByDisplayValue('5')
    
    fireEvent.change(input, { target: { value: '15' } })
    fireEvent.blur(input)

    expect(mockOnQuantityChange).toHaveBeenCalledWith(8)
  })

  it('corrects value below minimum on blur', () => {
    render(<QuantityControls quantity={5} minQuantity={2} onQuantityChange={mockOnQuantityChange} />)

    const input = screen.getByDisplayValue('5')
    
    fireEvent.change(input, { target: { value: '1' } })
    fireEvent.blur(input)

    expect(mockOnQuantityChange).toHaveBeenCalledWith(2)
  })

  it('handles Enter key press to blur input', () => {
    render(<QuantityControls quantity={5} onQuantityChange={mockOnQuantityChange} />)

    const input = screen.getByDisplayValue('5')
    const blurSpy = jest.spyOn(input, 'blur')
    
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })
    
    expect(blurSpy).toHaveBeenCalled()
  })

  it('renders with small size', () => {
    render(<QuantityControls quantity={5} size="sm" onQuantityChange={mockOnQuantityChange} />)

    const input = screen.getByDisplayValue('5')
    const incrementButton = screen.getByLabelText('Increase quantity')
    
    expect(input).toHaveClass('w-8', 'h-6', 'text-xs')
    expect(incrementButton).toHaveClass('w-6', 'h-6')
  })

  it('renders with large size', () => {
    render(<QuantityControls quantity={5} size="lg" onQuantityChange={mockOnQuantityChange} />)

    const input = screen.getByDisplayValue('5')
    const incrementButton = screen.getByLabelText('Increase quantity')
    
    expect(input).toHaveClass('w-16', 'h-10', 'text-base')
    expect(incrementButton).toHaveClass('w-10', 'h-10')
  })

  it('disables all controls when disabled prop is true', () => {
    render(<QuantityControls quantity={5} disabled={true} onQuantityChange={mockOnQuantityChange} />)

    const input = screen.getByDisplayValue('5')
    const incrementButton = screen.getByLabelText('Increase quantity')
    const decrementButton = screen.getByLabelText('Decrease quantity')
    
    expect(input).toBeDisabled()
    expect(incrementButton).toBeDisabled()
    expect(decrementButton).toBeDisabled()
  })

  it('hides input when showInput is false', () => {
    render(<QuantityControls quantity={5} showInput={false} onQuantityChange={mockOnQuantityChange} />)

    expect(screen.queryByDisplayValue('5')).not.toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // Should show as text instead
  })

  it('respects custom min and max quantities', () => {
    render(
      <QuantityControls 
        quantity={5} 
        minQuantity={3} 
        maxQuantity={7} 
        onQuantityChange={mockOnQuantityChange} 
      />
    )

    const input = screen.getByDisplayValue('5')
    
    // Test below minimum
    fireEvent.change(input, { target: { value: '2' } })
    fireEvent.blur(input)
    expect(mockOnQuantityChange).toHaveBeenCalledWith(3)

    // Test above maximum
    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.blur(input)
    expect(mockOnQuantityChange).toHaveBeenCalledWith(7)
  })

  it('provides accessibility information', () => {
    render(
      <QuantityControls 
        quantity={5} 
        minQuantity={1} 
        maxQuantity={10} 
        onQuantityChange={mockOnQuantityChange} 
      />
    )

    expect(screen.getByText('Current quantity: 5. Minimum: 1, Maximum: 10')).toBeInTheDocument()
  })

  it('updates display value when quantity prop changes', () => {
    const { rerender } = render(<QuantityControls quantity={5} onQuantityChange={mockOnQuantityChange} />)

    expect(screen.getByDisplayValue('5')).toBeInTheDocument()

    rerender(<QuantityControls quantity={8} onQuantityChange={mockOnQuantityChange} />)
    expect(screen.getByDisplayValue('8')).toBeInTheDocument()
  })

  it('does not update display value when input is focused', () => {
    const { rerender } = render(<QuantityControls quantity={5} onQuantityChange={mockOnQuantityChange} />)

    const input = screen.getByDisplayValue('5')
    fireEvent.focus(input)
    
    // Change the input value
    fireEvent.change(input, { target: { value: '7' } })

    // Re-render with different quantity prop
    rerender(<QuantityControls quantity={10} onQuantityChange={mockOnQuantityChange} />)
    
    // Should still show the user's input, not the new prop value
    expect(screen.getByDisplayValue('7')).toBeInTheDocument()
  })

  it('only calls onQuantityChange for valid numbers within range', () => {
    render(<QuantityControls quantity={5} maxQuantity={8} onQuantityChange={mockOnQuantityChange} />)

    const input = screen.getByDisplayValue('5')
    
    // Valid number within range
    fireEvent.change(input, { target: { value: '7' } })
    expect(mockOnQuantityChange).toHaveBeenCalledWith(7)

    // Invalid string - should not call
    mockOnQuantityChange.mockClear()
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(mockOnQuantityChange).not.toHaveBeenCalled()

    // Number outside range - should not call during typing
    mockOnQuantityChange.mockClear()
    fireEvent.change(input, { target: { value: '15' } })
    expect(mockOnQuantityChange).not.toHaveBeenCalled()
  })

  it('handles edge case where quantity equals maxQuantity', () => {
    render(<QuantityControls quantity={10} maxQuantity={10} onQuantityChange={mockOnQuantityChange} />)

    const incrementButton = screen.getByLabelText('Increase quantity')
    expect(incrementButton).toBeDisabled()

    // Clicking should not trigger callback
    fireEvent.click(incrementButton)
    expect(mockOnQuantityChange).not.toHaveBeenCalled()
  })

  it('handles edge case where quantity equals minQuantity', () => {
    render(<QuantityControls quantity={1} minQuantity={1} onQuantityChange={mockOnQuantityChange} />)

    const decrementButton = screen.getByLabelText('Decrease quantity')
    expect(decrementButton).toBeDisabled()

    // Clicking should not trigger callback
    fireEvent.click(decrementButton)
    expect(mockOnQuantityChange).not.toHaveBeenCalled()
  })
})