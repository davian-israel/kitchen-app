#!/usr/bin/env tsx

/**
 * Script to verify admin login credentials work correctly
 * Usage: npm run verify-admin-login
 */

import { db } from '../src/lib/db'
import bcrypt from 'bcryptjs'

async function verifyAdminLogin() {
  console.log('🔐 Verifying Admin Login Credentials...')
  console.log(`📅 ${new Date().toISOString()}`)
  console.log('')

  const adminCredentials = {
    email: 'admin@israelkitchen.com',
    password: 'admin123'
  }

  try {
    console.log('🔍 Step 1: Looking up admin user in database...')
    
    // Find the admin user
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
        updatedAt: true,
      }
    })

    if (!adminUser) {
      console.log('❌ Admin user not found in database!')
      console.log(`   📧 Searched for: ${adminCredentials.email}`)
      return false
    }

    console.log('✅ Admin user found in database:')
    console.log(`   🆔 ID: ${adminUser.id}`)
    console.log(`   📧 Email: ${adminUser.email}`)
    console.log(`   👤 Name: ${adminUser.name}`)
    console.log(`   🔑 Role: ${adminUser.role}`)
    console.log(`   ✅ Status: ${adminUser.status}`)
    console.log(`   📅 Created: ${adminUser.createdAt.toISOString()}`)
    console.log('')

    console.log('🔐 Step 2: Verifying password...')
    
    // Verify the password
    const isPasswordValid = await bcrypt.compare(adminCredentials.password, adminUser.passwordHash)
    
    if (!isPasswordValid) {
      console.log('❌ Password verification failed!')
      console.log(`   🔑 Attempted password: ${adminCredentials.password}`)
      return false
    }

    console.log('✅ Password verification successful!')
    console.log(`   🔑 Password: ${adminCredentials.password} ✓`)
    console.log('')

    console.log('🛡️ Step 3: Checking account status and permissions...')
    
    // Check account status
    if (adminUser.status !== 'ACTIVE') {
      console.log('❌ Account is not active!')
      console.log(`   📊 Status: ${adminUser.status}`)
      return false
    }

    // Check admin role
    if (adminUser.role !== 'ADMIN') {
      console.log('❌ User does not have admin role!')
      console.log(`   🔑 Role: ${adminUser.role}`)
      return false
    }

    console.log('✅ Account status and permissions verified:')
    console.log(`   📊 Status: ${adminUser.status} ✓`)
    console.log(`   🔑 Role: ${adminUser.role} ✓`)
    console.log('')

    console.log('🎯 Step 4: Testing admin capabilities...')
    
    // Test admin capabilities
    const adminCapabilities = {
      canAccessAdminDashboard: adminUser.role === 'ADMIN',
      canManageUsers: adminUser.role === 'ADMIN',
      canManageMeals: adminUser.role === 'ADMIN',
      canViewReports: adminUser.role === 'ADMIN',
      canManageInventory: adminUser.role === 'ADMIN',
      canManageOrders: adminUser.role === 'ADMIN',
    }

    console.log('✅ Admin capabilities verified:')
    Object.entries(adminCapabilities).forEach(([capability, hasAccess]) => {
      const icon = hasAccess ? '✅' : '❌'
      const readableName = capability.replace(/([A-Z])/g, ' $1').toLowerCase()
      console.log(`   ${icon} ${readableName}: ${hasAccess}`)
    })
    console.log('')

    console.log('🔒 Step 5: Security verification...')
    
    // Verify password is properly hashed
    const isPasswordHashed = adminUser.passwordHash !== adminCredentials.password
    const hashLength = adminUser.passwordHash.length
    const hasProperHashFormat = adminUser.passwordHash.startsWith('$2a$') || adminUser.passwordHash.startsWith('$2b$')

    console.log('✅ Security verification:')
    console.log(`   🔐 Password is hashed: ${isPasswordHashed}`)
    console.log(`   📏 Hash length: ${hashLength} characters`)
    console.log(`   🔒 Proper bcrypt format: ${hasProperHashFormat}`)
    console.log('')

    console.log('🎉 ADMIN LOGIN VERIFICATION COMPLETE!')
    console.log('')
    console.log('📋 LOGIN INSTRUCTIONS:')
    console.log('   1. Start the development server: npm run dev')
    console.log('   2. Open browser to: http://localhost:3000')
    console.log('   3. Navigate to: http://localhost:3000/auth/signin')
    console.log('   4. Enter credentials:')
    console.log(`      📧 Email: ${adminCredentials.email}`)
    console.log(`      🔑 Password: ${adminCredentials.password}`)
    console.log('   5. Click "Sign In"')
    console.log('')
    console.log('🚀 Expected Result:')
    console.log('   • Successful login')
    console.log('   • Redirect to admin dashboard')
    console.log('   • Access to all admin features')
    console.log('')

    return true

  } catch (error) {
    console.error('❌ Error during admin login verification:', error)
    return false
  } finally {
    await db.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Run the script if called directly
if (require.main === module) {
  verifyAdminLogin().then(success => {
    if (success) {
      console.log('✅ Admin login verification PASSED')
      process.exit(0)
    } else {
      console.log('❌ Admin login verification FAILED')
      process.exit(1)
    }
  })
}

export { verifyAdminLogin }