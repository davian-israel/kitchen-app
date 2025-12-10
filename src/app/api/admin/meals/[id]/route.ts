import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

const updateMealSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  price: z.number().positive('Price must be positive').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  available: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth() as Session | null
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const meal = await db.meal.findUnique({
      where: { id: params.id },
    })

    if (!meal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 })
    }

    return NextResponse.json(meal)
  } catch (error) {
    console.error('Error fetching meal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth() as Session | null
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateMealSchema.parse(body)

    // Check if meal exists
    const existingMeal = await db.meal.findUnique({
      where: { id: params.id },
    })

    if (!existingMeal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 })
    }

    // Check if name is being changed and if it conflicts with another meal
    if (validatedData.name && validatedData.name !== existingMeal.name) {
      const nameConflict = await db.meal.findFirst({
        where: { 
          name: validatedData.name,
          id: { not: params.id }
        },
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A meal with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updatedMeal = await db.meal.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.price && { price: validatedData.price }),
        ...(validatedData.category && { category: validatedData.category }),
        ...(validatedData.imageUrl !== undefined && { imageUrl: validatedData.imageUrl || null }),
        ...(validatedData.ingredients && { ingredients: validatedData.ingredients }),
        ...(validatedData.allergens && { allergens: validatedData.allergens }),
        ...(validatedData.available !== undefined && { available: validatedData.available }),
      },
    })

    return NextResponse.json(updatedMeal)
  } catch (error) {
    console.error('Error updating meal:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth() as Session | null
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if meal exists
    const existingMeal = await db.meal.findUnique({
      where: { id: params.id },
    })

    if (!existingMeal) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 })
    }

    // Check if meal is referenced in any orders
    const orderItems = await db.orderItem.findFirst({
      where: { mealId: params.id },
    })

    if (orderItems) {
      return NextResponse.json(
        { error: 'Cannot delete meal that has been ordered. Consider marking it as unavailable instead.' },
        { status: 400 }
      )
    }

    await db.meal.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Meal deleted successfully' })
  } catch (error) {
    console.error('Error deleting meal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}