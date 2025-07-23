import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

const updateInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  quantity: z.number().min(0, 'Quantity must be non-negative').optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  minThreshold: z.number().min(0).optional(),
  expirationDate: z.string().optional(),
  cost: z.number().min(0).optional(),
  supplier: z.string().optional(),
})

const inventoryTransactionSchema = z.object({
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'EXPIRED', 'WASTE']),
  quantity: z.number(),
  reason: z.string().optional(),
  cost: z.number().min(0).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
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

    const item = await prisma.inventoryItem.findUnique({
      where: { id: params.itemId },
      include: {
        transactions: {
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
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
    const validatedData = updateInventoryItemSchema.parse(body)

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.itemId },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    // If name is being updated, check for duplicates
    if (validatedData.name && validatedData.name !== existingItem.name) {
      const duplicateItem = await prisma.inventoryItem.findUnique({
        where: { name: validatedData.name },
      })

      if (duplicateItem) {
        return NextResponse.json(
          { error: 'Item with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update the inventory item
    const updatedItem = await prisma.inventoryItem.update({
      where: { id: params.itemId },
      data: {
        name: validatedData.name,
        category: validatedData.category,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        minThreshold: validatedData.minThreshold,
        expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : undefined,
        cost: validatedData.cost,
        supplier: validatedData.supplier,
      },
      include: {
        transactions: {
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    })

    // If quantity was updated, create a transaction record
    if (validatedData.quantity !== undefined && validatedData.quantity !== existingItem.quantity) {
      const quantityDiff = validatedData.quantity - Number(existingItem.quantity)
      
      await prisma.inventoryTransaction.create({
        data: {
          itemId: params.itemId,
          type: quantityDiff > 0 ? 'STOCK_IN' : 'STOCK_OUT',
          quantity: Math.abs(quantityDiff),
          reason: 'Manual adjustment',
        },
      })
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
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

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.itemId },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    // Delete the inventory item (transactions will be deleted due to cascade)
    await prisma.inventoryItem.delete({
      where: { id: params.itemId },
    })

    return NextResponse.json({ message: 'Inventory item deleted successfully' })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Add inventory transaction
export async function POST(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
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
    const validatedData = inventoryTransactionSchema.parse(body)

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.itemId },
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    // Calculate new quantity
    let newQuantity = Number(existingItem.quantity)
    
    switch (validatedData.type) {
      case 'STOCK_IN':
        newQuantity += validatedData.quantity
        break
      case 'STOCK_OUT':
      case 'EXPIRED':
      case 'WASTE':
        newQuantity -= validatedData.quantity
        break
      case 'ADJUSTMENT':
        newQuantity = validatedData.quantity
        break
    }

    // Ensure quantity doesn't go negative
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: 'Transaction would result in negative stock' },
        { status: 400 }
      )
    }

    // Create transaction and update item quantity
    const [transaction, updatedItem] = await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: {
          itemId: params.itemId,
          type: validatedData.type,
          quantity: validatedData.quantity,
          reason: validatedData.reason,
          cost: validatedData.cost,
        },
      }),
      prisma.inventoryItem.update({
        where: { id: params.itemId },
        data: { quantity: newQuantity },
        include: {
          transactions: {
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      transaction,
      item: updatedItem,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating inventory transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}