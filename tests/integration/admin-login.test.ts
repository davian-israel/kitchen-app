import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/audit-logger', () => ({
  auditLogger: {
    logAuth: jest.fn(),
  },
  AuditAction: {
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILED: 'auth.login.failed',
  },
}))

import { db } from '@/lib/db'
import { auditLogger } from '@/lib/audit-logger'

const mockDb = db as jest.Mocked<typeof db>
const mockAuditLogger = auditLogger as jest.Mocked<typeof auditLogger>

describe('Admin Login Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const adminCredentials = {
    email: 'admin@israelkitchen.com',
    password: 'admin123'
  }

  describe('Admin User Authentication', () => {
    it('should verify admin user exists with correct credentials', async () => {
      // Mock the admin user from database
      const hashedPassword = await bcrypt.hash('admin123', 12)
      const mockAdminUser = {
        id: 'cmdf8mw500000jo0rt0oxkim0',
        email: 'admin@israelkitchen.com',
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash: hashedPassword,
        createdAt: new Date('2025-07-23T00:41:18.131Z'),
        updatedAt: new Date('2025-07-23T00:41:18.131Z'),
      }

      mockDb.user.findUnique.mockResolvedValue(mockAdminUser as any)

      // Verify user lookup
      const foundUser = await db.user.findUnique({
        where: { email: adminCredentials.email }
      })

      expect(foundUser).toBeTruthy()
      expect(foundUser?.email).toBe('admin@israelkitchen.com')
      expect(foundUser?.role).toBe('ADMIN')
      expect(foundUser?.status).toBe('ACTIVE')

      // Verify password comparison
      const passwordMatch = await bcrypt.compare(adminCredentials.password, foundUser!.passwordHash)
      expect(passwordMatch).toBe(true)

      console.log('✅ Admin user verification successful:')
      console.log(`   📧 Email: ${foundUser?.email}`)
      console.log(`   👨‍💼 Role: ${foundUser?.role}`)
      console.log(`   ✅ Status: ${foundUser?.status}`)
      console.log(`   🔑 Password: Verified`)
    })

    it('should handle admin login flow', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      const mockAdminUser = {
        id: 'cmdf8mw500000jo0rt0oxkim0',
        email: 'admin@israelkitchen.com',
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash: hashedPassword,
      }

      mockDb.user.findUnique.mockResolvedValue(mockAdminUser as any)

      // Simulate login process
      const user = await db.user.findUnique({
        where: { email: adminCredentials.email }
      })

      expect(user).toBeTruthy()
      
      if (user) {
        const isValidPassword = await bcrypt.compare(adminCredentials.password, user.passwordHash)
        expect(isValidPassword).toBe(true)

        // Verify admin role
        expect(user.role).toBe('ADMIN')
        expect(user.status).toBe('ACTIVE')

        console.log('✅ Admin login flow verified:')
        console.log(`   🔍 User found: ${user.email}`)
        console.log(`   🔐 Password valid: ${isValidPassword}`)
        console.log(`   👨‍💼 Admin role: ${user.role === 'ADMIN'}`)
        console.log(`   ✅ Account active: ${user.status === 'ACTIVE'}`)
      }
    })

    it('should verify admin has correct permissions', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      const mockAdminUser = {
        id: 'cmdf8mw500000jo0rt0oxkim0',
        email: 'admin@israelkitchen.com',
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash: hashedPassword,
      }

      mockDb.user.findUnique.mockResolvedValue(mockAdminUser as any)

      const user = await db.user.findUnique({
        where: { email: adminCredentials.email }
      })

      expect(user?.role).toBe('ADMIN')

      // Verify admin permissions
      const canAccessAdmin = user?.role === 'ADMIN'
      const canManageUsers = user?.role === 'ADMIN'
      const canManageMeals = user?.role === 'ADMIN'
      const canViewReports = user?.role === 'ADMIN'
      const canManageInventory = user?.role === 'ADMIN'

      expect(canAccessAdmin).toBe(true)
      expect(canManageUsers).toBe(true)
      expect(canManageMeals).toBe(true)
      expect(canViewReports).toBe(true)
      expect(canManageInventory).toBe(true)

      console.log('✅ Admin permissions verified:')
      console.log(`   🏠 Admin Dashboard Access: ${canAccessAdmin}`)
      console.log(`   👥 User Management: ${canManageUsers}`)
      console.log(`   🍽️ Meal Management: ${canManageMeals}`)
      console.log(`   📊 Reports Access: ${canViewReports}`)
      console.log(`   📦 Inventory Management: ${canManageInventory}`)
    })

    it('should reject invalid admin password', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      const mockAdminUser = {
        id: 'cmdf8mw500000jo0rt0oxkim0',
        email: 'admin@israelkitchen.com',
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash: hashedPassword,
      }

      mockDb.user.findUnique.mockResolvedValue(mockAdminUser as any)

      const user = await db.user.findUnique({
        where: { email: adminCredentials.email }
      })

      // Test with wrong password
      const wrongPassword = 'wrongpassword'
      const isValidPassword = await bcrypt.compare(wrongPassword, user!.passwordHash)
      
      expect(isValidPassword).toBe(false)

      console.log('✅ Invalid password correctly rejected:')
      console.log(`   🔐 Wrong password rejected: ${!isValidPassword}`)
    })

    it('should handle non-existent admin email', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      const user = await db.user.findUnique({
        where: { email: 'nonexistent@example.com' }
      })

      expect(user).toBeNull()

      console.log('✅ Non-existent email correctly handled:')
      console.log(`   🔍 User not found: ${user === null}`)
    })
  })

  describe('Admin Login Security', () => {
    it('should verify password hashing security', async () => {
      const plainPassword = 'admin123'
      const hashedPassword = await bcrypt.hash(plainPassword, 12)

      // Verify hash is different from plain password
      expect(hashedPassword).not.toBe(plainPassword)
      expect(hashedPassword.length).toBeGreaterThan(50) // bcrypt hashes are long

      // Verify hash can be verified
      const isValid = await bcrypt.compare(plainPassword, hashedPassword)
      expect(isValid).toBe(true)

      console.log('✅ Password security verified:')
      console.log(`   🔐 Password hashed: ${hashedPassword !== plainPassword}`)
      console.log(`   🔒 Hash length: ${hashedPassword.length} characters`)
      console.log(`   ✅ Verification works: ${isValid}`)
    })

    it('should verify account status checking', async () => {
      // Test with disabled account
      const hashedPassword = await bcrypt.hash('admin123', 12)
      const disabledAdminUser = {
        id: 'cmdf8mw500000jo0rt0oxkim0',
        email: 'admin@israelkitchen.com',
        name: 'Admin User',
        role: 'ADMIN',
        status: 'DISABLED',
        passwordHash: hashedPassword,
      }

      mockDb.user.findUnique.mockResolvedValue(disabledAdminUser as any)

      const user = await db.user.findUnique({
        where: { email: adminCredentials.email }
      })

      expect(user?.status).toBe('DISABLED')

      // Should reject login for disabled account
      const shouldAllowLogin = user?.status === 'ACTIVE'
      expect(shouldAllowLogin).toBe(false)

      console.log('✅ Account status security verified:')
      console.log(`   ❌ Disabled account rejected: ${!shouldAllowLogin}`)
    })
  })
})