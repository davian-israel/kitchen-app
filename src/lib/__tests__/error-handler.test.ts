import {
  SecurityError,
  ValidationError,
  DatabaseError,
  sanitizeErrorMessage,
  createErrorResponse,
  validateAndSanitizeInput,
  detectSuspiciousActivity,
  checkActionRateLimit,
  createSuccessResponse,
  createStandardErrorResponse,
} from '../error-handler'
import { NextRequest } from 'next/server'
import { z } from 'zod'

// Mock NextRequest
const createMockRequest = (
  url: string = 'http://localhost:3000/api/test',
  headers: Record<string, string> = {},
  method: string = 'GET'
): NextRequest => {
  const request = new NextRequest(url, { method })
  
  // Mock headers
  Object.entries(headers).forEach(([key, value]) => {
    jest.spyOn(request.headers, 'get').mockImplementation((name) => {
      if (name.toLowerCase() === key.toLowerCase()) {
        return value
      }
      return null
    })
  })
  
  return request
}

describe('Error Handler', () => {
  describe('Custom Error Classes', () => {
    describe('SecurityError', () => {
      it('should create security error with default values', () => {
        const error = new SecurityError('Access denied')
        expect(error.message).toBe('Access denied')
        expect(error.statusCode).toBe(403)
        expect(error.code).toBe('SECURITY_ERROR')
        expect(error.name).toBe('SecurityError')
      })

      it('should create security error with custom values', () => {
        const error = new SecurityError('Unauthorized', 401, 'AUTH_ERROR')
        expect(error.message).toBe('Unauthorized')
        expect(error.statusCode).toBe(401)
        expect(error.code).toBe('AUTH_ERROR')
      })
    })

    describe('ValidationError', () => {
      it('should create validation error', () => {
        const errors = { email: ['Invalid email'], password: ['Too short'] }
        const error = new ValidationError('Validation failed', errors)
        expect(error.message).toBe('Validation failed')
        expect(error.errors).toEqual(errors)
        expect(error.statusCode).toBe(400)
        expect(error.name).toBe('ValidationError')
      })
    })

    describe('DatabaseError', () => {
      it('should create database error', () => {
        const originalError = new Error('Connection failed')
        const error = new DatabaseError('Database error', originalError)
        expect(error.message).toBe('Database error')
        expect(error.originalError).toBe(originalError)
        expect(error.statusCode).toBe(500)
        expect(error.name).toBe('DatabaseError')
      })
    })
  })

  describe('sanitizeErrorMessage', () => {
    it('should remove sensitive patterns', () => {
      const error = new Error('Password validation failed for user@example.com')
      const sanitized = sanitizeErrorMessage(error)
      expect(sanitized).toContain('[REDACTED]')
      expect(sanitized).not.toContain('Password')
    })

    it('should replace database errors with generic message', () => {
      const error = new Error('duplicate key value violates unique constraint')
      const sanitized = sanitizeErrorMessage(error)
      expect(sanitized).toBe('A database error occurred. Please try again later.')
    })

    it('should remove file paths in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      const error = new Error('Error at /home/user/app/src/file.js:123')
      const sanitized = sanitizeErrorMessage(error)
      expect(sanitized).toContain('[PATH_REDACTED]')
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('createErrorResponse', () => {
    it('should create response for SecurityError', () => {
      const error = new SecurityError('Access denied', 403, 'ACCESS_DENIED')
      const response = createErrorResponse(error)
      
      expect(response.status).toBe(403)
      // Note: We can't easily test the JSON body in this setup
    })

    it('should create response for ValidationError', () => {
      const errors = { email: ['Invalid email'] }
      const error = new ValidationError('Validation failed', errors)
      const response = createErrorResponse(error)
      
      expect(response.status).toBe(400)
    })

    it('should create response for generic error', () => {
      const error = new Error('Something went wrong')
      const response = createErrorResponse(error)
      
      expect(response.status).toBe(500)
    })

    it('should create response for ZodError', () => {
      const schema = z.object({ email: z.string().email() })
      try {
        schema.parse({ email: 'invalid' })
      } catch (error) {
        const response = createErrorResponse(error as Error)
        expect(response.status).toBe(400)
      }
    })
  })

  describe('validateAndSanitizeInput', () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email()
    })

    it('should validate and return data', () => {
      const data = { name: 'John', email: 'john@example.com' }
      const result = validateAndSanitizeInput(data, (d) => schema.parse(d))
      
      expect(result).toEqual(data)
    })

    it('should apply sanitizer function', () => {
      const data = { name: '  John  ', email: 'JOHN@EXAMPLE.COM' }
      const result = validateAndSanitizeInput(
        data,
        (d) => schema.parse(d),
        (d) => ({ ...d, name: d.name.trim(), email: d.email.toLowerCase() })
      )
      
      expect(result.name).toBe('John')
      expect(result.email).toBe('john@example.com')
    })

    it('should throw ValidationError for invalid data', () => {
      const data = { name: '', email: 'invalid' }
      
      expect(() => {
        validateAndSanitizeInput(data, (d) => schema.parse(d))
      }).toThrow(ValidationError)
    })
  })

  describe('detectSuspiciousActivity', () => {
    it('should detect SQL injection patterns', () => {
      const request = createMockRequest('http://localhost:3000/api/test?q=SELECT * FROM users')
      const result = detectSuspiciousActivity(request, { action: 'search' })
      expect(result).toBe(true)
    })

    it('should detect XSS patterns', () => {
      const request = createMockRequest('http://localhost:3000/api/test?q=<script>alert(1)</script>')
      const result = detectSuspiciousActivity(request, { action: 'search' })
      expect(result).toBe(true)
    })

    it('should detect path traversal patterns', () => {
      const request = createMockRequest('http://localhost:3000/api/test?file=../../../etc/passwd')
      const result = detectSuspiciousActivity(request, { action: 'file' })
      expect(result).toBe(true)
    })

    it('should detect command injection patterns', () => {
      const request = createMockRequest('http://localhost:3000/api/test?cmd=ls; rm -rf /')
      const result = detectSuspiciousActivity(request, { action: 'command' })
      expect(result).toBe(true)
    })

    it('should detect unusual user agents', () => {
      const request = createMockRequest('http://localhost:3000/api/test', {
        'user-agent': 'bot'
      })
      const result = detectSuspiciousActivity(request, { action: 'request' })
      expect(result).toBe(true)
    })

    it('should detect rapid failures', () => {
      const request = createMockRequest()
      const result = detectSuspiciousActivity(request, { 
        action: 'login', 
        failureCount: 10 
      })
      expect(result).toBe(true)
    })

    it('should not flag normal requests', () => {
      const request = createMockRequest('http://localhost:3000/api/test', {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      })
      const result = detectSuspiciousActivity(request, { action: 'normal' })
      expect(result).toBe(false)
    })
  })

  describe('checkActionRateLimit', () => {
    it('should allow actions within limit', () => {
      const result1 = checkActionRateLimit('user1', 'test_action', 5, 60000)
      expect(result1).toBe(true)
      
      const result2 = checkActionRateLimit('user1', 'test_action', 5, 60000)
      expect(result2).toBe(true)
    })

    it('should block actions exceeding limit', () => {
      const userId = 'user2'
      const action = 'limited_action'
      
      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkActionRateLimit(userId, action, 3, 60000)
      }
      
      // Next call should be blocked
      const result = checkActionRateLimit(userId, action, 3, 60000)
      expect(result).toBe(false)
    })

    it('should handle different users separately', () => {
      const action = 'separate_action'
      
      expect(checkActionRateLimit('user3', action, 1, 60000)).toBe(true)
      expect(checkActionRateLimit('user4', action, 1, 60000)).toBe(true)
      expect(checkActionRateLimit('user3', action, 1, 60000)).toBe(false)
      expect(checkActionRateLimit('user4', action, 1, 60000)).toBe(false)
    })
  })

  describe('Response Helpers', () => {
    describe('createSuccessResponse', () => {
      it('should create success response with data', () => {
        const data = { id: 1, name: 'Test' }
        const response = createSuccessResponse(data, 'Success message')
        
        expect(response.status).toBe(200)
      })

      it('should create success response with custom status', () => {
        const data = { id: 1 }
        const response = createSuccessResponse(data, 'Created', 201)
        
        expect(response.status).toBe(201)
      })
    })

    describe('createStandardErrorResponse', () => {
      it('should create error response', () => {
        const response = createStandardErrorResponse('Error message', 'ERROR_CODE', 400)
        
        expect(response.status).toBe(400)
      })

      it('should create error response with details', () => {
        const details = { field: 'email', issue: 'invalid' }
        const response = createStandardErrorResponse(
          'Validation error', 
          'VALIDATION_ERROR', 
          400, 
          details
        )
        
        expect(response.status).toBe(400)
      })
    })
  })
})