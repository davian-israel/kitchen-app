import {
  rateLimit,
  getClientIdentifier,
  getUserIdentifier,
  createRateLimitMiddleware,
  addRateLimitHeaders,
  getRateLimitStatus,
  rateLimitConfigs,
} from '../rate-limit'
import { NextRequest } from 'next/server'

// Mock NextRequest
const createMockRequest = (headers: Record<string, string> = {}): NextRequest => {
  const url = 'http://localhost:3000/api/test'
  const request = new NextRequest(url)
  
  // Mock headers
  Object.entries(headers).forEach(([key, value]) => {
    jest.spyOn(request.headers, 'get').mockImplementation((name) => {
      if (name.toLowerCase() === key.toLowerCase()) {
        return value
      }
      return null
    })
  })
  
  return request
}

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear any existing rate limit data
    jest.clearAllMocks()
  })

  describe('rateLimit', () => {
    it('should allow requests within limit', () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 5
      })

      const result1 = limiter('test-user')
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = limiter('test-user')
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    it('should block requests exceeding limit', () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 2
      })

      // First two requests should succeed
      expect(limiter('test-user').success).toBe(true)
      expect(limiter('test-user').success).toBe(true)

      // Third request should be blocked
      const result = limiter('test-user')
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after time window', async () => {
      const limiter = rateLimit({
        windowMs: 100, // Very short window for testing
        maxRequests: 1
      })

      // First request should succeed
      expect(limiter('test-user').success).toBe(true)

      // Second request should be blocked
      expect(limiter('test-user').success).toBe(false)

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150))

      // Request should succeed again
      expect(limiter('test-user').success).toBe(true)
    })

    it('should handle different users separately', () => {
      const limiter = rateLimit({
        windowMs: 60000,
        maxRequests: 1
      })

      expect(limiter('user1').success).toBe(true)
      expect(limiter('user2').success).toBe(true)
      expect(limiter('user1').success).toBe(false)
      expect(limiter('user2').success).toBe(false)
    })
  })

  describe('getClientIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1'
      })
      
      const ip = getClientIdentifier(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const request = createMockRequest({
        'x-real-ip': '192.168.1.2'
      })
      
      const ip = getClientIdentifier(request)
      expect(ip).toBe('192.168.1.2')
    })

    it('should extract IP from cf-connecting-ip header', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '192.168.1.3'
      })
      
      const ip = getClientIdentifier(request)
      expect(ip).toBe('192.168.1.3')
    })

    it('should return unknown for missing headers', () => {
      const request = createMockRequest()
      const ip = getClientIdentifier(request)
      expect(ip).toBe('unknown')
    })

    it('should handle IPv6 prefix', () => {
      const request = createMockRequest({
        'x-forwarded-for': '::ffff:192.168.1.1'
      })
      
      const ip = getClientIdentifier(request)
      expect(ip).toBe('192.168.1.1')
    })
  })

  describe('getUserIdentifier', () => {
    it('should combine IP and user ID', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1'
      })
      
      const identifier = getUserIdentifier(request, 'user123')
      expect(identifier).toBe('192.168.1.1:user123')
    })

    it('should use only IP when no user ID', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1'
      })
      
      const identifier = getUserIdentifier(request)
      expect(identifier).toBe('192.168.1.1')
    })
  })

  describe('createRateLimitMiddleware', () => {
    it('should create working middleware', () => {
      const middleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 2
      })

      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1'
      })

      const result1 = middleware(request)
      expect(result1.success).toBe(true)

      const result2 = middleware(request)
      expect(result2.success).toBe(true)

      const result3 = middleware(request)
      expect(result3.success).toBe(false)
    })
  })

  describe('addRateLimitHeaders', () => {
    it('should add rate limit headers', () => {
      const headers = new Headers()
      const result = {
        success: true,
        limit: 100,
        remaining: 95,
        resetTime: Date.now() + 60000
      }

      addRateLimitHeaders(headers, result)

      expect(headers.get('X-RateLimit-Limit')).toBe('100')
      expect(headers.get('X-RateLimit-Remaining')).toBe('95')
      expect(headers.get('X-RateLimit-Reset')).toBeTruthy()
    })
  })

  describe('getRateLimitStatus', () => {
    it('should return current status', () => {
      const config = {
        windowMs: 60000,
        maxRequests: 5
      }

      const status = getRateLimitStatus('test-user', config)
      expect(status.success).toBe(true)
      expect(status.limit).toBe(5)
      expect(status.remaining).toBe(5)
    })
  })

  describe('rateLimitConfigs', () => {
    it('should have auth config', () => {
      expect(rateLimitConfigs.auth).toBeDefined()
      expect(rateLimitConfigs.auth.windowMs).toBe(15 * 60 * 1000)
      expect(rateLimitConfigs.auth.maxRequests).toBe(5)
    })

    it('should have api config', () => {
      expect(rateLimitConfigs.api).toBeDefined()
      expect(rateLimitConfigs.api.windowMs).toBe(60 * 1000)
      expect(rateLimitConfigs.api.maxRequests).toBe(100)
    })

    it('should have payment config', () => {
      expect(rateLimitConfigs.payment).toBeDefined()
      expect(rateLimitConfigs.payment.windowMs).toBe(60 * 1000)
      expect(rateLimitConfigs.payment.maxRequests).toBe(5)
    })

    it('should have admin config', () => {
      expect(rateLimitConfigs.admin).toBeDefined()
      expect(rateLimitConfigs.admin.windowMs).toBe(60 * 1000)
      expect(rateLimitConfigs.admin.maxRequests).toBe(50)
    })
  })
})