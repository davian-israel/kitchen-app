import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { userRegistrationSchema, sanitizeEmail, sanitizeString } from '@/lib/validation'
import { withErrorHandler, validateAndSanitizeInput, detectSuspiciousActivity, SecurityError } from '@/lib/error-handler'
import { auditLogger, AuditAction } from '@/lib/audit-logger'

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check for suspicious activity
  if (detectSuspiciousActivity(request, { action: 'register' })) {
    await auditLogger.logSecurity(
      AuditAction.SUSPICIOUS_ACTIVITY,
      undefined,
      request,
      { action: 'register', reason: 'suspicious_patterns_detected' }
    )
    throw new SecurityError('Request blocked due to suspicious activity', 403)
  }

  const body = await request.json()
  
  // Validate and sanitize input
  const validatedData = validateAndSanitizeInput(
    body,
    (data) => userRegistrationSchema.parse(data),
    (data) => ({
      ...data,
      email: sanitizeEmail(data.email),
      name: data.name ? sanitizeString(data.name) : undefined
    })
  )

  const { email, password, name, confirmPassword } = validatedData

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    // Log failed registration attempt
    await auditLogger.logAuth(
      AuditAction.REGISTER_FAILED,
      undefined,
      request,
      false,
      { email, reason: 'email_already_exists' },
      'User with this email already exists'
    )
    
    throw new SecurityError('User with this email already exists', 400, 'EMAIL_EXISTS')
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  // Create user
  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: 'CUSTOMER',
      status: 'ACTIVE'
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  // Log successful registration
  await auditLogger.logAuth(
    AuditAction.REGISTER_SUCCESS,
    user.id,
    request,
    true,
    { email, method: 'credentials' }
  )

  return NextResponse.json(
    { 
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    },
    { status: 201 }
  )
}, { action: 'register', resource: 'user' })