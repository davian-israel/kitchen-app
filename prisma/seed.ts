import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@israelkitchen.com' },
    update: {},
    create: {
      email: 'admin@israelkitchen.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  })

  // Create customer user
  const customerPassword = await bcrypt.hash('customer123', 12)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'John Doe',
      passwordHash: customerPassword,
      role: UserRole.CUSTOMER,
    },
  })

  // Create sample meals
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
      name: 'Israeli Salad',
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

  for (const meal of meals) {
    await prisma.meal.upsert({
      where: { name: meal.name },
      update: {},
      create: meal,
    })
  }

  // Create sample inventory items
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

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    })
  }

  console.log('✅ Database seeding completed!')
  console.log(`👤 Admin user: admin@israelkitchen.com (password: admin123)`)
  console.log(`👤 Customer user: customer@example.com (password: customer123)`)
  console.log(`🍽️ Created ${meals.length} sample meals`)
  console.log(`📦 Created ${inventoryItems.length} inventory items`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })