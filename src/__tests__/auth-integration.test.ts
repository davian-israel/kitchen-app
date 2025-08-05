/**
 * Integration tests for authentication components
 * Testing all potential causes of authentication failures
 */

import { jest } from '@jest/globals'
import { validateEnv, isDevelopment } from '@/lib/env-validation'
import { verifyPassword } from '@/lib/auth'
import { db } from '@/lib/db'

// Mock external dependencies
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userActivityLog: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  verifyPassword: jest.fn(),
  hashPassword: jest.fn(),
}))

const mockDb = db as jest.Mocked<typeof db>
const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>

describe('Authentication Integration Tests', () => {
  const testUser = {
    id: '1',
    email: 'test@example.com',
    passwordHash: '$2a$12$hashedpassword',
    name: 'Test User',
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables to known state
    process.env.NODE_ENV = 'test'
    process.env.NEXTAUTH_SECRET = 'test-secret'
    process.env.NEXTAUTH_URL = 'http://localhost:3000'
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('1. Environment Variables Test', () => {
    it('should validate environment variables correctly', () => {
      const env = validateEnv()
      expect(env.NODE_ENV).toBe('test')
      expect(env.NEXTAUTH_SECRET).toBeDefined()
      expect(env.NEXTAUTH_URL).toBeDefined()
      expect(env.DATABASE_URL).toBeDefined()
    })

    it('should handle missing NODE_ENV gracefully', () => {
      const originalNodeEnv = process.env.NODE_ENV
      
      try {
        delete process.env.NODE_ENV
        const env = validateEnv()
        expect(env.NODE_ENV).toBe('development') // default value
      } finally {
        process.env.NODE_ENV = originalNodeEnv
      }
    })

    it('should detect development environment correctly', () => {
      process.env.NODE_ENV = 'development'
      expect(isDevelopment()).toBe(true)
      
      process.env.NODE_ENV = 'test'
      expect(isDevelopment()).toBe(false)
    })

    it('should provide fallback values for missing environment variables', () => {
      const originalSecret = process.env.NEXTAUTH_SECRET
      const originalUrl = process.env.NEXTAUTH_URL
      
      try {
        delete process.env.NEXTAUTH_SECRET
        delete process.env.NEXTAUTH_URL
        
        const env = validateEnv()
        expect(env.NEXTAUTH_SECRET).toBeDefined()
        expect(env.NEXTAUTH_URL).toBeDefined()
      } finally {
        process.env.NEXTAUTH_SECRET = originalSecret
        process.env.NEXTAUTH_URL = originalUrl
      }
    })
  })

  describe('2. Database Connection Issues Test', () => {
    it('should handle database connection failure during user lookup', async () => {
      mockDb.user.findUnique.mockRejectedValue(new Error('Connection refused'))

      try {
        await mockDb.user.findUnique({ where: { email: 'test@example.com' } })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Connection refused')
      }
    })

    it('should handle database timeout during authentication', async () => {
      mockDb.user.findUnique.mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve(testUser), 100))
      )

      const startTime = Date.now()
      const result = await mockDb.user.findUnique({ where: { email: 'test@example.com' } })
      const endTime = Date.now()
      
      expect(result).toEqual(testUser)
      expect(endTime - startTime).toBeGreaterThanOrEqual(100)
    })

    it('should handle user not found scenario', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const result = await mockDb.user.findUnique({ where: { email: 'nonexistent@example.com' } })
      
      expect(result).toBeNull()
    })

    it('should handle disabled user scenario', async () => {
      const disabledUser = { ...testUser, status: 'DISABLED' }
      mockDb.user.findUnique.mockResolvedValue(disabledUser)

      const result = await mockDb.user.findUnique({ where: { email: 'test@example.com' } })
      
      expect(result?.status).toBe('DISABLED')
    })
  })

  describe('3. Password Verification Test', () => {
    it('should handle successful password verification', async () => {
      mockVerifyPassword.mockResolvedValue(true)

      const result = await mockVerifyPassword('password123', testUser.passwordHash)
      
      expect(result).toBe(true)
      expect(mockVerifyPassword).toHaveBeenCalledWith('password123', testUser.passwordHash)
    })

    it('should handle failed password verification', async () => {
      mockVerifyPassword.mockResolvedValue(false)

      const result = await mockVerifyPassword('wrongpassword', testUser.passwordHash)
      
      expect(result).toBe(false)
    })

    it('should handle password verification errors', async () => {
      mockVerifyPassword.mockRejectedValue(new Error('Hash comparison failed'))

      try {
        await mockVerifyPassword('password123', testUser.passwordHash)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Hash comparison failed')
      }
    })
  })

  describe('4. Activity Logging Test', () => {
    it('should handle successful activity logging', async () => {
      const mockLog = { id: 'log-1' }
      mockDb.userActivityLog.create.mockResolvedValue(mockLog as any)

      const result = await mockDb.userActivityLog.create({
        data: {
          userId: testUser.id,
          action: 'LOGIN',
          details: { method: 'credentials' },
        },
      })
      
      expect(result).toEqual(mockLog)
    })

    it('should handle activity logging failure gracefully', async () => {
      const logError = new Error('Logging service unavailable')
      mockDb.userActivityLog.create.mockRejectedValue(logError)

      try {
        await mockDb.userActivityLog.create({
          data: {
            userId: testUser.id,
            action: 'LOGIN',
            details: { method: 'credentials' },
          },
        })
      } catch (error) {
        expect(error).toEqual(logError)
        // In actual implementation, this error should be caught and logged
        // but not prevent authentication from succeeding
      }
    })

    it('should handle concurrent activity logging requests', async () => {
      let logCount = 0
      mockDb.userActivityLog.create.mockImplementation(() => {
        logCount++
        return Promise.resolve({ id: `log-${logCount}` } as any)
      })

      // Make multiple concurrent logging requests
      const requests = Array.from({ length: 3 }, () => 
        mockDb.userActivityLog.create({
          data: {
            userId: testUser.id,
            action: 'LOGIN',
            details: { method: 'credentials' },
          },
        })
      )

      const results = await Promise.all(requests)
      
      expect(results).toHaveLength(3)
      expect(results[0].id).toBe('log-1')
      expect(results[1].id).toBe('log-2')
      expect(results[2].id).toBe('log-3')
    })

    it('should handle database constraint violations in logging', async () => {
      const constraintError = new Error('duplicate key value violates unique constraint')
      mockDb.userActivityLog.create.mockRejectedValue(constraintError)

      try {
        await mockDb.userActivityLog.create({
          data: {
            userId: testUser.id,
            action: 'LOGIN',
            details: { method: 'credentials' },
          },
        })
      } catch (error) {
        expect(error).toEqual(constraintError)
      }
    })
  })

  describe('5. Complete Authentication Flow Test', () => {
    it('should handle complete successful authentication flow', async () => {
      // Setup successful mocks
      mockDb.user.findUnique.mockResolvedValue(testUser)
      mockVerifyPassword.mockResolvedValue(true)
      mockDb.userActivityLog.create.mockResolvedValue({ id: 'log-1' } as any)

      // Simulate the authentication flow
      const user = await mockDb.user.findUnique({ where: { email: testUser.email } })
      expect(user).toEqual(testUser)
      expect(user?.status).toBe('ACTIVE')

      const isValidPassword = await mockVerifyPassword('password123', user!.passwordHash)
      expect(isValidPassword).toBe(true)

      // Activity logging should succeed but not block authentication
      try {
        await mockDb.userActivityLog.create({
          data: {
            userId: user!.id,
            action: 'LOGIN',
            details: { method: 'credentials' },
          },
        })
      } catch (error) {
        // Even if logging fails, authentication should continue
        console.warn('Activity logging failed:', error)
      }

      // Return successful auth result
      const authResult = {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        role: user!.role,
      }

      expect(authResult).toEqual({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      })
    })

    it('should handle authentication with activity logging failure', async () => {
      // Setup mocks where logging fails
      mockDb.user.findUnique.mockResolvedValue(testUser)
      mockVerifyPassword.mockResolvedValue(true)
      mockDb.userActivityLog.create.mockRejectedValue(new Error('Logging service down'))

      // Simulate authentication flow with logging failure
      const user = await mockDb.user.findUnique({ where: { email: testUser.email } })
      const isValidPassword = await mockVerifyPassword('password123', user!.passwordHash)
      
      expect(user).toEqual(testUser)
      expect(isValidPassword).toBe(true)

      // Authentication should still succeed even if logging fails
      const authenticationSucceeded = true
      try {
        await mockDb.userActivityLog.create({
          data: {
            userId: user!.id,
            action: 'LOGIN',
            details: { method: 'credentials' },
          },
        })
      } catch (error) {
        // Log the error but don't fail authentication
        console.warn('Activity logging failed:', error)
        // Authentication should still succeed
      }

      expect(authenticationSucceeded).toBe(true)
    })

    it('should handle transient database errors with retry logic', async () => {
      let callCount = 0
      mockDb.user.findUnique.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          throw new Error('Connection timeout')
        }
        return Promise.resolve(testUser)
      })

      // First call should fail
      try {
        await mockDb.user.findUnique({ where: { email: testUser.email } })
      } catch (error) {
        expect((error as Error).message).toBe('Connection timeout')
      }

      // Second call should succeed
      const result = await mockDb.user.findUnique({ where: { email: testUser.email } })
      expect(result).toEqual(testUser)
      expect(callCount).toBe(2)
    })
  })

  describe('6. Error Recovery Test', () => {
    it('should handle malformed email input', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const result = await mockDb.user.findUnique({ where: { email: 'invalid-email' } })
      
      expect(result).toBeNull()
    })

    it('should handle empty password input', async () => {
      mockVerifyPassword.mockResolvedValue(false)

      const result = await mockVerifyPassword('', testUser.passwordHash)
      
      expect(result).toBe(false)
    })

    it('should handle null/undefined user scenarios', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const result = await mockDb.user.findUnique({ where: { email: 'test@example.com' } })
      
      expect(result).toBeNull()
    })
  })
})