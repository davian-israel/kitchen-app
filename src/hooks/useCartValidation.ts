'use client'

import { useState, useCallback } from 'react'
import { CartItem } from '@/contexts/CartContext'

export interface ValidationError {
  itemId: string
  type: 'out_of_stock' | 'price_changed' | 'max_quantity_exceeded' | 'unavailable'
  message: string
  currentValue?: number
  expectedValue?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
  updatedItems: CartItem[]
}

export function useCartValidation() {
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidation, setLastValidation] = useState<Date | null>(null)

  const validateCartItems = useCallback(async (items: CartItem[]): Promise<ValidationResult> => {
    setIsValidating(true)
    
    try {
      // Simulate API call to validate cart items
      const response = await fetch('/api/cart/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        throw new Error('Failed to validate cart')
      }

      const validationResult: ValidationResult = await response.json()
      setLastValidation(new Date())
      return validationResult
      
    } catch (error) {
      // Fallback to client-side validation
      console.warn('Server validation failed, using client-side validation')
      return performClientSideValidation(items)
    } finally {
      setIsValidating(false)
    }
  }, [])

  const performClientSideValidation = useCallback((items: CartItem[]): ValidationResult => {
    const errors: ValidationError[] = []
    const warnings: string[] = []
    const updatedItems: CartItem[] = []

    items.forEach(item => {
      // Mock validation rules
      const updatedItem = { ...item }
      
      // Check for out of stock (simulate some items being unavailable)
      if (item.name.toLowerCase().includes('special')) {
        errors.push({
          itemId: item.id,
          type: 'out_of_stock',
          message: `${item.name} is currently out of stock`
        })
      }
      
      // Check for price changes (simulate price updates)
      if (item.name.toLowerCase().includes('premium')) {
        const newPrice = item.price * 1.1 // 10% price increase
        if (Math.abs(newPrice - item.price) > 0.01) {
          warnings.push(`Price for ${item.name} has changed from $${item.price.toFixed(2)} to $${newPrice.toFixed(2)}`)
          updatedItem.price = newPrice
        }
      }
      
      // Check quantity limits
      const maxQuantity = 10 // Mock max quantity per item
      if (item.quantity > maxQuantity) {
        errors.push({
          itemId: item.id,
          type: 'max_quantity_exceeded',
          message: `Maximum ${maxQuantity} items allowed for ${item.name}`,
          currentValue: item.quantity,
          expectedValue: maxQuantity
        })
        updatedItem.quantity = maxQuantity
      }
      
      updatedItems.push(updatedItem)
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      updatedItems
    }
  }, [])

  const validateSingleItem = useCallback(async (item: CartItem): Promise<{
    isValid: boolean
    availability: 'in_stock' | 'low_stock' | 'out_of_stock'
    maxQuantity: number
    currentPrice: number
  }> => {
    try {
      const response = await fetch(`/api/cart/validate-item/${item.id}`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn('Item validation failed, using defaults')
    }

    // Fallback validation
    return {
      isValid: true,
      availability: item.name.toLowerCase().includes('special') ? 'out_of_stock' : 'in_stock',
      maxQuantity: 10,
      currentPrice: item.price
    }
  }, [])

  const checkInventoryAvailability = useCallback(async (itemIds: string[]): Promise<Record<string, {
    available: boolean
    quantity: number
    reservedUntil?: Date
  }>> => {
    try {
      const response = await fetch('/api/inventory/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds }),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn('Inventory check failed')
    }

    // Fallback - assume all items are available
    const availability: Record<string, { available: boolean; quantity: number }> = {}
    itemIds.forEach(id => {
      availability[id] = {
        available: true,
        quantity: 50 // Mock available quantity
      }
    })
    
    return availability
  }, [])

  const validatePricing = useCallback(async (items: CartItem[]): Promise<Record<string, {
    currentPrice: number
    hasChanged: boolean
    originalPrice: number
  }>> => {
    try {
      const response = await fetch('/api/cart/validate-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          items: items.map(item => ({ id: item.id, currentPrice: item.price }))
        }),
      })

      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn('Price validation failed')
    }

    // Fallback - assume no price changes
    const pricing: Record<string, { currentPrice: number; hasChanged: boolean; originalPrice: number }> = {}
    items.forEach(item => {
      pricing[item.id] = {
        currentPrice: item.price,
        hasChanged: false,
        originalPrice: item.price
      }
    })
    
    return pricing
  }, [])

  return {
    validateCartItems,
    validateSingleItem,
    checkInventoryAvailability,
    validatePricing,
    isValidating,
    lastValidation
  }
}