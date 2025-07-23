import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address').max(255)
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')

export const phoneSchema = z.string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must be less than 20 characters')

// User registration validation
export const userRegistrationSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// User login validation
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

// Order validation
export const orderItemSchema = z.object({
  id: z.string().cuid('Invalid meal ID'),
  name: z.string().min(1).max(200),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().positive('Quantity must be a positive integer').max(50, 'Maximum 50 items per meal'),
  category: z.string().min(1).max(100)
})

export const customerInfoSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: z.object({
    street: z.string().min(1, 'Street address is required').max(200),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State is required').max(100),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
  }),
  deliveryInstructions: z.string().max(500, 'Delivery instructions must be less than 500 characters').optional()
})

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required').max(20, 'Maximum 20 different items per order'),
  customerInfo: customerInfoSchema,
  totalAmount: z.number().positive('Total amount must be positive').max(10000, 'Order total too large'),
  paymentMethod: z.enum(['stripe', 'google-pay'])
})

// Meal validation
export const mealSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required').max(1000),
  price: z.number().positive('Price must be positive').max(1000, 'Price too high'),
  category: z.string().min(1, 'Category is required').max(100),
  imageUrl: z.string().url('Invalid image URL').optional(),
  ingredients: z.array(z.string().max(100)).max(50, 'Too many ingredients'),
  allergens: z.array(z.string().max(100)).max(20, 'Too many allergens'),
  available: z.boolean().default(true)
})

// Inventory validation
export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: z.string().min(1, 'Category is required').max(100),
  quantity: z.number().min(0, 'Quantity cannot be negative').max(100000, 'Quantity too large'),
  unit: z.string().min(1, 'Unit is required').max(50),
  minThreshold: z.number().min(0).max(10000).optional(),
  expirationDate: z.string().datetime().optional(),
  cost: z.number().min(0).max(10000).optional(),
  supplier: z.string().max(200).optional()
})

// Input sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '')
  
  // Remove potential SQL injection patterns
  sanitized = sanitized.replace(/['"\\;]/g, '')
  
  // Remove potential XSS patterns
  sanitized = sanitized.replace(/<[^>]*>/g, '')
  
  // Remove potential command injection patterns
  sanitized = sanitized.replace(/[;&|`$()]/g, '')
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  // Limit length
  sanitized = sanitized.substring(0, 10000)
  
  return sanitized
}

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Use DOMPurify to sanitize HTML content
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
}

export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  
  // Basic email sanitization
  return email.toLowerCase().trim().substring(0, 255)
}

export function sanitizeNumericInput(input: any): number | null {
  if (typeof input === 'number' && !isNaN(input) && isFinite(input)) {
    return input
  }
  
  if (typeof input === 'string') {
    const parsed = parseFloat(input)
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed
    }
  }
  
  return null
}

// SQL injection prevention helpers
export function escapeSqlString(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Replace single quotes with two single quotes (SQL escaping)
  return input.replace(/'/g, "''")
}

// XSS prevention helpers
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  const htmlEscapes: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
  
  return input.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
}

// Rate limiting helpers
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    skipSuccessfulRequests: true
  },
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    skipSuccessfulRequests: false
  }
}

// Validation middleware helper
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;"
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number // 0-4
  feedback: string[]
  isStrong: boolean
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else feedback.push('Use at least 8 characters')

  if (/[a-z]/.test(password)) score++
  else feedback.push('Add lowercase letters')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Add uppercase letters')

  if (/\d/.test(password)) score++
  else feedback.push('Add numbers')

  if (/[@$!%*?&]/.test(password)) score++
  else feedback.push('Add special characters (@$!%*?&)')

  return {
    score,
    feedback,
    isStrong: score >= 4
  }
}