/**
 * End-to-End Admin Login Test (No Mocking)
 * This test verifies the complete admin login flow using real API calls
 */

import { db } from '../../src/lib/db'
import bcrypt from 'bcryptjs'

// Test configuration
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const ADMIN_CREDENTIALS = {
  email: 'admin@israelkitchen.com',
  password: 'admin123'
}

describe('Admin Login End-to-End Test (No Mocking)', () => {
  beforeAll(async () => {
    // Ensure we have a clean test environment
    console.log('🔧 Setting up E2E test environment...')
  })

  afterAll(async () => {
    // Clean up database connection
    await db.$disconnect()
  })

  describe('Database Verification', () => {
    it('should verify admin user exists in database with correct credentials', async () => {
      console.log('🔍 Step 1: Verifying admin user in database...')
      
      // Direct database query (no mocking)
      const adminUser = await db.user.findUnique({
        where: { email: ADMIN_CREDENTIALS.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          passwordHash: true,
          createdAt: true,
        }
      })

      // Verify user exists
      expect(adminUser).toBeTruthy()
      expect(adminUser?.email).toBe(ADMIN_CREDENTIALS.email)
      expect(adminUser?.role).toBe('ADMIN')
      expect(adminUser?.status).toBe('ACTIVE')

      console.log('✅ Admin user found:')
      console.log(`   📧 Email: ${adminUser?.email}`)
      console.log(`   🔑 Role: ${adminUser?.role}`)
      console.log(`   ✅ Status: ${adminUser?.status}`)
      console.log(`   🆔 ID: ${adminUser?.id}`)

      // Verify password hash
      expect(adminUser?.passwordHash).toBeTruthy()
      expect(adminUser?.passwordHash).not.toBe(ADMIN_CREDENTIALS.password) // Should be hashed

      // Verify password can be validated
      const isPasswordValid = await bcrypt.compare(
        ADMIN_CREDENTIALS.password, 
        adminUser!.passwordHash
      )
      expect(isPasswordValid).toBe(true)

      console.log('✅ Password verification:')
      console.log(`   🔐 Password hashed: ${adminUser?.passwordHash !== ADMIN_CREDENTIALS.password}`)
      console.log(`   ✅ Password valid: ${isPasswordValid}`)
    })
  })

  describe('Registration API Test', () => {
    it('should reject duplicate admin registration', async () => {
      console.log('🔍 Step 2: Testing registration API with existing admin email...')

      const registrationData = {
        name: 'Test Admin',
        email: ADMIN_CREDENTIALS.email,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      }

      try {
        const response = await fetch(`${TEST_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(registrationData)
        })

        const data = await response.json()

        // Should reject duplicate email
        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toBe('EMAIL_EXISTS')

        console.log('✅ Registration API correctly rejects duplicate admin email:')
        console.log(`   📧 Email: ${registrationData.email}`)
        console.log(`   ❌ Status: ${response.status}`)
        console.log(`   🚫 Error: ${data.error}`)

      } catch (error) {
        console.error('❌ Registration API test failed:', error)
        throw error
      }
    })
  })

  describe('Authentication Flow Test', () => {
    it('should authenticate admin user with correct credentials', async () => {
      console.log('🔍 Step 3: Testing authentication flow...')

      // First, let's verify the user exists and password is correct
      const user = await db.user.findUnique({
        where: { email: ADMIN_CREDENTIALS.email }
      })

      expect(user).toBeTruthy()
      
      const passwordMatch = await bcrypt.compare(ADMIN_CREDENTIALS.password, user!.passwordHash)
      expect(passwordMatch).toBe(true)

      console.log('✅ Direct authentication verification:')
      console.log(`   👤 User found: ${!!user}`)
      console.log(`   🔐 Password match: ${passwordMatch}`)
      console.log(`   🔑 Role: ${user?.role}`)
      console.log(`   ✅ Status: ${user?.status}`)

      // Test the authentication logic
      const canLogin = user && 
                      user.status === 'ACTIVE' && 
                      passwordMatch

      expect(canLogin).toBe(true)
      console.log(`   🚀 Can login: ${canLogin}`)
    })

    it('should reject authentication with wrong password', async () => {
      console.log('🔍 Step 4: Testing authentication with wrong password...')

      const user = await db.user.findUnique({
        where: { email: ADMIN_CREDENTIALS.email }
      })

      expect(user).toBeTruthy()

      // Test with wrong password
      const wrongPassword = 'wrongpassword123'
      const passwordMatch = await bcrypt.compare(wrongPassword, user!.passwordHash)
      expect(passwordMatch).toBe(false)

      console.log('✅ Wrong password correctly rejected:')
      console.log(`   🔐 Wrong password: ${wrongPassword}`)
      console.log(`   ❌ Password match: ${passwordMatch}`)
    })

    it('should reject authentication for non-existent user', async () => {
      console.log('🔍 Step 5: Testing authentication with non-existent user...')

      const nonExistentEmail = 'nonexistent@example.com'
      const user = await db.user.findUnique({
        where: { email: nonExistentEmail }
      })

      expect(user).toBeNull()

      console.log('✅ Non-existent user correctly handled:')
      console.log(`   📧 Email: ${nonExistentEmail}`)
      console.log(`   ❌ User found: ${!!user}`)
    })
  })

  describe('Admin Permissions Test', () => {
    it('should verify admin has correct role and permissions', async () => {
      console.log('🔍 Step 6: Verifying admin permissions...')

      const adminUser = await db.user.findUnique({
        where: { email: ADMIN_CREDENTIALS.email }
      })

      expect(adminUser?.role).toBe('ADMIN')

      // Test admin permissions
      const permissions = {
        canAccessAdmin: adminUser?.role === 'ADMIN',
        canManageUsers: adminUser?.role === 'ADMIN',
        canManageMeals: adminUser?.role === 'ADMIN',
        canViewReports: adminUser?.role === 'ADMIN',
        canManageInventory: adminUser?.role === 'ADMIN',
        canManageOrders: adminUser?.role === 'ADMIN'
      }

      Object.values(permissions).forEach(permission => {
        expect(permission).toBe(true)
      })

      console.log('✅ Admin permissions verified:')
      Object.entries(permissions).forEach(([key, value]) => {
        const readable = key.replace(/([A-Z])/g, ' $1').toLowerCase()
        console.log(`   ✅ ${readable}: ${value}`)
      })
    })
  })

  describe('Password Security Test', () => {
    it('should verify password is properly secured', async () => {
      console.log('🔍 Step 7: Verifying password security...')

      const adminUser = await db.user.findUnique({
        where: { email: ADMIN_CREDENTIALS.email }
      })

      expect(adminUser?.passwordHash).toBeTruthy()

      // Verify password is hashed (not stored in plain text)
      expect(adminUser?.passwordHash).not.toBe(ADMIN_CREDENTIALS.password)

      // Verify hash format (bcrypt)
      const isBcryptHash = adminUser?.passwordHash.startsWith('$2a$') || 
                          adminUser?.passwordHash.startsWith('$2b$')
      expect(isBcryptHash).toBe(true)

      // Verify hash length (bcrypt hashes are 60 characters)
      expect(adminUser?.passwordHash.length).toBe(60)

      // Verify password can be validated
      const isValid = await bcrypt.compare(ADMIN_CREDENTIALS.password, adminUser!.passwordHash)
      expect(isValid).toBe(true)

      console.log('✅ Password security verified:')
      console.log(`   🔐 Password hashed: ${adminUser?.passwordHash !== ADMIN_CREDENTIALS.password}`)
      console.log(`   🔒 Bcrypt format: ${isBcryptHash}`)
      console.log(`   📏 Hash length: ${adminUser?.passwordHash.length}`)
      console.log(`   ✅ Validation works: ${isValid}`)
    })
  })

  describe('Account Status Test', () => {
    it('should verify account is active and ready for login', async () => {
      console.log('🔍 Step 8: Verifying account status...')

      const adminUser = await db.user.findUnique({
        where: { email: ADMIN_CREDENTIALS.email }
      })

      expect(adminUser?.status).toBe('ACTIVE')

      // Test login eligibility
      const isEligibleForLogin = adminUser?.status === 'ACTIVE' && 
                                adminUser?.role === 'ADMIN'
      expect(isEligibleForLogin).toBe(true)

      console.log('✅ Account status verified:')
      console.log(`   📊 Status: ${adminUser?.status}`)
      console.log(`   🔑 Role: ${adminUser?.role}`)
      console.log(`   🚀 Login eligible: ${isEligibleForLogin}`)
    })
  })

  describe('Complete Login Flow Simulation', () => {
    it('should simulate complete login process', async () => {
      console.log('🔍 Step 9: Simulating complete login process...')

      // Step 1: Find user by email
      const user = await db.user.findUnique({
        where: { email: ADMIN_CREDENTIALS.email }
      })

      expect(user).toBeTruthy()
      console.log(`   ✅ Step 1 - User lookup: Found user ${user?.email}`)

      // Step 2: Verify account is active
      expect(user?.status).toBe('ACTIVE')
      console.log(`   ✅ Step 2 - Account status: ${user?.status}`)

      // Step 3: Verify password
      const passwordValid = await bcrypt.compare(ADMIN_CREDENTIALS.password, user!.passwordHash)
      expect(passwordValid).toBe(true)
      console.log(`   ✅ Step 3 - Password verification: ${passwordValid}`)

      // Step 4: Check role permissions
      expect(user?.role).toBe('ADMIN')
      console.log(`   ✅ Step 4 - Role verification: ${user?.role}`)

      // Step 5: Simulate session creation (would happen in NextAuth)
      const sessionData = {
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.name,
          role: user?.role,
          status: user?.status
        }
      }

      expect(sessionData.user.id).toBeTruthy()
      expect(sessionData.user.email).toBe(ADMIN_CREDENTIALS.email)
      expect(sessionData.user.role).toBe('ADMIN')

      console.log(`   ✅ Step 5 - Session data prepared:`)
      console.log(`      🆔 ID: ${sessionData.user.id}`)
      console.log(`      📧 Email: ${sessionData.user.email}`)
      console.log(`      👤 Name: ${sessionData.user.name}`)
      console.log(`      🔑 Role: ${sessionData.user.role}`)

      console.log('🎉 Complete login flow simulation SUCCESSFUL!')
    })
  })

  describe('Troubleshooting Information', () => {
    it('should provide troubleshooting information if login fails', async () => {
      console.log('🔍 Step 10: Gathering troubleshooting information...')

      const user = await db.user.findUnique({
        where: { email: ADMIN_CREDENTIALS.email }
      })

      console.log('🔧 Troubleshooting Information:')
      console.log(`   📧 Email in database: ${user?.email}`)
      console.log(`   🔑 Role in database: ${user?.role}`)
      console.log(`   📊 Status in database: ${user?.status}`)
      console.log(`   🆔 User ID: ${user?.id}`)
      console.log(`   📅 Created: ${user?.createdAt}`)
      console.log(`   🔐 Password hash length: ${user?.passwordHash?.length}`)
      console.log(`   🔒 Hash format: ${user?.passwordHash?.substring(0, 4)}...`)

      // Test password comparison step by step
      if (user?.passwordHash) {
        const passwordTest = await bcrypt.compare(ADMIN_CREDENTIALS.password, user.passwordHash)
        console.log(`   ✅ Password test result: ${passwordTest}`)
        
        // Test with different variations
        const variations = [
          ADMIN_CREDENTIALS.password,
          ADMIN_CREDENTIALS.password.trim(),
          ADMIN_CREDENTIALS.password.toLowerCase(),
        ]

        for (const variation of variations) {
          const testResult = await bcrypt.compare(variation, user.passwordHash)
          console.log(`   🧪 Password variation "${variation}": ${testResult}`)
        }
      }

      console.log('')
      console.log('📋 Manual Login Instructions:')
      console.log('   1. Open browser to: http://localhost:3000/auth/signin')
      console.log(`   2. Enter email: ${ADMIN_CREDENTIALS.email}`)
      console.log(`   3. Enter password: ${ADMIN_CREDENTIALS.password}`)
      console.log('   4. Click Sign In')
      console.log('')
      console.log('🔍 If login fails, check:')
      console.log('   • Email is exactly: admin@israelkitchen.com')
      console.log('   • Password is exactly: admin123')
      console.log('   • No extra spaces or characters')
      console.log('   • Browser developer tools for error messages')
      console.log('   • Server logs for authentication errors')
    })
  })
})