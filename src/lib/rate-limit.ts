import { NextRequest } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (in production, use Redis or similar)
const store: RateLimitStore = {}

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  message?: string
}

// Default configurations for different endpoints
export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    skipSuccessfulRequests: true
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many requests. Please try again in a minute.',
    skipSuccessfulRequests: true
  },
  payment: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many payment attempts. Please try again in a minute.',
    skipSuccessfulRequests: false
  },
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Too many admin requests. Please try again in a minute.',
    skipSuccessfulRequests: true
  }
}

export function rateLimit(config: RateLimitConfig) {
  return (identifier: string): RateLimitResult => {
    const now = Date.now()
    const key = `${identifier}`
    
    // Clean up expired entries
    if (store[key] && now > store[key].resetTime) {
      delete store[key]
    }
    
    // Initialize or get current count
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + config.windowMs
      }
    }
    
    const current = store[key]
    
    // Check if limit exceeded
    if (current.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: current.resetTime,
        message: config.message || 'Rate limit exceeded'
      }
    }
    
    // Increment counter
    current.count++
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime
    }
  }
}

// Helper to get client identifier from request
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  let ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown'
  
  // Remove IPv6 prefix if present
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7)
  }
  
  return ip
}

// Helper to get user identifier (IP + User ID if authenticated)
export function getUserIdentifier(request: NextRequest, userId?: string): string {
  const ip = getClientIdentifier(request)
  return userId ? `${ip}:${userId}` : ip
}

// Middleware helper for rate limiting
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = rateLimit(config)
  
  return (request: NextRequest, userId?: string) => {
    const identifier = getUserIdentifier(request, userId)
    return limiter(identifier)
  }
}

// Specific rate limiters for different endpoints
export const authRateLimit = createRateLimitMiddleware(rateLimitConfigs.auth)
export const apiRateLimit = createRateLimitMiddleware(rateLimitConfigs.api)
export const paymentRateLimit = createRateLimitMiddleware(rateLimitConfigs.payment)
export const adminRateLimit = createRateLimitMiddleware(rateLimitConfigs.admin)

// Helper to add rate limit headers to response
export function addRateLimitHeaders(headers: Headers, result: RateLimitResult) {
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
}

// Clean up expired entries periodically (call this in a background job)
export function cleanupRateLimitStore() {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key] && now > store[key].resetTime) {
      delete store[key]
    }
  })
}

// Get current rate limit status for a user
export function getRateLimitStatus(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const key = identifier
  
  if (!store[key] || now > store[key].resetTime) {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs
    }
  }
  
  const current = store[key]
  
  return {
    success: current.count < config.maxRequests,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - current.count),
    resetTime: current.resetTime
  }
}