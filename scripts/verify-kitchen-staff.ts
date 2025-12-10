import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying Kitchen Staff User in Production Database...\n')

  try {
    // Find kitchen staff user
    const kitchenStaff = await prisma.user.findUnique({
      where: { email: 'kitchen@israelkitchen.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (kitchenStaff) {
      console.log('✅ Kitchen Staff User Found!\n')
      console.log('📋 User Details:')
      console.log(`   ID: ${kitchenStaff.id}`)
      console.log(`   Email: ${kitchenStaff.email}`)
      console.log(`   Name: ${kitchenStaff.name}`)
      console.log(`   Role: ${kitchenStaff.role}`)
      console.log(`   Status: ${kitchenStaff.status}`)
      console.log(`   Created: ${kitchenStaff.createdAt.toLocaleString()}`)
      console.log(`   Updated: ${kitchenStaff.updatedAt.toLocaleString()}`)
      console.log('\n✅ Kitchen staff user is deployed and ready to use!')
      console.log('\n🔐 Login Credentials:')
      console.log('   Email: kitchen@israelkitchen.com')
      console.log('   Password: kitchen123')
    } else {
      console.log('❌ Kitchen Staff User NOT Found!')
      console.log('\n🔧 To create the user, run:')
      console.log('   npm run db:seed')
    }

    // Count all users by role
    console.log('\n📊 User Statistics:')
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    })

    usersByRole.forEach(group => {
      console.log(`   ${group.role}: ${group._count} user(s)`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

