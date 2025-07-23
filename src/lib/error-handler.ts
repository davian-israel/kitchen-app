import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { auditLogger, AuditAction } from '@/lib/audit-logger'
import { NextRequest } from 'next/server'

// Sensitive data patterns to redact from error messages
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /auth/i,
  /session/i,
  /cookie/i,
  /credit.*card/i,
  /ssn/i,
  /social.*security/i,
  /email/i,
  /phone/i,
  /address/i
]

// Database error patterns that should be hidden
const DB_ERROR_PATTERNS = [
  /duplicate key/i,
  /foreign key constraint/i,
  /unique constraint/i,
  /relation.*does not exist/i,
  /column.*does not exist/i,
  /syntax error/i,
  /connection refused/i,
  /timeout/i
]

export interface ErrorContext {
  userId?: string
  request?: NextRequest
  action?: string
  resource?: string
  resourceId?: string
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
    public code: string = 'SECURITY_ERROR'
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string[]>,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError: Error,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// Sanitize error message to remove sensitive information
export function sanitizeErrorMessage(error: Error): string {
  let message = error.message

  // Remove sensitive data patterns
  SENSITIVE_PATTERNS.forEach(pattern => {
    message = message.replace(pattern, '[REDACTED]')
  })

  // Replace database-specific errors with generic messages
  DB_ERROR_PATTERNS.forEach(pattern => {
    if (pattern.test(message)) {
      message = 'A database error occurred. Please try again later.'
    }
  })

  // Remove file paths and stack traces from production errors
  if (process.env.NODE_ENV === 'production') {
    message = message.replace(/\/[^\s]+/g, '[PATH_REDACTED]')
    message = message.replace(/at\s+[^\n]+/g, '')
  }

  return message
}

// Create safe error response for API endpoints
export function createErrorResponse(
  error: Error,
  context?: ErrorContext
): NextResponse {
  let statusCode = 500
  let message = 'An internal server error occurred'
  let code = 'INTERNAL_ERROR'
  let details: any = undefined

  // Handle different error types
  if (error instanceof SecurityError) {
    statusCode = error.statusCode
    message = error.message
    code = error.code
  } else if (error instanceof ValidationError) {
    statusCode = error.statusCode
    message = error.message
    code = 'VALIDATION_ERROR'
    details = { errors: error.errors }
  } else if (error instanceof DatabaseError) {
    statusCode = error.statusCode
    message = 'A database error occurred'
    code = 'DATABASE_ERROR'
  } else if (error instanceof ZodError) {
    statusCode = 400
    message = 'Validation failed'
    code = 'VALIDATION_ERROR'
    details = {
      errors: error.errors.reduce((acc, err) => {
        const path = err.path.join('.')
        if (!acc[path]) acc[path] = []
        acc[path].push(err.message)
        return acc
      }, {} as Record<string, string[]>)
    }
  } else {
    // For unknown errors, sanitize the message
    message = sanitizeErrorMessage(error)
  }

  // Log the error for monitoring
  logError(error, context)

  const response = {
    error: code,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      originalMessage: error.message
    })
  }

  return NextResponse.json(response, { status: statusCode })
}

// Log errors for monitoring and security analysis
async function logError(error: Error, context?: ErrorContext) {
  try {
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error occurred:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context
      })
    }

    // Log security-related errors to audit log
    if (context?.request && (
      error instanceof SecurityError ||
      error.message.toLowerCase().includes('unauthorized') ||
      error.message.toLowerCase().includes('forbidden') ||
      error.message.toLowerCase().includes('invalid token')
    )) {
      await auditLogger.logSecurity(
        AuditAction.SYSTEM_ERROR,
        context.userId,
        context.request,
        {
          errorType: error.name,
          errorMessage: sanitizeErrorMessage(error),
          action: context.action,
          resource: context.resource,
          resourceId: context.resourceId
        }
      )
    }

    // In production, you would also:
    // - Send to external error monitoring service (e.g., Sentry, Rollbar)
    // - Send alerts for critical errors
    // - Store in error tracking database
    
  } catch (logError) {
    // Don't let logging errors break the application
    console.error('Failed to log error:', logError)
  }
}

// Wrapper for API route handlers with error handling
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: Omit<ErrorContext, 'request'>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      // Extract request from args if it's a NextRequest
      const request = args.find(arg => 
        arg && typeof arg === 'object' && 'nextUrl' in arg
      ) as NextRequest | undefined

      return createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        { ...context, request }
      )
    }
  }
}

// Validate and sanitize input data
export function validateAndSanitizeInput<T>(
  data: unknown,
  validator: (data: unknown) => T,
  sanitizer?: (data: T) => T
): T {
  try {
    const validated = validator(data)
    return sanitizer ? sanitizer(validated) : validated
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Input validation failed', {
        validation: error.errors.map(e => e.message)
      })
    }
    throw new ValidationError('Invalid input data', {
      general: ['Input data is invalid or malformed']
    })
  }
}

// Check for suspicious activity patterns
export function detectSuspiciousActivity(
  request: NextRequest,
  context: {
    userId?: string
    action: string
    resource?: string
    failureCount?: number
    timeWindow?: number
  }
): boolean {
  const suspiciousPatterns = [
    // SQL injection attempts
    /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b|\bCREATE\b)/i,
    // XSS attempts
    /<script|javascript:|onload=|onerror=/i,
    // Path traversal attempts
    /\.\.\//,
    // Command injection attempts
    /[;&|`$()]/
  ]

  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  const url = request.nextUrl.toString()

  // Check for suspicious patterns in headers and URL
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent) || pattern.test(referer)
  )

  // Check for rapid repeated failures
  const hasRapidFailures = context.failureCount && context.failureCount > 5

  // Check for unusual user agent
  const hasUnusualUserAgent = !userAgent || 
    userAgent.length < 10 || 
    /bot|crawler|spider/i.test(userAgent)

  return hasSuspiciousPattern || hasRapidFailures || hasUnusualUserAgent
}

// Rate limiting for specific actions
export function checkActionRateLimit(
  userId: string,
  action: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  // This is a simplified implementation
  // In production, use Redis or similar for distributed rate limiting
  const key = `${userId}:${action}`
  const now = Date.now()
  
  // This would be stored in Redis in production
  const actionCounts = new Map<string, { count: number; resetTime: number }>()
  
  const current = actionCounts.get(key)
  
  if (!current || now > current.resetTime) {
    actionCounts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}

// Helper to create standardized API responses
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message })
  }, { status: statusCode })
}

// Helper to create standardized error responses
export function createStandardErrorResponse(
  message: string,
  code: string = 'ERROR',
  statusCode: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json({
    success: false,
    error: code,
    message,
    ...(details && { details })
  }, { status: statusCode })
}