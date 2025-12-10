import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'
import { createOrderSchema, sanitizeString } from '@/lib/validation'
import { withErrorHandler, validateAndSanitizeInput, SecurityError, checkActionRateLimit } from '@/lib/error-handler'
import { auditLogger, AuditAction } from '@/lib/audit-logger'
import { Session } from 'next-auth'

export const dynamic = 'force-dynamic'



export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth() as Session | null
  
  if (!session?.user?.id) {
    throw new SecurityError('Unauthorized', 401)
  }

  // Check rate limiting for order fetching
  if (!checkActionRateLimit(session.user.id, 'fetch_orders', 20, 60000)) {
    throw new SecurityError('Too many requests', 429)
  }

  const orders = await prisma.order.findMany({
    where: {
      customerId: session.user.id,
    },
    include: {
      items: {
        include: {
          meal: true,
        },
      },
      statusHistory: {
        orderBy: {
          timestamp: 'desc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Log order access
  await auditLogger.logOrder(
    AuditAction.ORDER_VIEW,
    session.user.id,
    'multiple',
    request,
    { orderCount: orders.length }
  )

  return NextResponse.json({
    success: true,
    data: orders
  })
}, { action: 'fetch_orders', resource: 'order' })

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth() as Session | null
  
  if (!session?.user?.id) {
    throw new SecurityError('Unauthorized', 401)
  }

  // Check rate limiting for order creation (max 5 orders per hour)
  if (!checkActionRateLimit(session.user.id, 'create_order', 5, 60 * 60 * 1000)) {
    throw new SecurityError('Too many order attempts. Please try again later.', 429)
  }

  const body = await request.json()
  
  // Validate and sanitize input
  const validatedData = validateAndSanitizeInput(
    body,
    (data) => createOrderSchema.parse(data),
    (data) => ({
      ...data,
      customerInfo: {
        ...data.customerInfo,
        name: sanitizeString(data.customerInfo.name),
        deliveryInstructions: data.customerInfo.deliveryInstructions 
          ? sanitizeString(data.customerInfo.deliveryInstructions) 
          : undefined
      }
    })
  )

  // Additional business logic validation
  if (validatedData.totalAmount > 1000) {
    throw new SecurityError('Order total exceeds maximum allowed amount', 400)
  }

  if (validatedData.items.length > 20) {
    throw new SecurityError('Too many items in order', 400)
  }

  // Generate order number
  const orderNumber = `IK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

  // Calculate totals (server-side validation)
  const subtotal = validatedData.totalAmount
  const deliveryFee = 5.99
  const tax = subtotal * 0.08
  const finalTotal = subtotal + deliveryFee + tax

  // Verify total amount matches calculation (prevent tampering)
  const expectedTotal = validatedData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  if (Math.abs(subtotal - expectedTotal) > 0.01) {
    await auditLogger.logSecurity(
      AuditAction.SUSPICIOUS_ACTIVITY,
      session.user.id,
      request,
      { 
        action: 'order_total_mismatch',
        expectedTotal,
        providedTotal: subtotal,
        difference: Math.abs(subtotal - expectedTotal)
      }
    )
    throw new SecurityError('Order total validation failed', 400)
  }

  // Create the order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: session.user.id,
      status: 'PENDING',
      totalAmount: finalTotal,
      paymentMethod: validatedData.paymentMethod,
      customerInfo: validatedData.customerInfo,
      items: {
        create: validatedData.items.map(item => ({
          mealId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      },
      statusHistory: {
        create: {
          status: 'PENDING',
          notes: 'Order created',
        },
      },
    },
    include: {
      items: {
        include: {
          meal: true,
        },
      },
      statusHistory: true,
    },
  })

  // Log successful order creation
  await auditLogger.logOrder(
    AuditAction.ORDER_CREATE,
    session.user.id,
    order.id,
    request,
    {
      orderNumber: order.orderNumber,
      totalAmount: finalTotal,
      itemCount: validatedData.items.length,
      paymentMethod: validatedData.paymentMethod
    }
  )

  return NextResponse.json({
    success: true,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      order,
    }
  }, { status: 201 })
}, { action: 'create_order', resource: 'order' })