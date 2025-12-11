import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testKitchenLogin() {
  console.log('🔍 Testing Kitchen Staff Login Credentials...\n')

  const email = 'kitchen@israelkitchen.com'
  const password = 'kitchen123'

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log('❌ User not found in database')
      return
    }

    console.log('✅ User found in database:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Status: ${user.status}`)
    console.log(`   Created: ${user.createdAt}`)
    console.log(`   Updated: ${user.updatedAt}`)
    console.log(`   Has Password Hash: ${!!user.passwordHash}`)
    console.log(`   Password Hash Length: ${user.passwordHash?.length || 0} characters`)

    // Test password verification
    console.log('\n🔐 Testing password verification...')
    
    if (!user.passwordHash) {
      console.log('❌ No password hash found for user')
      return
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    
    if (isPasswordValid) {
      console.log('✅ Password verification SUCCESSFUL')
      console.log(`   Password "${password}" matches stored hash`)
    } else {
      console.log('❌ Password verification FAILED')
      console.log(`   Password "${password}" does NOT match stored hash`)
      
      // Try to generate a new hash to compare
      console.log('\n🔧 Generating new hash for comparison...')
      const newHash = await bcrypt.hash(password, 12)
      console.log(`   New hash: ${newHash.substring(0, 20)}...`)
      console.log(`   Stored hash: ${user.passwordHash.substring(0, 20)}...`)
      
      const testNewHash = await bcrypt.compare(password, newHash)
      console.log(`   Test with new hash: ${testNewHash ? 'PASS' : 'FAIL'}`)
    }

    // Check for any login activity
    console.log('\n📊 Checking login history...')
    const recentActivity = await prisma.userActivityLog.findMany({
      where: {
        userId: user.id,
        action: 'LOGIN',
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 5,
    })

    if (recentActivity.length > 0) {
      console.log(`✅ Found ${recentActivity.length} login attempt(s):`)
      recentActivity.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.timestamp.toLocaleString()} - ${log.action}`)
      })
    } else {
      console.log('⚠️  No login attempts found in activity log')
    }

  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testKitchenLogin()

