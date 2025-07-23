import { NextRequest } from 'next/server'
import { db as prisma } from '@/lib/db'

export interface AuditLogEntry {
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
  timestamp?: Date
}

export enum AuditAction {
  // Authentication actions
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILED = 'auth.login.failed',
  LOGOUT = 'auth.logout',
  REGISTER_SUCCESS = 'auth.register.success',
  REGISTER_FAILED = 'auth.register.failed',
  PASSWORD_CHANGE = 'auth.password.change',
  
  // User management actions
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_DISABLE = 'user.disable',
  USER_ENABLE = 'user.enable',
  USER_ROLE_CHANGE = 'user.role.change',
  
  // Order actions
  ORDER_CREATE = 'order.create',
  ORDER_UPDATE = 'order.update',
  ORDER_CANCEL = 'order.cancel',
  ORDER_STATUS_CHANGE = 'order.status.change',
  ORDER_VIEW = 'order.view',
  
  // Meal management actions
  MEAL_CREATE = 'meal.create',
  MEAL_UPDATE = 'meal.update',
  MEAL_DELETE = 'meal.delete',
  MEAL_VIEW = 'meal.view',
  
  // Inventory actions
  INVENTORY_CREATE = 'inventory.create',
  INVENTORY_UPDATE = 'inventory.update',
  INVENTORY_DELETE = 'inventory.delete',
  INVENTORY_TRANSACTION = 'inventory.transaction',
  
  // Payment actions
  PAYMENT_ATTEMPT = 'payment.attempt',
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUND = 'payment.refund',
  
  // Admin actions
  ADMIN_LOGIN = 'admin.login',
  ADMIN_ACCESS = 'admin.access',
  ADMIN_EXPORT = 'admin.export',
  ADMIN_REPORT_VIEW = 'admin.report.view',
  
  // Security events
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  INVALID_TOKEN = 'security.token.invalid',
  UNAUTHORIZED_ACCESS = 'security.access.unauthorized',
  SUSPICIOUS_ACTIVITY = 'security.activity.suspicious',
  
  // System events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_MAINTENANCE = 'system.maintenance'
}

export class AuditLogger {
  private static instance: AuditLogger
  
  private constructor() {}
  
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }
  
  // Log an audit event
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Store in database
      await prisma.userActivityLog.create({
        data: {
          userId: entry.userId || 'anonymous',
          action: entry.action,
          details: {
            resource: entry.resource,
            resourceId: entry.resourceId,
            success: entry.success,
            errorMessage: entry.errorMessage,
            ...entry.details
          },
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          timestamp: entry.timestamp || new Date()
        }
      })
      
      // In production, you might also want to:
      // - Send to external logging service (e.g., CloudWatch, Datadog)
      // - Send alerts for critical security events
      // - Store in separate audit database for compliance
      
      if (this.isCriticalSecurityEvent(entry.action)) {
        await this.handleCriticalSecurityEvent(entry)
      }
      
    } catch (error) {
      console.error('Failed to log audit event:', error)
      // Don't throw error to avoid breaking the main application flow
    }
  }
  
  // Log authentication events
  async logAuth(action: AuditAction, userId: string | undefined, request: NextRequest, success: boolean, details?: Record<string, any>, errorMessage?: string): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'authentication',
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      success,
      errorMessage
    })
  }
  
  // Log user management events
  async logUserManagement(action: AuditAction, adminUserId: string, targetUserId: string, request: NextRequest, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminUserId,
      action,
      resource: 'user',
      resourceId: targetUserId,
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      success: true
    })
  }
  
  // Log order events
  async logOrder(action: AuditAction, userId: string, orderId: string, request: NextRequest, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'order',
      resourceId: orderId,
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      success: true
    })
  }
  
  // Log payment events
  async logPayment(action: AuditAction, userId: string, orderId: string, request: NextRequest, success: boolean, details?: Record<string, any>, errorMessage?: string): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'payment',
      resourceId: orderId,
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      success,
      errorMessage
    })
  }
  
  // Log security events
  async logSecurity(action: AuditAction, userId: string | undefined, request: NextRequest, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'security',
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      success: false // Security events are typically failures
    })
  }
  
  // Log admin actions
  async logAdmin(action: AuditAction, adminUserId: string, request: NextRequest, resourceId?: string, details?: Record<string, any>): Promise<void> {
    await this.log({
      userId: adminUserId,
      action,
      resource: 'admin',
      resourceId,
      details,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      success: true
    })
  }
  
  // Get recent audit logs for a user
  async getUserAuditLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      return await prisma.userActivityLog.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit
      })
    } catch (error) {
      console.error('Failed to fetch user audit logs:', error)
      return []
    }
  }
  
  // Get security events
  async getSecurityEvents(limit: number = 100): Promise<any[]> {
    try {
      return await prisma.userActivityLog.findMany({
        where: {
          action: {
            startsWith: 'security.'
          }
        },
        orderBy: { timestamp: 'desc' },
        take: limit
      })
    } catch (error) {
      console.error('Failed to fetch security events:', error)
      return []
    }
  }
  
  // Helper methods
  private getClientIP(request: NextRequest): string {
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
  
  private isCriticalSecurityEvent(action: string): boolean {
    const criticalEvents = [
      AuditAction.RATE_LIMIT_EXCEEDED,
      AuditAction.UNAUTHORIZED_ACCESS,
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.INVALID_TOKEN
    ]
    
    return criticalEvents.includes(action as AuditAction)
  }
  
  private async handleCriticalSecurityEvent(entry: AuditLogEntry): Promise<void> {
    // In production, you would:
    // - Send alerts to security team
    // - Trigger automated responses (e.g., temporary IP blocking)
    // - Log to security information and event management (SIEM) system
    
    console.warn('Critical security event detected:', {
      action: entry.action,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      timestamp: entry.timestamp
    })
    
    // Example: If too many failed login attempts, could trigger account lockout
    if (entry.action === AuditAction.LOGIN_FAILED && entry.userId) {
      await this.checkForBruteForceAttack(entry.userId, entry.ipAddress || 'unknown')
    }
  }
  
  private async checkForBruteForceAttack(userId: string, ipAddress: string): Promise<void> {
    try {
      const recentFailures = await prisma.userActivityLog.count({
        where: {
          userId,
          action: AuditAction.LOGIN_FAILED,
          timestamp: {
            gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
          }
        }
      })
      
      if (recentFailures >= 5) {
        // Log suspicious activity
        await this.log({
          userId,
          action: AuditAction.SUSPICIOUS_ACTIVITY,
          details: {
            type: 'brute_force_attempt',
            failedAttempts: recentFailures,
            ipAddress
          },
          ipAddress,
          success: false
        })
      }
    } catch (error) {
      console.error('Failed to check for brute force attack:', error)
    }
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance()

// Helper function for easy logging
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  await auditLogger.log(entry)
}

// Middleware helper for automatic audit logging
export function createAuditMiddleware(action: AuditAction, resource?: string) {
  return async (request: NextRequest, userId?: string, resourceId?: string, details?: Record<string, any>) => {
    await auditLogger.log({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: auditLogger['getClientIP'](request),
      userAgent: request.headers.get('user-agent') || undefined,
      success: true
    })
  }
}