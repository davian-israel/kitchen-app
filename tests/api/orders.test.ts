import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/orders/route'

// Mock dependencies
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    order: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/audit-logger', () => ({
  auditLogger: {
    logOrder: jest.fn(),
    logSecurity: jest.fn(),
  },
  AuditAction: {
    ORDER_VIEW: 'order.view',
    ORDER_CREATE: 'order.create',
    SUSPICIOUS_ACTIVITY: 'security.activity.suspicious',
  },
}))

jest.mock('@/lib/error-handler', () => ({
  ...jest.requireActual('@/lib/error-handler'),
  checkActionRateLimit: jest.fn().mockReturnValue(true),
}))

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { auditLogger } from '@/lib/audit-logger'
import { checkActionRateLimit } from '@/lib/error-handler'

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockDb = db as jest.Mocked<typeof db>
const mockAuditLogger = auditLogger as jest.Mocked<typeof auditLogger>
const mockCheckActionRateLimit = checkActionRateLimit as jest.MockedFunction<typeof checkActionRateLimit>

describe('/api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      role: 'CUSTOMER',
    },
  }

  const createMockRequest = (body?: any, method: string = 'GET'): NextRequest => {
    const options: RequestInit = { method }
    if (body) {
      options.body = JSON.stringify(body)
      options.headers = { 'content-type': 'application/json' }
    }
    
    return new NextRequest('http://localhost:3000/api/orders', options)
  }

  describe('GET /api/orders', () => {
    it('should fetch user orders successfully', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'IK-123456',
          status: 'PENDING',
          totalAmount: 25.99,
          items: [
            {
              id: 'item-1',
              quantity: 2,
              price: 12.99,
              meal: {
                id: 'meal-1',
                name: 'Test Meal',
                category: 'Main Course',
              },
            },
          ],
          statusHistory: [
            {
              id: 'history-1',
              status: 'PENDING',
              timestamp: new Date(),
              notes: 'Order created',
            },
          ],
          createdAt: new Date(),
        },
      ]

      mockAuth.mockResolvedValue(mockSession as any)
      mockDb.order.findMany.mockResolvedValue(mockOrders as any)

      const request = createMockRequest()
      const response = await GET(request)

      expect(response.status).toBe(200)

      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(mockOrders)

      expect(mockDb.order.findMany).toHaveBeenCalledWith({
        where: { customerId: 'user-123' },
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

      expect(mockAuditLogger.logOrder).toHaveBeenCalledWith(
        'order.view',
        'user-123',
        'multiple',
        expect.any(Object),
        { orderCount: 1 }
      )
    })

    it('should reject unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createMockRequest()
      const response = await GET(request)

      expect(response.status).toBe(401)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('SECURITY_ERROR')

      expect(mockDb.order.findMany).not.toHaveBeenCalled()
    })

    it('should handle rate limiting', async () => {
      mockAuth.mockResolvedValue(mockSession as any)
      mockCheckActionRateLimit.mockReturnValue(false)

      const request = createMockRequest()
      const response = await GET(request)

      expect(response.status).toBe(429)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('SECURITY_ERROR')

      expect(mockDb.order.findMany).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/orders', () => {
    const validOrderData = {
      items: [
        {
          id: 'meal-1',
          name: 'Test Meal',
          price: 15.99,
          quantity: 2,
          category: 'Main Course',
        },
      ],
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
        },
      },
      totalAmount: 31.98,
      paymentMethod: 'stripe' as const,
    }

    it('should create order successfully', async () => {
      const mockCreatedOrder = {
        id: 'order-123',
        orderNumber: 'IK-123456789',
        customerId: 'user-123',
        status: 'PENDING',
        totalAmount: 37.97, // Including delivery fee and tax
        items: [
          {
            id: 'item-1',
            mealId: 'meal-1',
            quantity: 2,
            price: 15.99,
            meal: {
              id: 'meal-1',
              name: 'Test Meal',
            },
          },
        ],
        statusHistory: [
          {
            id: 'history-1',
            status: 'PENDING',
            notes: 'Order created',
          },
        ],
      }

      mockAuth.mockResolvedValue(mockSession as any)
      mockDb.order.create.mockResolvedValue(mockCreatedOrder as any)

      const request = createMockRequest(validOrderData, 'POST')
      const response = await POST(request)

      expect(response.status).toBe(201)

      const responseData = await response.json()
      expect(responseData.success).toBe(true)
      expect(responseData.data.orderId).toBe('order-123')
      expect(responseData.data.orderNumber).toBe('IK-123456789')

      expect(mockDb.order.create).toHaveBeenCalledWith({
        data: {
          orderNumber: expect.stringMatching(/^IK-\d+-[A-Z0-9]{4}$/),
          customerId: 'user-123',
          status: 'PENDING',
          totalAmount: expect.any(Number),
          paymentMethod: 'stripe',
          customerInfo: validOrderData.customerInfo,
          items: {
            create: [
              {
                mealId: 'meal-1',
                quantity: 2,
                price: 15.99,
              },
            ],
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

      expect(mockAuditLogger.logOrder).toHaveBeenCalledWith(
        'order.create',
        'user-123',
        'order-123',
        expect.any(Object),
        expect.objectContaining({
          orderNumber: 'IK-123456789',
          itemCount: 1,
          paymentMethod: 'stripe',
        })
      )
    })

    it('should reject unauthenticated requests', async () => {
      mockAuth.mockResolvedValue(null)

      const request = createMockRequest(validOrderData, 'POST')
      const response = await POST(request)

      expect(response.status).toBe(401)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('SECURITY_ERROR')

      expect(mockDb.order.create).not.toHaveBeenCalled()
    })

    it('should handle rate limiting for order creation', async () => {
      mockAuth.mockResolvedValue(mockSession as any)
      mockCheckActionRateLimit.mockReturnValue(false)

      const request = createMockRequest(validOrderData, 'POST')
      const response = await POST(request)

      expect(response.status).toBe(429)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('SECURITY_ERROR')

      expect(mockDb.order.create).not.toHaveBeenCalled()
    })

    it('should reject orders with excessive total amount', async () => {
      mockAuth.mockResolvedValue(mockSession as any)

      const invalidOrderData = {
        ...validOrderData,
        totalAmount: 1500, // Exceeds maximum
      }

      const request = createMockRequest(invalidOrderData, 'POST')
      const response = await POST(request)

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('SECURITY_ERROR')

      expect(mockDb.order.create).not.toHaveBeenCalled()
    })

    it('should reject orders with too many items', async () => {
      mockAuth.mockResolvedValue(mockSession as any)

      const tooManyItems = Array(25).fill({
        id: 'meal-1',
        name: 'Test Meal',
        price: 15.99,
        quantity: 1,
        category: 'Main Course',
      })

      const invalidOrderData = {
        ...validOrderData,
        items: tooManyItems,
      }

      const request = createMockRequest(invalidOrderData, 'POST')
      const response = await POST(request)

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('SECURITY_ERROR')

      expect(mockDb.order.create).not.toHaveBeenCalled()
    })

    it('should detect order total tampering', async () => {
      mockAuth.mockResolvedValue(mockSession as any)

      const tamperedOrderData = {
        ...validOrderData,
        totalAmount: 10.00, // Much less than actual total
      }

      const request = createMockRequest(tamperedOrderData, 'POST')
      const response = await POST(request)

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('SECURITY_ERROR')

      expect(mockAuditLogger.logSecurity).toHaveBeenCalledWith(
        'security.activity.suspicious',
        'user-123',
        expect.any(Object),
        expect.objectContaining({
          action: 'order_total_mismatch',
        })
      )

      expect(mockDb.order.create).not.toHaveBeenCalled()
    })

    it('should sanitize customer information', async () => {
      mockAuth.mockResolvedValue(mockSession as any)

      const mockCreatedOrder = {
        id: 'order-123',
        orderNumber: 'IK-123456789',
      }

      mockDb.order.create.mockResolvedValue(mockCreatedOrder as any)

      const orderDataWithUnsafeInput = {
        ...validOrderData,
        customerInfo: {
          ...validOrderData.customerInfo,
          name: '<script>alert("xss")</script>John Doe',
          deliveryInstructions: 'Please ring; rm -rf /',
        },
      }

      const request = createMockRequest(orderDataWithUnsafeInput, 'POST')
      const response = await POST(request)

      expect(response.status).toBe(201)

      const createCall = mockDb.order.create.mock.calls[0][0]
      expect(createCall.data.customerInfo.name).not.toContain('<script>')
      expect(createCall.data.customerInfo.deliveryInstructions).not.toContain('rm -rf')
    })

    it('should validate required fields', async () => {
      mockAuth.mockResolvedValue(mockSession as any)

      const invalidOrderData = {
        items: [], // Empty items array
        customerInfo: {
          name: '',
          email: 'invalid-email',
        },
        totalAmount: -10, // Negative amount
        paymentMethod: 'invalid-method',
      }

      const request = createMockRequest(invalidOrderData, 'POST')
      const response = await POST(request)

      expect(response.status).toBe(400)

      const responseData = await response.json()
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('VALIDATION_ERROR')

      expect(mockDb.order.create).not.toHaveBeenCalled()
    })
  })
})