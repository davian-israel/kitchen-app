import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Previous period for comparison
    const periodLength = now.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - periodLength)
    const previousEndDate = new Date(startDate.getTime())

    // Fetch orders for current period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
        status: {
          not: 'CANCELLED'
        }
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

    // Fetch orders for previous period (for comparison)
    const previousOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
        status: {
          not: 'CANCELLED'
        }
      },
    })

    // Calculate sales metrics
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    const previousOrderCount = previousOrders.length

    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const ordersGrowth = previousOrderCount > 0 ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 : 0

    // Calculate daily sales
    const dailySales = []
    const daysInRange = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    for (let i = 0; i < daysInRange; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      
      const dayOrders = orders.filter(order => 
        order.createdAt >= dayStart && order.createdAt <= dayEnd
      )
      
      dailySales.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
        orders: dayOrders.length
      })
    }

    // Calculate top meals
    const mealStats = new Map()
    orders.forEach(order => {
      order.items.forEach(item => {
        const mealId = item.meal.id
        if (!mealStats.has(mealId)) {
          mealStats.set(mealId, {
            id: mealId,
            name: item.meal.name,
            category: item.meal.category,
            totalSold: 0,
            revenue: 0
          })
        }
        const stats = mealStats.get(mealId)
        stats.totalSold += item.quantity
        stats.revenue += Number(item.price) * item.quantity
      })
    })

    const topMeals = Array.from(mealStats.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10)

    // Fetch inventory data
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        transactions: {
          where: {
            timestamp: {
              gte: startDate,
              lte: now,
            },
          },
        },
      },
    })

    const totalItems = inventoryItems.length
    const lowStockItems = inventoryItems.filter(item => 
      item.minThreshold && Number(item.quantity) <= Number(item.minThreshold)
    ).length

    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const expiredItems = inventoryItems.filter(item => 
      item.expirationDate && item.expirationDate <= sevenDaysFromNow
    ).length

    const totalValue = inventoryItems.reduce((sum, item) => 
      sum + (Number(item.cost) || 0) * Number(item.quantity), 0
    )

    // Calculate usage patterns
    const usagePatterns = inventoryItems.map(item => {
      const used = item.transactions
        .filter(t => ['STOCK_OUT', 'EXPIRED', 'WASTE'].includes(t.type))
        .reduce((sum, t) => sum + Number(t.quantity), 0)
      
      const wasted = item.transactions
        .filter(t => ['EXPIRED', 'WASTE'].includes(t.type))
        .reduce((sum, t) => sum + Number(t.quantity), 0)
      
      const efficiency = used > 0 ? ((used - wasted) / used) * 100 : 100

      return {
        itemName: item.name,
        category: item.category,
        used,
        wasted,
        efficiency
      }
    }).slice(0, 10)

    // Calculate cost analysis by category
    const categoryStats = new Map()
    inventoryItems.forEach(item => {
      if (!categoryStats.has(item.category)) {
        categoryStats.set(item.category, {
          category: item.category,
          totalCost: 0,
          items: 0
        })
      }
      const stats = categoryStats.get(item.category)
      stats.totalCost += (Number(item.cost) || 0) * Number(item.quantity)
      stats.items += 1
    })

    const costAnalysis = Array.from(categoryStats.values()).map(stats => ({
      ...stats,
      averageCost: stats.items > 0 ? stats.totalCost / stats.items : 0
    }))

    // Calculate performance metrics
    const completedOrders = orders.filter(order => order.status === 'COMPLETED')
    const orderCompletionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0

    // Calculate average preparation time
    const preparationTimes = completedOrders.map(order => {
      const createdAt = new Date(order.createdAt)
      const completedStatus = order.statusHistory.find(h => h.status === 'COMPLETED')
      if (completedStatus) {
        const completedAt = new Date(completedStatus.timestamp)
        return (completedAt.getTime() - createdAt.getTime()) / (1000 * 60) // minutes
      }
      return 0
    }).filter(time => time > 0)

    const averagePreparationTime = preparationTimes.length > 0 
      ? preparationTimes.reduce((sum, time) => sum + time, 0) / preparationTimes.length 
      : 0

    // Mock some additional metrics (in a real app, these would come from actual data)
    const customerSatisfaction = 4.2 // This would come from customer feedback
    const kitchenEfficiency = Math.min(100, Math.max(0, 100 - (averagePreparationTime - 20) * 2))

    // Calculate peak hours
    const hourlyStats = new Map()
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours()
      hourlyStats.set(hour, (hourlyStats.get(hour) || 0) + 1)
    })

    const peakHours = Array.from(hourlyStats.entries())
      .map(([hour, orders]) => ({ hour, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 6)

    // Calculate preparation times by meal
    const mealPreparationTimes = Array.from(mealStats.values()).map(meal => ({
      mealName: meal.name,
      category: meal.category,
      averageTime: 15 + Math.random() * 20 // Mock data - in real app, calculate from actual times
    })).slice(0, 10)

    const reportData = {
      salesReport: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        revenueGrowth,
        ordersGrowth,
        dailySales,
        topMeals
      },
      inventoryReport: {
        totalItems,
        lowStockItems,
        expiredItems,
        totalValue,
        usagePatterns,
        costAnalysis
      },
      performanceMetrics: {
        averagePreparationTime,
        orderCompletionRate,
        customerSatisfaction,
        kitchenEfficiency,
        peakHours,
        preparationTimes: mealPreparationTimes
      }
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}