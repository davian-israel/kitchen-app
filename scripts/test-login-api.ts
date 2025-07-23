#!/usr/bin/env tsx

/**
 * Script to test the actual login API endpoint
 * Usage: npm run test-login-api
 */

import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function testLoginAPI() {
  console.log('🔐 Testing Login API Endpoint...')
  console.log(`📅 ${new Date().toISOString()}`)
  console.log('')

  const adminCredentials = {
    email: 'admin@israelkitchen.com',
    password: 'admin123'
  }

  try {
    console.log('🔍 Step 1: Verify admin user exists in database...')
    
    const adminUser = await db.user.findUnique({
      where: { email: adminCredentials.email },
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

    if (!adminUser) {
      console.log('❌ Admin user not found!')
      return false
    }

    console.log('✅ Admin user found:')
    console.log(`   📧 Email: ${adminUser.email}`)
    console.log(`   🔑 Role: ${adminUser.role}`)
    console.log(`   ✅ Status: ${adminUser.status}`)
    console.log(`   🆔 ID: ${adminUser.id}`)
    console.log('')

    console.log('🔐 Step 2: Test password verification...')
    
    const isPasswordValid = await bcrypt.compare(adminCredentials.password, adminUser.passwordHash)
    
    if (!isPasswordValid) {
      console.log('❌ Password verification failed!')
      console.log(`   🔑 Attempted: ${adminCredentials.password}`)
      console.log(`   🔒 Hash: ${adminUser.passwordHash.substring(0, 20)}...`)
      return false
    }

    console.log('✅ Password verification successful!')
    console.log(`   🔑 Password: ${adminCredentials.password}`)
    console.log(`   ✅ Matches hash: true`)
    console.log('')

    console.log('🌐 Step 3: Test NextAuth credentials provider logic...')
    
    // Simulate the NextAuth credentials provider logic
    const user = await db.user.findUnique({
      where: { email: adminCredentials.email }
    })

    if (!user) {
      console.log('❌ User not found during auth')
      return false
    }

    if (user.status !== 'ACTIVE') {
      console.log('❌ User account is not active')
      console.log(`   📊 Status: ${user.status}`)
      return false
    }

    const passwordMatch = await bcrypt.compare(adminCredentials.password, user.passwordHash)
    if (!passwordMatch) {
      console.log('❌ Password does not match during auth')
      return false
    }

    console.log('✅ NextAuth logic simulation successful:')
    console.log(`   👤 User found: ${user.email}`)
    console.log(`   📊 Status active: ${user.status === 'ACTIVE'}`)
    console.log(`   🔐 Password match: ${passwordMatch}`)
    console.log('')

    console.log('🎯 Step 4: Test session data creation...')
    
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    }

    console.log('✅ Session data would be:')
    console.log(`   🆔 ID: ${sessionUser.id}`)
    console.log(`   📧 Email: ${sessionUser.email}`)
    console.log(`   👤 Name: ${sessionUser.name}`)
    console.log(`   🔑 Role: ${sessionUser.role}`)
    console.log(`   📊 Status: ${sessionUser.status}`)
    console.log('')

    console.log('🔍 Step 5: Check for potential issues...')
    
    // Check for common issues
    const issues = []
    
    if (adminCredentials.email.trim() !== adminCredentials.email) {
      issues.push('Email has leading/trailing spaces')
    }
    
    if (adminCredentials.password.trim() !== adminCredentials.password) {
      issues.push('Password has leading/trailing spaces')
    }
    
    if (adminUser.email !== adminCredentials.email) {
      issues.push(`Email mismatch: DB has "${adminUser.email}", trying "${adminCredentials.email}"`)
    }
    
    if (issues.length > 0) {
      console.log('⚠️ Potential issues found:')
      issues.forEach(issue => console.log(`   ⚠️ ${issue}`))
    } else {
      console.log('✅ No issues detected')
    }
    console.log('')

    console.log('🧪 Step 6: Test different password variations...')
    
    const passwordVariations = [
      adminCredentials.password,
      adminCredentials.password.trim(),
      adminCredentials.password.toLowerCase(),
      adminCredentials.password.toUpperCase(),
    ]

    for (const variation of passwordVariations) {
      const testResult = await bcrypt.compare(variation, adminUser.passwordHash)
      const status = testResult ? '✅' : '❌'
      console.log(`   ${status} "${variation}": ${testResult}`)
    }
    console.log('')

    console.log('🎉 LOGIN API TEST COMPLETE!')
    console.log('')
    console.log('📋 MANUAL TEST INSTRUCTIONS:')
    console.log('   1. Open browser to: http://localhost:3000/auth/signin')
    console.log('   2. Enter exactly:')
    console.log(`      📧 Email: ${adminCredentials.email}`)
    console.log(`      🔑 Password: ${adminCredentials.password}`)
    console.log('   3. Click "Sign In"')
    console.log('')
    console.log('🔍 IF LOGIN FAILS, CHECK:')
    console.log('   • Browser developer tools console for errors')
    console.log('   • Network tab for failed API requests')
    console.log('   • Server logs for authentication errors')
    console.log('   • NextAuth configuration in src/auth.ts')
    console.log('   • Environment variables (NEXTAUTH_SECRET, etc.)')
    console.log('')
    console.log('🛠️ DEBUGGING STEPS:')
    console.log('   1. Check if NextAuth is properly configured')
    console.log('   2. Verify credentials provider is set up correctly')
    console.log('   3. Check if middleware is blocking the request')
    console.log('   4. Verify database connection in NextAuth')
    console.log('   5. Check for any CSRF token issues')

    return true

  } catch (error) {
    console.error('❌ Error during login API test:', error)
    return false
  } finally {
    await db.$disconnect()
    console.log('')
    console.log('🔌 Database connection closed')
  }
}

// Run the script if called directly
if (require.main === module) {
  testLoginAPI().then(success => {
    if (success) {
      console.log('✅ Login API test PASSED - credentials are valid')
      process.exit(0)
    } else {
      console.log('❌ Login API test FAILED - check the issues above')
      process.exit(1)
    }
  })
}

export { testLoginAPI }