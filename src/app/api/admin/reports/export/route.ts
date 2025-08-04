import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db as prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    const { reportType, dateRange, format } = await request.json()

    // For this implementation, we'll generate CSV format
    // In a real application, you would use libraries like:
    // - jsPDF for PDF generation
    // - xlsx for Excel files
    // - csv-writer for CSV files

    let csvContent = ''
    let filename = `${reportType}-report-${dateRange}.csv`

    // Calculate date range for data fetching
    const now = new Date()
    let startDate = new Date()
    
    switch (dateRange) {
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

    if (reportType === 'sales') {
      // Fetch sales data
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
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Generate CSV for sales report
      csvContent = 'Order Number,Date,Customer,Total Amount,Status,Items\n'
      
      orders.forEach(order => {
        const items = order.items.map(item => `${item.meal.name} (${item.quantity})`).join('; ')
        csvContent += `"${order.orderNumber}","${order.createdAt.toISOString().split('T')[0]}","${order.customer.name || order.customer.email}","$${order.totalAmount}","${order.status}","${items}"\n`
      })

    } else if (reportType === 'inventory') {
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
            orderBy: {
              timestamp: 'desc',
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      })

      // Generate CSV for inventory report
      csvContent = 'Item Name,Category,Current Quantity,Unit,Min Threshold,Expiration Date,Cost,Total Value,Recent Transactions\n'
      
      inventoryItems.forEach(item => {
        const totalValue = (Number(item.cost) || 0) * Number(item.quantity)
        const recentTransactions = item.transactions.slice(0, 3).map(t => 
          `${t.type}: ${t.quantity} (${t.timestamp.toISOString().split('T')[0]})`
        ).join('; ')
        
        csvContent += `"${item.name}","${item.category}","${item.quantity}","${item.unit}","${item.minThreshold || 'N/A'}","${item.expirationDate ? item.expirationDate.toISOString().split('T')[0] : 'N/A'}","$${item.cost || 0}","$${totalValue.toFixed(2)}","${recentTransactions}"\n`
      })

    } else if (reportType === 'performance') {
      // Fetch performance data
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: now,
          },
          status: 'COMPLETED'
        },
        include: {
          items: {
            include: {
              meal: true,
            },
          },
          statusHistory: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Generate CSV for performance report
      csvContent = 'Order Number,Date,Preparation Time (minutes),Items Count,Customer Satisfaction\n'
      
      orders.forEach(order => {
        const createdAt = new Date(order.createdAt)
        const completedStatus = order.statusHistory.find(h => h.status === 'COMPLETED')
        let preparationTime = 0
        
        if (completedStatus) {
          const completedAt = new Date(completedStatus.timestamp)
          preparationTime = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60) // minutes
        }
        
        const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
        const satisfaction = (4 + Math.random()).toFixed(1) // Mock satisfaction score
        
        csvContent += `"${order.orderNumber}","${order.createdAt.toISOString().split('T')[0]}","${preparationTime.toFixed(1)}","${itemsCount}","${satisfaction}"\n`
      })
    }

    // Handle different export formats
    if (format === 'pdf') {
      // In a real implementation, you would generate a PDF here
      // For now, we'll return a message indicating PDF generation would happen
      return NextResponse.json({
        message: 'PDF export would be generated here using a library like jsPDF or Puppeteer'
      })
    } else if (format === 'excel') {
      // In a real implementation, you would generate an Excel file here
      // For now, we'll return the CSV with Excel MIME type
      const response = new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="${filename.replace('.csv', '.xls')}"`,
        },
      })
      return response
    } else {
      // Default to CSV
      const response = new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
      return response
    }

  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}