#!/usr/bin/env tsx

/**
 * Comprehensive debugging script for authentication flow
 * Usage: npm run debug-auth-flow
 */

import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

async function debugAuthFlow() {
  console.log('🔍 COMPREHENSIVE AUTH FLOW DEBUG')
  console.log(`📅 ${new Date().toISOString()}`)
  console.log('=' .repeat(60))
  console.log('')

  const adminCredentials = {
    email: 'admin@israelkitchen.com',
    password: 'admin123'
  }

  try {
    console.log('🔍 STEP 1: Database Connection Test')
    console.log('-'.repeat(40))
    
    // Test database connection
    const dbTest = await db.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection: WORKING')
    console.log('')

    console.log('🔍 STEP 2: User Lookup Test')
    console.log('-'.repeat(40))
    
    // Find user exactly as NextAuth would
    const user = await db.user.findUnique({
      where: { email: adminCredentials.email },
    })

    if (!user) {
      console.log('❌ CRITICAL: User not found!')
      return false
    }

    console.log('✅ User found in database:')
    console.log(`   🆔 ID: ${user.id}`)
    console.log(`   📧 Email: ${user.email}`)
    console.log(`   👤 Name: ${user.name}`)
    console.log(`   🔑 Role: ${user.role}`)
    console.log(`   📊 Status: ${user.status}`)
    console.log(`   🔐 Password Hash: ${user.passwordHash.substring(0, 20)}...`)
    console.log('')

    console.log('🔍 STEP 3: Account Status Check')
    console.log('-'.repeat(40))
    
    if (user.status === 'DISABLED') {
      console.log('❌ CRITICAL: User account is DISABLED!')
      return false
    }
    
    console.log('✅ Account status: ACTIVE')
    console.log('')

    console.log('🔍 STEP 4: Password Verification Test')
    console.log('-'.repeat(40))
    
    // Test password verification exactly as NextAuth would
    const isValidPassword = await bcrypt.compare(adminCredentials.password, user.passwordHash)
    
    if (!isValidPassword) {
      console.log('❌ CRITICAL: Password verification FAILED!')
      console.log(`   🔑 Attempted password: "${adminCredentials.password}"`)
      console.log(`   🔒 Hash in database: ${user.passwordHash}`)
      
      // Test different variations
      console.log('   🧪 Testing password variations:')
      const variations = [
        adminCredentials.password,
        adminCredentials.password.trim(),
        adminCredentials.password.toLowerCase(),
        'admin123',
        'Admin123',
        'ADMIN123'
      ]
      
      for (const variation of variations) {
        const testResult = await bcrypt.compare(variation, user.passwordHash)
        console.log(`      ${testResult ? '✅' : '❌'} "${variation}": ${testResult}`)
      }
      
      return false
    }
    
    console.log('✅ Password verification: SUCCESS')
    console.log(`   🔑 Password "${adminCredentials.password}" matches hash`)
    console.log('')

    console.log('🔍 STEP 5: Zod Schema Validation Test')
    console.log('-'.repeat(40))
    
    // Test Zod validation exactly as NextAuth would
    try {
      const validatedCredentials = loginSchema.parse({
        email: adminCredentials.email,
        password: adminCredentials.password
      })
      console.log('✅ Zod validation: SUCCESS')
      console.log(`   📧 Validated email: ${validatedCredentials.email}`)
      console.log(`   🔑 Validated password: [${validatedCredentials.password.length} chars]`)
    } catch (zodError) {
      console.log('❌ CRITICAL: Zod validation FAILED!')
      console.log(`   Error: ${zodError}`)
      return false
    }
    console.log('')

    console.log('🔍 STEP 6: NextAuth Authorize Function Simulation')
    console.log('-'.repeat(40))
    
    // Simulate the exact NextAuth authorize function
    try {
      const { email, password } = loginSchema.parse({
        email: adminCredentials.email,
        password: adminCredentials.password
      })

      const authUser = await db.user.findUnique({
        where: { email },
      })

      if (!authUser || authUser.status === 'DISABLED') {
        console.log('❌ CRITICAL: NextAuth authorize would return null (user not found or disabled)')
        return false
      }

      const isValidAuthPassword = await bcrypt.compare(password, authUser.passwordHash)
      
      if (!isValidAuthPassword) {
        console.log('❌ CRITICAL: NextAuth authorize would return null (password invalid)')
        return false
      }

      // This is what NextAuth would return
      const authResult = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
      }

      console.log('✅ NextAuth authorize simulation: SUCCESS')
      console.log('   📤 Would return:')
      console.log(`      🆔 ID: ${authResult.id}`)
      console.log(`      📧 Email: ${authResult.email}`)
      console.log(`      👤 Name: ${authResult.name}`)
      console.log(`      🔑 Role: ${authResult.role}`)

    } catch (error) {
      console.log('❌ CRITICAL: NextAuth authorize simulation FAILED!')
      console.log(`   Error: ${error}`)
      return false
    }
    console.log('')

    console.log('🔍 STEP 7: Environment Variables Check')
    console.log('-'.repeat(40))
    
    const envVars = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '[SET]' : '[NOT SET]',
      DATABASE_URL: process.env.DATABASE_URL ? '[SET]' : '[NOT SET]',
      NODE_ENV: process.env.NODE_ENV
    }

    console.log('📋 Environment variables:')
    Object.entries(envVars).forEach(([key, value]) => {
      const status = value && value !== '[NOT SET]' ? '✅' : '❌'
      console.log(`   ${status} ${key}: ${value}`)
    })
    console.log('')

    console.log('🔍 STEP 8: Activity Log Test')
    console.log('-'.repeat(40))
    
    // Test if we can create activity log (this happens in NextAuth authorize)
    try {
      await db.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'DEBUG_TEST',
          details: { method: 'debug-script' },
          ipAddress: '127.0.0.1',
          userAgent: 'debug-script'
        },
      })
      console.log('✅ Activity logging: SUCCESS')
    } catch (logError) {
      console.log('❌ WARNING: Activity logging FAILED!')
      console.log(`   Error: ${logError}`)
      console.log('   This might cause NextAuth authorize to fail')
    }
    console.log('')

    console.log('🔍 STEP 9: NextAuth Configuration Check')
    console.log('-'.repeat(40))
    
    // Check if NextAuth files exist
    const authFiles = [
      'src/auth.ts',
      'src/lib/auth-config.ts',
      'src/lib/auth.ts',
      'src/app/api/auth/[...nextauth]/route.ts'
    ]

    console.log('📁 NextAuth files:')
    for (const file of authFiles) {
      try {
        const fs = require('fs')
        const exists = fs.existsSync(file)
        console.log(`   ${exists ? '✅' : '❌'} ${file}: ${exists ? 'EXISTS' : 'MISSING'}`)
      } catch (error) {
        console.log(`   ❌ ${file}: ERROR checking`)
      }
    }
    console.log('')

    console.log('🎉 DIAGNOSIS COMPLETE!')
    console.log('=' .repeat(60))
    console.log('')
    console.log('📊 SUMMARY:')
    console.log('   ✅ Database connection: WORKING')
    console.log('   ✅ User exists: YES')
    console.log('   ✅ Account active: YES')
    console.log('   ✅ Password correct: YES')
    console.log('   ✅ Zod validation: WORKING')
    console.log('   ✅ NextAuth logic: SHOULD WORK')
    console.log('')
    console.log('🔍 IF LOGIN STILL FAILS, THE ISSUE IS LIKELY:')
    console.log('   1. 🌐 Browser/Client-side issue (cookies, CORS, etc.)')
    console.log('   2. 🔒 CSRF token handling in NextAuth')
    console.log('   3. 🛡️ Middleware interfering with NextAuth')
    console.log('   4. ⚙️ NextAuth configuration issue')
    console.log('   5. 🔄 Session handling problem')
    console.log('')
    console.log('🛠️ NEXT DEBUGGING STEPS:')
    console.log('   1. Check browser developer tools console')
    console.log('   2. Check browser network tab for failed requests')
    console.log('   3. Check server logs during login attempt')
    console.log('   4. Try login in incognito/private mode')
    console.log('   5. Clear all browser cookies and localStorage')
    console.log('')
    console.log('🔐 CREDENTIALS TO USE:')
    console.log(`   📧 Email: ${adminCredentials.email}`)
    console.log(`   🔑 Password: ${adminCredentials.password}`)

    return true

  } catch (error) {
    console.error('❌ CRITICAL ERROR during debug:', error)
    return false
  } finally {
    await db.$disconnect()
    console.log('')
    console.log('🔌 Database connection closed')
  }
}

// Run the script if called directly
if (require.main === module) {
  debugAuthFlow().then(success => {
    if (success) {
      console.log('✅ Debug completed - credentials are VALID')
      process.exit(0)
    } else {
      console.log('❌ Debug found CRITICAL issues')
      process.exit(1)
    }
  })
}

export { debugAuthFlow }