import {
  sanitizeString,
  sanitizeHtml,
  sanitizeEmail,
  sanitizeNumericInput,
  escapeHtml,
  checkPasswordStrength,
  validateRequest,
  userRegistrationSchema,
  userLoginSchema,
  createOrderSchema,
  mealSchema,
} from '../validation'

describe('Validation Utilities', () => {
  describe('sanitizeString', () => {
    it('should remove control characters', () => {
      const input = 'Hello\x00\x1F\x7FWorld'
      const result = sanitizeString(input)
      expect(result).toBe('HelloWorld')
    })

    it('should remove potential SQL injection patterns', () => {
      const input = "Hello'; DROP TABLE users; --"
      const result = sanitizeString(input)
      expect(result).toBe('Hello DROP TABLE users --')
    })

    it('should remove HTML tags', () => {
      const input = 'Hello <script>alert("xss")</script> World'
      const result = sanitizeString(input)
      expect(result).toBe('Hello alertxss World')
    })

    it('should remove command injection patterns', () => {
      const input = 'Hello; rm -rf /'
      const result = sanitizeString(input)
      expect(result).toBe('Hello rm -rf /')
    })

    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const result = sanitizeString(input)
      expect(result).toBe('Hello World')
    })

    it('should limit string length', () => {
      const input = 'a'.repeat(20000)
      const result = sanitizeString(input)
      expect(result.length).toBe(10000)
    })

    it('should handle non-string input', () => {
      expect(sanitizeString(null as any)).toBe('')
      expect(sanitizeString(undefined as any)).toBe('')
      expect(sanitizeString(123 as any)).toBe('')
    })
  })

  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      const result = sanitizeEmail('TEST@EXAMPLE.COM')
      expect(result).toBe('test@example.com')
    })

    it('should trim whitespace', () => {
      const result = sanitizeEmail('  test@example.com  ')
      expect(result).toBe('test@example.com')
    })

    it('should limit length', () => {
      const longEmail = 'a'.repeat(300) + '@example.com'
      const result = sanitizeEmail(longEmail)
      expect(result.length).toBe(255)
    })

    it('should handle non-string input', () => {
      expect(sanitizeEmail(null as any)).toBe('')
      expect(sanitizeEmail(undefined as any)).toBe('')
    })
  })

  describe('sanitizeNumericInput', () => {
    it('should return valid numbers', () => {
      expect(sanitizeNumericInput(42)).toBe(42)
      expect(sanitizeNumericInput(3.14)).toBe(3.14)
      expect(sanitizeNumericInput(-10)).toBe(-10)
    })

    it('should parse valid string numbers', () => {
      expect(sanitizeNumericInput('42')).toBe(42)
      expect(sanitizeNumericInput('3.14')).toBe(3.14)
      expect(sanitizeNumericInput('-10')).toBe(-10)
    })

    it('should return null for invalid input', () => {
      expect(sanitizeNumericInput('not a number')).toBeNull()
      expect(sanitizeNumericInput(NaN)).toBeNull()
      expect(sanitizeNumericInput(Infinity)).toBeNull()
      expect(sanitizeNumericInput(null)).toBeNull()
      expect(sanitizeNumericInput(undefined)).toBeNull()
    })
  })

  describe('escapeHtml', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>'
      const result = escapeHtml(input)
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })

    it('should escape all dangerous characters', () => {
      const input = '&<>"\'/'
      const result = escapeHtml(input)
      expect(result).toBe('&amp;&lt;&gt;&quot;&#x27;&#x2F;')
    })

    it('should handle non-string input', () => {
      expect(escapeHtml(null as any)).toBe('')
      expect(escapeHtml(undefined as any)).toBe('')
    })
  })

  describe('checkPasswordStrength', () => {
    it('should return strong password score', () => {
      const result = checkPasswordStrength('StrongP@ssw0rd!')
      expect(result.score).toBe(5)
      expect(result.isStrong).toBe(true)
      expect(result.feedback).toHaveLength(0)
    })

    it('should identify weak passwords', () => {
      const result = checkPasswordStrength('weak')
      expect(result.score).toBeLessThan(4)
      expect(result.isStrong).toBe(false)
      expect(result.feedback.length).toBeGreaterThan(0)
    })

    it('should provide specific feedback', () => {
      const result = checkPasswordStrength('password')
      expect(result.feedback).toContain('Add uppercase letters')
      expect(result.feedback).toContain('Add numbers')
      expect(result.feedback).toContain('Add special characters (@$!%*?&)')
    })
  })

  describe('validateRequest', () => {
    it('should validate correct data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123'
      }
      const result = validateRequest(userLoginSchema, data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('test@example.com')
      }
    })

    it('should return errors for invalid data', () => {
      const data = {
        email: 'invalid-email',
        password: ''
      }
      const result = validateRequest(userLoginSchema, data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.issues.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Schema Validation', () => {
    describe('userRegistrationSchema', () => {
      it('should validate correct registration data', () => {
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'StrongP@ssw0rd!',
          confirmPassword: 'StrongP@ssw0rd!'
        }
        expect(() => userRegistrationSchema.parse(data)).not.toThrow()
      })

      it('should reject mismatched passwords', () => {
        const data = {
          email: 'john@example.com',
          password: 'password1',
          confirmPassword: 'password2'
        }
        expect(() => userRegistrationSchema.parse(data)).toThrow()
      })

      it('should reject weak passwords', () => {
        const data = {
          email: 'john@example.com',
          password: 'weak',
          confirmPassword: 'weak'
        }
        expect(() => userRegistrationSchema.parse(data)).toThrow()
      })
    })

    describe('createOrderSchema', () => {
      it('should validate correct order data', () => {
        const data = {
          items: [{
            id: 'cm1234567890abcdef',
            name: 'Test Meal',
            price: 15.99,
            quantity: 2,
            category: 'Main Course'
          }],
          customerInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            address: {
              street: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              zipCode: '12345'
            }
          },
          totalAmount: 31.98,
          paymentMethod: 'stripe' as const
        }
        expect(() => createOrderSchema.parse(data)).not.toThrow()
      })

      it('should reject orders with too many items', () => {
        const items = Array(25).fill({
          id: 'meal-123',
          name: 'Test Meal',
          price: 15.99,
          quantity: 1,
          category: 'Main Course'
        })
        
        const data = {
          items,
          customerInfo: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            address: {
              street: '123 Main St',
              city: 'Anytown',
              state: 'CA',
              zipCode: '12345'
            }
          },
          totalAmount: 399.75,
          paymentMethod: 'stripe' as const
        }
        expect(() => createOrderSchema.parse(data)).toThrow()
      })
    })

    describe('mealSchema', () => {
      it('should validate correct meal data', () => {
        const data = {
          name: 'Delicious Meal',
          description: 'A very tasty meal',
          price: 15.99,
          category: 'Main Course',
          ingredients: ['chicken', 'rice', 'vegetables'],
          allergens: ['gluten'],
          available: true
        }
        expect(() => mealSchema.parse(data)).not.toThrow()
      })

      it('should reject meals with excessive price', () => {
        const data = {
          name: 'Expensive Meal',
          description: 'Too expensive',
          price: 1500,
          category: 'Main Course',
          ingredients: ['gold'],
          allergens: [],
          available: true
        }
        expect(() => mealSchema.parse(data)).toThrow()
      })
    })
  })
})