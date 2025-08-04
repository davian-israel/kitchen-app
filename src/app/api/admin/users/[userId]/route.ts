import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
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
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        activityLogs: {
          select: {
            id: true,
            action: true,
            details: true,
            ipAddress: true,
            userAgent: true,
            timestamp: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
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
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from disabling themselves
    if (params.userId === session.user.id && validatedData.status === 'DISABLED') {
      return NextResponse.json(
        { error: 'Cannot disable your own account' },
        { status: 400 }
      )
    }

    // Prevent admin from demoting themselves if they're the only admin
    if (params.userId === session.user.id && validatedData.role === 'CUSTOMER') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE' },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last active admin' },
          { status: 400 }
        )
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Log the administrative action
    await prisma.userActivityLog.create({
      data: {
        userId: params.userId,
        action: `Account updated by admin`,
        details: {
          adminId: session.user.id,
          adminEmail: session.user.email,
          changes: validatedData,
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
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
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from deleting themselves
    if (params.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Prevent deletion of the last admin
    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE' },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last active admin' },
          { status: 400 }
        )
      }
    }

    // Check if user has orders (might want to disable instead of delete)
    const orderCount = await prisma.order.count({
      where: { customerId: params.userId },
    })

    if (orderCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing orders. Consider disabling the account instead.' },
        { status: 400 }
      )
    }

    // Delete the user (this will cascade to related records)
    await prisma.user.delete({
      where: { id: params.userId },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}