#!/usr/bin/env tsx

/**
 * Script to create a test user for development/testing purposes
 * Usage: npm run create-test-user
 */

import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

interface CreateUserOptions {
  email: string
  password: string
  name?: string
  role?: 'CUSTOMER' | 'ADMIN'
}

async function createTestUser(options: CreateUserOptions) {
  const { email, password, name, role = 'CUSTOMER' } = options

  try {
    console.log(`🔍 Checking if user ${email} already exists...`)
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log(`❌ User ${email} already exists with ID: ${existingUser.id}`)
      console.log(`   Role: ${existingUser.role}`)
      console.log(`   Status: ${existingUser.status}`)
      console.log(`   Created: ${existingUser.createdAt}`)
      return existingUser
    }

    console.log(`🔐 Hashing password...`)
    const passwordHash = await hashPassword(password)

    console.log(`👤 Creating user ${email}...`)
    const user = await db.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        role,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      }
    })

    console.log(`✅ User created successfully!`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Status: ${user.status}`)
    console.log(`   Created: ${user.createdAt}`)

    // Log the creation in user activity log
    await db.userActivityLog.create({
      data: {
        userId: user.id,
        action: 'USER_CREATE',
        details: {
          method: 'script',
          role: user.role,
          createdBy: 'test-script'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'test-script'
      }
    })

    console.log(`📝 Activity logged successfully`)

    return user

  } catch (error) {
    console.error(`❌ Error creating user:`, error)
    throw error
  }
}

async function main() {
  console.log(`🚀 Starting test user creation script...`)
  console.log(`📅 ${new Date().toISOString()}`)
  console.log(``)

  try {
    // Create the requested test user
    const testUser = await createTestUser({
      email: 'customer@example.com',
      password: 'customer123',
      name: 'Test Customer',
      role: 'CUSTOMER'
    })

    console.log(``)
    console.log(`🎉 Test user creation completed!`)
    console.log(``)
    console.log(`📋 Login Credentials:`)
    console.log(`   Email: customer@example.com`)
    console.log(`   Password: customer123`)
    console.log(`   Role: CUSTOMER`)
    console.log(``)
    console.log(`🔗 You can now use these credentials to:`)
    console.log(`   - Test the login functionality`)
    console.log(`   - Browse the menu as a customer`)
    console.log(`   - Place test orders`)
    console.log(`   - Test the customer dashboard`)

  } catch (error) {
    console.error(`💥 Script failed:`, error)
    process.exit(1)
  } finally {
    await db.$disconnect()
    console.log(``)
    console.log(`🔌 Database connection closed`)
  }
}

// Run the script if called directly
if (require.main === module) {
  main()
}

export { createTestUser }