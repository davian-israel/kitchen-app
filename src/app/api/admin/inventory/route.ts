import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  unit: z.string().min(1, 'Unit is required'),
  minThreshold: z.number().min(0).optional(),
  expirationDate: z.string().optional(),
  cost: z.number().min(0).optional(),
  supplier: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all inventory items with transactions
    const items = await prisma.inventoryItem.findMany({
      include: {
        transactions: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 10, // Get last 10 transactions for each item
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createInventoryItemSchema.parse(body)

    // Check if item with same name already exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { name: validatedData.name },
    })

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item with this name already exists' },
        { status: 400 }
      )
    }

    // Create the inventory item
    const item = await prisma.inventoryItem.create({
      data: {
        name: validatedData.name,
        category: validatedData.category,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        minThreshold: validatedData.minThreshold,
        expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : null,
        cost: validatedData.cost,
        supplier: validatedData.supplier,
        transactions: {
          create: {
            type: 'STOCK_IN',
            quantity: validatedData.quantity,
            reason: 'Initial stock',
            cost: validatedData.cost,
          },
        },
      },
      include: {
        transactions: true,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}