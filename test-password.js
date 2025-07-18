const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testPassword() {
  try {
    console.log('🔍 Testing customer password...')

    // Test both users
    const users = [
      { email: 'customer@example.com', password: 'customer123' },
      { email: 'admin@israelkitchen.com', password: 'admin123' }
    ]

    for (const testUser of users) {
      console.log(`\n--- Testing ${testUser.email} ---`)

      const user = await prisma.user.findUnique({
        where: { email: testUser.email }
      })

      if (!user) {
        console.log('❌ User not found!')
        continue
      }

      console.log(`👤 Found user: ${user.email} (${user.role})`)
      console.log(`🔑 Password hash: ${user.passwordHash.substring(0, 20)}...`)

      // Test the password
      const testPassword = testUser.password
      const isValid = await bcrypt.compare(testPassword, user.passwordHash)

      if (isValid) {
        console.log('✅ Password is CORRECT!')
        console.log(`🔐 Password "${testPassword}" matches the hash`)
      } else {
        console.log('❌ Password is INCORRECT!')
        console.log(`🔐 Password "${testPassword}" does NOT match the hash`)
      }
    }

  } catch (error) {
    console.error('❌ Error testing password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPassword()