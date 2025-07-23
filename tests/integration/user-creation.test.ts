import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/register/route'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('$2a$12$hashedPasswordExample123'),
}))

jest.mock('@/lib/audit-logger', () => ({
  auditLogger: {
    logAuth: jest.fn(),
    logSecurity: jest.fn(),
  },
  AuditAction: {
    REGISTER_SUCCESS: 'auth.register.success',
    REGISTER_FAILED: 'auth.register.failed',
    SUSPICIOUS_ACTIVITY: 'security.activity.suspicious',
  },
}))

jest.mock('@/lib/error-handler', () => ({
  ...jest.requireActual('@/lib/error-handler'),
  detectSuspiciousActivity: jest.fn().mockReturnValue(false),
}))

import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { auditLogger } from '@/lib/audit-logger'

const mockDb = db as jest.Mocked<typeof db>
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>
const mockAuditLogger = auditLogger as jest.Mocked<typeof auditLogger>

describe('User Creation Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Test Browser)',
        'x-forwarded-for': '192.168.1.100',
      },
    })
  }

  describe('Create New User: customer@example.com', () => {
    it('should successfully create a new user with username customer@example.com and password customer123', async () => {
      // Test data for the new user
      const newUserData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'customer123',
        confirmPassword: 'customer123',
      }

      // Mock that user doesn't exist yet
      mockDb.user.findUnique.mockResolvedValue(null)

      // Mock successful user creation
      const mockCreatedUser = {
        id: 'cm1test123456789abc',
        email: 'customer@example.com',
        name: 'Test Customer',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z'),
      }

      mockDb.user.create.mockResolvedValue(mockCreatedUser as any)

      // Create the request
      const request = createMockRequest(newUserData)

      // Execute the registration
      const response = await POST(request)

      // Verify response
      expect(response.status).toBe(201)
      
      const responseData = await response.json()
      expect(responseData).toEqual({
        success: true,
        message: 'User created successfully',
        user: {
          id: 'cm1test123456789abc',
          email: 'customer@example.com',
          name: 'Test Customer',
          role: 'CUSTOMER',
        }
      })

      // Verify database interactions
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'customer@example.com' },
      })

      expect(mockHashPassword).toHaveBeenCalledWith('customer123')

      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: {
          email: 'customer@example.com',
          name: 'Test Customer',
          passwordHash: '$2a$12$hashedPasswordExample123',
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      })

      // Verify audit logging
      expect(mockAuditLogger.logAuth).toHaveBeenCalledWith(
        'auth.register.success',
        'cm1test123456789abc',
        expect.any(Object),
        true,
        { email: 'customer@example.com', method: 'credentials' }
      )
    })

    it('should handle case where customer@example.com already exists', async () => {
      const newUserData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'customer123',
        confirmPassword: 'customer123',
      }

      // Mock that user already exists
      const existingUser = {
        id: 'existing-user-id',
        email: 'customer@example.com',
        name: 'Existing Customer',
        role: 'CUSTOMER',
      }

      mockDb.user.findUnique.mockResolvedValue(existingUser as any)

      const request = createMockRequest(newUserData)
      const response = await POST(request)

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('EMAIL_EXISTS')
      expect(responseData.message).toBe('User with this email already exists')

      // Verify user creation was not attempted
      expect(mockDb.user.create).not.toHaveBeenCalled()

      // Verify failure was logged
      expect(mockAuditLogger.logAuth).toHaveBeenCalledWith(
        'auth.register.failed',
        undefined,
        expect.any(Object),
        false,
        { email: 'customer@example.com', reason: 'email_already_exists' },
        'User with this email already exists'
      )
    })

    it('should validate password requirements for customer123', async () => {
      const newUserData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'customer123',
        confirmPassword: 'customer123',
      }

      // Mock that user doesn't exist
      mockDb.user.findUnique.mockResolvedValue(null)

      const request = createMockRequest(newUserData)
      const response = await POST(request)

      // The password 'customer123' should fail validation because it doesn't meet
      // the strong password requirements (missing uppercase, special characters)
      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('VALIDATION_ERROR')

      // Verify user creation was not attempted due to validation failure
      expect(mockDb.user.create).not.toHaveBeenCalled()
    })

    it('should successfully create user with stronger password', async () => {
      // Use a stronger password that meets requirements
      const newUserData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'Customer123!',
        confirmPassword: 'Customer123!',
      }

      mockDb.user.findUnique.mockResolvedValue(null)

      const mockCreatedUser = {
        id: 'cm1test123456789abc',
        email: 'customer@example.com',
        name: 'Test Customer',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-15T10:00:00Z'),
      }

      mockDb.user.create.mockResolvedValue(mockCreatedUser as any)

      const request = createMockRequest(newUserData)
      const response = await POST(request)

      expect(response.status).toBe(201)

      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.user.email).toBe('customer@example.com')

      // Verify password was hashed
      expect(mockHashPassword).toHaveBeenCalledWith('Customer123!')
    })

    it('should handle mismatched password confirmation', async () => {
      const newUserData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'Customer123!',
        confirmPassword: 'DifferentPassword123!',
      }

      const request = createMockRequest(newUserData)
      const response = await POST(request)

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('VALIDATION_ERROR')

      // Should contain password mismatch error
      expect(responseData.details.errors.confirmPassword).toContain("Passwords don't match")

      expect(mockDb.user.create).not.toHaveBeenCalled()
    })

    it('should sanitize input data during user creation', async () => {
      const newUserData = {
        name: '  <script>alert("xss")</script>Test Customer  ',
        email: '  CUSTOMER@EXAMPLE.COM  ',
        password: 'Customer123!',
        confirmPassword: 'Customer123!',
      }

      mockDb.user.findUnique.mockResolvedValue(null)

      const mockCreatedUser = {
        id: 'cm1test123456789abc',
        email: 'customer@example.com',
        name: 'Test Customer',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        createdAt: new Date(),
      }

      mockDb.user.create.mockResolvedValue(mockCreatedUser as any)

      const request = createMockRequest(newUserData)
      const response = await POST(request)

      expect(response.status).toBe(201)

      // Verify input was sanitized
      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: {
          email: 'customer@example.com', // Should be lowercase and trimmed
          name: expect.stringMatching(/^[^<>]*$/), // Should not contain HTML tags
          passwordHash: '$2a$12$hashedPasswordExample123',
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      })
    })
  })

  describe('User Creation Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      const newUserData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'Customer123!',
        confirmPassword: 'Customer123!',
      }

      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest(newUserData)
      const response = await POST(request)

      expect(response.status).toBe(500)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('INTERNAL_ERROR')
    })

    it('should handle password hashing failures', async () => {
      const newUserData = {
        name: 'Test Customer',
        email: 'customer@example.com',
        password: 'Customer123!',
        confirmPassword: 'Customer123!',
      }

      mockDb.user.findUnique.mockResolvedValue(null)
      mockHashPassword.mockRejectedValue(new Error('Hashing failed'))

      const request = createMockRequest(newUserData)
      const response = await POST(request)

      expect(response.status).toBe(500)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('INTERNAL_ERROR')
    })
  })
})