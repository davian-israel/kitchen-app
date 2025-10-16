import { PrismaClient, UserRole, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createUser(email: string, name: string, password: string, role: UserRole) {
  console.log(`👤 Creating ${role.toLowerCase()} user: ${email}`)

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      // Update password if user exists (useful for development)
      passwordHash,
      status: UserStatus.ACTIVE,
    },
    create: {
      email,
      name,
      passwordHash,
      role,
      status: UserStatus.ACTIVE,
    },
  })

  // Log user creation activity
  await prisma.userActivityLog.create({
    data: {
      userId: user.id,
      action: role === UserRole.ADMIN ? 'ADMIN_SEED' : 'USER_SEED',
      details: {
        method: 'database_seed',
        role: role,
        seededAt: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      },
      ipAddress: '127.0.0.1',
      userAgent: 'database-seed-script',
    },
  })

  console.log(`   ✅ ${role} user created/updated: ${user.id}`)
  return user
}

async function main() {
  console.log('🌱 Starting database seeding...')
  console.log(`📅 ${new Date().toISOString()}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log('')

  try {
    // Create admin user
    const admin = await createUser(
      'admin@israelkitchen.com',
      'Admin User',
      'admin123',
      UserRole.ADMIN
    )

    // Create customer user
    const customer = await createUser(
      'customer@example.com',
      'John Doe',
      'customer123',
      UserRole.CUSTOMER
    )

    console.log('')

    // Create sample meals
    console.log('🍽️ Creating sample meals...')
    const meals = [
      {
        name: 'Classic Falafel',
        description: 'Traditional deep-fried chickpea balls served with tahini sauce',
        price: 12.99,
        category: 'Main Course',
        ingredients: ['Chickpeas', 'Parsley', 'Onion', 'Garlic', 'Cumin'],
        allergens: ['Sesame'],
        available: true,
      },
      {
        name: 'Shawarma Plate',
        description: 'Tender marinated lamb served with rice, salad, and pita bread',
        price: 18.99,
        category: 'Main Course',
        ingredients: ['Lamb', 'Rice', 'Pita', 'Lettuce', 'Tomato', 'Onion'],
        allergens: ['Gluten'],
        available: true,
      },
      {
        name: 'Hummus Bowl',
        description: 'Creamy chickpea dip topped with olive oil and served with warm pita',
        price: 8.99,
        category: 'Appetizer',
        ingredients: ['Chickpeas', 'Tahini', 'Lemon', 'Garlic', 'Olive Oil'],
        allergens: ['Sesame'],
        available: true,
      },
      {
        name: 'Israel Salad',
        description: 'Fresh diced tomatoes, cucumbers, and herbs with lemon dressing',
        price: 7.99,
        category: 'Salad',
        ingredients: ['Tomatoes', 'Cucumbers', 'Parsley', 'Lemon', 'Olive Oil'],
        allergens: [],
        available: true,
      },
      {
        name: 'Sabich',
        description: 'Pita stuffed with hard-boiled eggs, fried eggplant, and tahini',
        price: 11.99,
        category: 'Main Course',
        ingredients: ['Pita', 'Eggs', 'Eggplant', 'Tahini', 'Pickles'],
        allergens: ['Gluten', 'Eggs', 'Sesame'],
        available: true,
      },
      {
        name: 'Malabi',
        description: 'Traditional milk pudding topped with rose syrup and pistachios',
        price: 6.99,
        category: 'Dessert',
        ingredients: ['Milk', 'Sugar', 'Rose Syrup', 'Pistachios'],
        allergens: ['Dairy', 'Nuts'],
        available: true,
      },
    ]

    let mealsCreated = 0
    for (const meal of meals) {
      try {
        await prisma.meal.upsert({
          where: { name: meal.name },
          update: {
            description: meal.description,
            price: meal.price,
            category: meal.category,
            ingredients: meal.ingredients,
            allergens: meal.allergens,
            available: meal.available,
          },
          create: meal,
        })
        console.log(`   ✅ Meal: ${meal.name}`)
        mealsCreated++
      } catch (error) {
        console.error(`   ❌ Failed to create meal ${meal.name}:`, error)
      }
    }

    console.log('')

    // Create sample inventory items
    console.log('📦 Creating inventory items...')
    const inventoryItems = [
      {
        name: 'Chickpeas',
        category: 'Legumes',
        quantity: 50.0,
        unit: 'kg',
        minThreshold: 10.0,
        cost: 3.50,
        supplier: 'Local Farm Co.',
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        name: 'Tahini',
        category: 'Condiments',
        quantity: 20.0,
        unit: 'kg',
        minThreshold: 5.0,
        cost: 8.99,
        supplier: 'Middle East Imports',
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      },
      {
        name: 'Pita Bread',
        category: 'Bakery',
        quantity: 100.0,
        unit: 'pieces',
        minThreshold: 20.0,
        cost: 0.50,
        supplier: 'Local Bakery',
        expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      {
        name: 'Lamb',
        category: 'Meat',
        quantity: 25.0,
        unit: 'kg',
        minThreshold: 5.0,
        cost: 15.99,
        supplier: 'Premium Meats Ltd.',
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        name: 'Olive Oil',
        category: 'Oils',
        quantity: 10.0,
        unit: 'liters',
        minThreshold: 2.0,
        cost: 12.99,
        supplier: 'Mediterranean Imports',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    ]

    let inventoryCreated = 0
    for (const item of inventoryItems) {
      try {
        await prisma.inventoryItem.upsert({
          where: { name: item.name },
          update: {
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            minThreshold: item.minThreshold,
            cost: item.cost,
            supplier: item.supplier,
            expirationDate: item.expirationDate,
          },
          create: item,
        })
        console.log(`   ✅ Inventory: ${item.name} (${item.quantity} ${item.unit})`)
        inventoryCreated++
      } catch (error) {
        console.error(`   ❌ Failed to create inventory item ${item.name}:`, error)
      }
    }

    console.log('')
    console.log('✅ Database seeding completed successfully!')
    console.log('')
    console.log('🔐 Login Credentials:')
    console.log(`   👨‍💼 Admin: admin@israelkitchen.com (password: admin123)`)
    console.log(`   👤 Customer: customer@example.com (password: customer123)`)
    console.log('')
    console.log('📊 Data Created:')
    console.log(`   🍽️ Meals: ${mealsCreated}/${meals.length}`)
    console.log(`   📦 Inventory Items: ${inventoryCreated}/${inventoryItems.length}`)
    console.log('')
    console.log('🚀 You can now:')
    console.log('   • Login as admin to manage the system')
    console.log('   • Login as customer to browse menu and place orders')
    console.log('   • Test all application features')

  } catch (error) {
    console.error('❌ Error during seeding process:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })