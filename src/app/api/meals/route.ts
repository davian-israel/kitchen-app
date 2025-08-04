import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const meals = await db.meal.findMany({
      where: { available: true },
      orderBy: { category: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        imageUrl: true,
        ingredients: true,
        allergens: true,
        available: true,
      },
    })

    // Convert Decimal prices to numbers for frontend consumption
    const mealsWithNumberPrices = meals.map(meal => ({
      ...meal,
      price: meal.price.toNumber()
    }))

    return NextResponse.json(mealsWithNumberPrices)
  } catch (error) {
    console.error('Error fetching meals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}