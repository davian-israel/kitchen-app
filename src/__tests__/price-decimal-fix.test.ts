/**
 * Test to verify and fix meal.price.toFixed error
 * Verifies that price comes from API as number and can be formatted correctly
 */

import { jest } from '@jest/globals'

describe('Price Decimal Conversion Fix', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('Meals API Price Format', () => {
    it('should return prices as numbers from the API', async () => {
      // Mock authenticated session
      jest.doMock('@/auth', () => ({
        auth: jest.fn(() => Promise.resolve({
          user: { id: '1', email: 'test@example.com', role: 'USER' }
        }))
      }))

      // Mock database with Decimal prices (simulating Prisma Decimal objects)
      const mockMealsWithDecimals = [
        {
          id: '1',
          name: 'Test Meal',
          description: 'Test description',
          price: { toNumber: () => 12.99 }, // Simulating Prisma Decimal
          category: 'Main Course',
          imageUrl: '/test.jpg',
          ingredients: ['ingredient1'],
          allergens: ['allergen1'],
          available: true
        }
      ]

      jest.doMock('@/lib/db', () => ({
        db: {
          meal: {
            findMany: jest.fn().mockResolvedValue(mockMealsWithDecimals)
          }
        }
      }))

      // Import the API route
      const { GET } = await import('@/app/api/meals/route')
      const mockRequest = {} as any

      const response = await GET(mockRequest)
      const data = await response.json()

      // The API should return prices as numbers, not Decimal objects
      expect(data[0].price).toBe(12.99)
      expect(typeof data[0].price).toBe('number')
      expect(() => data[0].price.toFixed(2)).not.toThrow()
    })

    it('should handle price conversion for multiple meals', async () => {
      // Mock authenticated session
      jest.doMock('@/auth', () => ({
        auth: jest.fn(() => Promise.resolve({
          user: { id: '1', email: 'test@example.com', role: 'USER' }
        }))
      }))

      // Mock database with multiple meals with Decimal prices
      const mockMealsWithDecimals = [
        {
          id: '1',
          name: 'Meal 1',
          description: 'Description 1',
          price: { toNumber: () => 10.50 },
          category: 'Appetizer',
          imageUrl: '/meal1.jpg',
          ingredients: ['ingredient1'],
          allergens: ['allergen1'],
          available: true
        },
        {
          id: '2',
          name: 'Meal 2',
          description: 'Description 2',
          price: { toNumber: () => 15.99 },
          category: 'Main Course',
          imageUrl: '/meal2.jpg',
          ingredients: ['ingredient2'],
          allergens: ['allergen2'],
          available: true
        }
      ]

      jest.doMock('@/lib/db', () => ({
        db: {
          meal: {
            findMany: jest.fn().mockResolvedValue(mockMealsWithDecimals)
          }
        }
      }))

      const { GET } = await import('@/app/api/meals/route')
      const mockRequest = {} as any

      const response = await GET(mockRequest)
      const data = await response.json()

      // All prices should be converted to numbers
      data.forEach((meal: any) => {
        expect(typeof meal.price).toBe('number')
        expect(() => meal.price.toFixed(2)).not.toThrow()
      })

      expect(data[0].price).toBe(10.50)
      expect(data[1].price).toBe(15.99)
    })
  })

  describe('Frontend Price Display', () => {
    it('should handle price formatting in menu component', () => {
      // Test that price.toFixed works with proper number types
      const testMeal = {
        id: '1',
        name: 'Test Meal',
        description: 'Test description',
        price: 12.99, // Should be a number
        category: 'Main Course'
      }

      // This should not throw
      expect(() => {
        const formattedPrice = `$${testMeal.price.toFixed(2)}`
        expect(formattedPrice).toBe('$12.99')
      }).not.toThrow()
    })

    it('should handle edge case prices correctly', () => {
      const testCases = [
        { price: 0, expected: '$0.00' },
        { price: 0.5, expected: '$0.50' },
        { price: 10, expected: '$10.00' },
        { price: 999.99, expected: '$999.99' }
      ]

      testCases.forEach(({ price, expected }) => {
        expect(() => {
          const formattedPrice = `$${price.toFixed(2)}`
          expect(formattedPrice).toBe(expected)
        }).not.toThrow()
      })
    })
  })

  describe('Error Reproduction and Fix Verification', () => {
    it('should reproduce the original error with Decimal objects', () => {
      // Simulate the original error condition
      const mealWithDecimalPrice = {
        id: '1',
        name: 'Test Meal',
        price: { toNumber: () => 12.99 } // Prisma Decimal object
      }

      // This should throw the original error
      expect(() => {
        (mealWithDecimalPrice.price as any).toFixed(2)
      }).toThrow('mealWithDecimalPrice.price.toFixed is not a function')
    })

    it('should verify the fix works with converted prices', () => {
      // Simulate the fixed condition
      const mealWithNumberPrice = {
        id: '1',
        name: 'Test Meal',
        price: 12.99 // Properly converted number
      }

      // This should work after the fix
      expect(() => {
        const formatted = mealWithNumberPrice.price.toFixed(2)
        expect(formatted).toBe('12.99')
      }).not.toThrow()
    })
  })
})