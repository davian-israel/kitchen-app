#!/usr/bin/env tsx

/**
 * Script to verify that users were created correctly in the database
 * Usage: npm run verify-users
 */

import { db } from '../src/lib/db'

async function verifyUsers() {
  console.log('🔍 Verifying database users...')
  console.log(`📅 ${new Date().toISOString()}`)
  console.log('')

  try {
    // Get all users
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    if (users.length === 0) {
      console.log('❌ No users found in database')
      return
    }

    console.log(`👥 Found ${users.length} users in database:`)
    console.log('')

    users.forEach((user, index) => {
      const roleIcon = user.role === 'ADMIN' ? '👨‍💼' : '👤'
      const statusIcon = user.status === 'ACTIVE' ? '✅' : '❌'
      
      console.log(`${index + 1}. ${roleIcon} ${user.name}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   🔑 Role: ${user.role}`)
      console.log(`   ${statusIcon} Status: ${user.status}`)
      console.log(`   🆔 ID: ${user.id}`)
      console.log(`   📅 Created: ${user.createdAt.toISOString()}`)
      console.log(`   🔄 Updated: ${user.updatedAt.toISOString()}`)
      console.log('')
    })

    // Check for specific users
    const adminUser = users.find(u => u.email === 'admin@israelkitchen.com')
    const customerUser = users.find(u => u.email === 'customer@example.com')

    console.log('🎯 Target Users Verification:')
    
    if (adminUser) {
      console.log(`   ✅ Admin user found: ${adminUser.email} (${adminUser.role})`)
    } else {
      console.log(`   ❌ Admin user NOT found: admin@israelkitchen.com`)
    }

    if (customerUser) {
      console.log(`   ✅ Customer user found: ${customerUser.email} (${customerUser.role})`)
    } else {
      console.log(`   ❌ Customer user NOT found: customer@example.com`)
    }

    console.log('')

    // Get user activity logs for verification
    const activityLogs = await db.userActivityLog.findMany({
      where: {
        action: {
          in: ['ADMIN_SEED', 'USER_SEED']
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    })

    if (activityLogs.length > 0) {
      console.log('📝 Recent seeding activity:')
      activityLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} - User: ${log.userId}`)
        console.log(`      📅 ${log.timestamp.toISOString()}`)
        console.log(`      🌐 IP: ${log.ipAddress}`)
        console.log(`      🔧 Agent: ${log.userAgent}`)
        console.log('')
      })
    }

    // Get meal count
    const mealCount = await db.meal.count()
    console.log(`🍽️ Meals in database: ${mealCount}`)

    // Get inventory count
    const inventoryCount = await db.inventoryItem.count()
    console.log(`📦 Inventory items in database: ${inventoryCount}`)

    console.log('')
    console.log('✅ User verification completed!')

  } catch (error) {
    console.error('❌ Error verifying users:', error)
    throw error
  } finally {
    await db.$disconnect()
    console.log('🔌 Database connection closed')
  }
}

// Run the script if called directly
if (require.main === module) {
  verifyUsers()
}

export { verifyUsers }