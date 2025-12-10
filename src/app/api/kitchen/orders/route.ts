import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { Session } from 'next-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth() as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is kitchen staff
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.role !== 'KITCHEN_STAFF' && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Kitchen staff or admin access required' },
        { status: 403 }
      )
    }

    // Get filter parameters from query string
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    // Build where clause
    const where: any = {
      paymentStatus: 'PAID', // Only show paid orders
    }

    // Filter by status if provided
    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter.toUpperCase()
    } else {
      // Default: show pending and in-preparation orders
      where.status = {
        in: ['PENDING', 'IN_PREPARATION', 'READY']
      }
    }

    // Fetch paid orders with items and customer info
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            meal: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                category: true,
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        statusHistory: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length
    })
  } catch (error) {
    console.error('Error fetching kitchen orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

