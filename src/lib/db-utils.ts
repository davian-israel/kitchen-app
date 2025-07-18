import { db } from './db'

export async function getUsers() {
  return await db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })
}

export async function getMeals() {
  return await db.meal.findMany({
    where: { available: true },
    orderBy: { category: 'asc' },
  })
}

export async function getInventoryItems() {
  return await db.inventoryItem.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getUserByEmail(email: string) {
  return await db.user.findUnique({
    where: { email },
  })
}

export async function createUser(data: {
  email: string
  name?: string
  passwordHash: string
  role?: 'CUSTOMER' | 'ADMIN'
}) {
  return await db.user.create({
    data,
  })
}

export async function logUserActivity(
  userId: string,
  action: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string
) {
  return await db.userActivityLog.create({
    data: {
      userId,
      action,
      details,
      ipAddress,
      userAgent,
    },
  })
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'DISABLED') {
  return await db.user.update({
    where: { id: userId },
    data: { status },
  })
}