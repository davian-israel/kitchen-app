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
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
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
import { detectSuspiciousActivity } from '@/lib/error-handler'

const mockDb = db as jest.Mocked<typeof db>
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>
const mockAuditLogger = auditLogger as jest.Mocked<typeof auditLogger>
const mockDetectSuspiciousActivity = detectSuspiciousActivity as jest.MockedFunction<typeof detectSuspiciousActivity>

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: any): NextRequest => {
    return new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    })
  }

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const requestBody = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'StrongP@ssw0rd!',
        confirmPassword: 'StrongP@ssw0rd!',
      }

      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'CUSTOMER',
        createdAt: new Date(),
      }

      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue(mockUser as any)

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(201)
      
      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.user.email).toBe('john@example.com')
      expect(responseData.user.name).toBe('John Doe')

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      })

      expect(mockHashPassword).toHaveBeenCalledWith('StrongP@ssw0rd!')

      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: {
          email: 'john@example.com',
          name: 'John Doe',
          passwordHash: 'hashed-password',
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

      expect(mockAuditLogger.logAuth).toHaveBeenCalledWith(
        'auth.register.success',
        'user-123',
        expect.any(Object),
        true,
        { email: 'john@example.com', method: 'credentials' }
      )
    })

    it('should reject registration with existing email', async () => {
      const requestBody = {
        email: 'existing@example.com',
        password: 'StrongP@ssw0rd!',
        confirmPassword: 'StrongP@ssw0rd!',
      }

      const existingUser = {
        id: 'existing-user',
        email: 'existing@example.com',
      }

      mockDb.user.findUnique.mockResolvedValue(existingUser as any)

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('EMAIL_EXISTS')

      expect(mockDb.user.create).not.toHaveBeenCalled()

      expect(mockAuditLogger.logAuth).toHaveBeenCalledWith(
        'auth.register.failed',
        undefined,
        expect.any(Object),
        false,
        { email: 'existing@example.com', reason: 'email_already_exists' },
        'User with this email already exists'
      )
    })

    it('should reject registration with mismatched passwords', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd!',
        confirmPassword: 'DifferentP@ssw0rd!',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('VALIDATION_ERROR')

      expect(mockDb.user.findUnique).not.toHaveBeenCalled()
      expect(mockDb.user.create).not.toHaveBeenCalled()
    })

    it('should reject registration with weak password', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('VALIDATION_ERROR')

      expect(mockDb.user.create).not.toHaveBeenCalled()
    })

    it('should reject registration with invalid email', async () => {
      const requestBody = {
        email: 'invalid-email',
        password: 'StrongP@ssw0rd!',
        confirmPassword: 'StrongP@ssw0rd!',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('VALIDATION_ERROR')

      expect(mockDb.user.create).not.toHaveBeenCalled()
    })

    it('should block suspicious registration attempts', async () => {
      mockDetectSuspiciousActivity.mockReturnValue(true)

      const requestBody = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd!',
        confirmPassword: 'StrongP@ssw0rd!',
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(403)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('SECURITY_ERROR')

      expect(mockAuditLogger.logSecurity).toHaveBeenCalledWith(
        'security.activity.suspicious',
        undefined,
        expect.any(Object),
        { action: 'register', reason: 'suspicious_patterns_detected' }
      )

      expect(mockDb.user.create).not.toHaveBeenCalled()
    })

    it('should sanitize input data', async () => {
      const requestBody = {
        name: '  <script>alert("xss")</script>John Doe  ',
        email: '  JOHN@EXAMPLE.COM  ',
        password: 'StrongP@ssw0rd!',
        confirmPassword: 'StrongP@ssw0rd!',
      }

      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'CUSTOMER',
        createdAt: new Date(),
      }

      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue(mockUser as any)

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(201)

      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: {
          email: 'john@example.com',
          name: expect.stringMatching(/^[^<>]*$/), // Should not contain HTML tags
          passwordHash: 'hashed-password',
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

    it('should handle database errors gracefully', async () => {
      const requestBody = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd!',
        confirmPassword: 'StrongP@ssw0rd!',
      }

      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest(requestBody)
      const response = await POST(request)

      expect(response.status).toBe(500)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('INTERNAL_ERROR')
    })
  })
})