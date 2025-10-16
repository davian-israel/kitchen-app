'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'

interface QuantityControlsProps {
  quantity: number
  maxQuantity?: number
  minQuantity?: number
  onQuantityChange: (quantity: number) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  showInput?: boolean
}

export default function QuantityControls({
  quantity,
  maxQuantity = 99,
  minQuantity = 1,
  onQuantityChange,
  size = 'md',
  disabled = false,
  showInput = true
}: QuantityControlsProps) {
  const [inputValue, setInputValue] = useState(quantity.toString())
  const [isInputFocused, setIsInputFocused] = useState(false)

  // Update input value when quantity prop changes
  useEffect(() => {
    if (!isInputFocused) {
      setInputValue(quantity.toString())
    }
  }, [quantity, isInputFocused])

  const handleIncrement = () => {
    if (quantity < maxQuantity && !disabled) {
      onQuantityChange(quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (quantity > minQuantity && !disabled) {
      onQuantityChange(quantity - 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Only update quantity if it's a valid number within range
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= minQuantity && numValue <= maxQuantity) {
      onQuantityChange(numValue)
    }
  }

  const handleInputBlur = () => {
    setIsInputFocused(false)
    const numValue = parseInt(inputValue)
    
    if (isNaN(numValue) || numValue < minQuantity) {
      setInputValue(minQuantity.toString())
      onQuantityChange(minQuantity)
    } else if (numValue > maxQuantity) {
      setInputValue(maxQuantity.toString())
      onQuantityChange(maxQuantity)
    } else {
      setInputValue(numValue.toString())
      onQuantityChange(numValue)
    }
  }

  const handleInputFocus = () => {
    setIsInputFocused(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  // Size-based styling
  const sizeClasses = {
    sm: {
      button: 'w-6 h-6',
      input: 'w-8 h-6 text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      button: 'w-8 h-8',
      input: 'w-12 h-8 text-sm',
      icon: 'w-4 h-4'
    },
    lg: {
      button: 'w-10 h-10',
      input: 'w-16 h-10 text-base',
      icon: 'w-5 h-5'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className="flex items-center space-x-1">
      {/* Decrement Button */}
      <button
        onClick={handleDecrement}
        disabled={disabled || quantity <= minQuantity}
        className={`
          ${classes.button}
          flex items-center justify-center
          border border-gray-300 rounded-md
          hover:bg-gray-50 hover:border-gray-400
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          transition-colors duration-150
        `}
        aria-label="Decrease quantity"
        type="button"
      >
        <Minus className={classes.icon} />
      </button>

      {/* Quantity Input */}
      {showInput && (
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className={`
            ${classes.input}
            text-center border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100
            transition-colors duration-150
          `}
          aria-label="Quantity"
          min={minQuantity}
          max={maxQuantity}
        />
      )}

      {/* Display quantity without input */}
      {!showInput && (
        <span className={`
          ${classes.input}
          flex items-center justify-center
          text-center font-medium text-gray-900
        `}>
          {quantity}
        </span>
      )}

      {/* Increment Button */}
      <button
        onClick={handleIncrement}
        disabled={disabled || quantity >= maxQuantity}
        className={`
          ${classes.button}
          flex items-center justify-center
          border border-gray-300 rounded-md
          hover:bg-gray-50 hover:border-gray-400
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          transition-colors duration-150
        `}
        aria-label="Increase quantity"
        type="button"
      >
        <Plus className={classes.icon} />
      </button>

      {/* Accessibility info */}
      <div className="sr-only">
        Current quantity: {quantity}. 
        Minimum: {minQuantity}, Maximum: {maxQuantity}
      </div>
    </div>
  )
}