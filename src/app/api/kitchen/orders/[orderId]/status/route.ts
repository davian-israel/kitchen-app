import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { Session } from 'next-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PREPARATION', 'READY', 'COMPLETED']),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth() as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is kitchen staff or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.role !== 'KITCHEN_STAFF' && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Kitchen staff or admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    // Check if order exists and is paid
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.orderId },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (existingOrder.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'Order must be paid before updating status' },
        { status: 400 }
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: params.orderId },
      data: {
        status: validatedData.status,
        statusHistory: {
          create: {
            status: validatedData.status,
            notes: validatedData.notes || `Order marked as ${validatedData.status.toLowerCase()} by kitchen staff`,
          }
        }
      },
      include: {
        items: {
          include: {
            meal: true
          }
        },
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        statusHistory: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      }
    })

    // TODO: Send notification to customer when order is ready
    // This can be implemented later with email/SMS/push notifications

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order status updated to ${validatedData.status}`
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

