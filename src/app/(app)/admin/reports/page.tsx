'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye
} from 'lucide-react'
import ResponsiveHeader from '@/components/navigation/ResponsiveHeader'

interface ReportData {
  salesReport: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    revenueGrowth: number
    ordersGrowth: number
    dailySales: Array<{
      date: string
      revenue: number
      orders: number
    }>
    topMeals: Array<{
      id: string
      name: string
      category: string
      totalSold: number
      revenue: number
    }>
  }
  inventoryReport: {
    totalItems: number
    lowStockItems: number
    expiredItems: number
    totalValue: number
    usagePatterns: Array<{
      itemName: string
      category: string
      used: number
      wasted: number
      efficiency: number
    }>
    costAnalysis: Array<{
      category: string
      totalCost: number
      averageCost: number
      items: number
    }>
  }
  performanceMetrics: {
    averagePreparationTime: number
    orderCompletionRate: number
    customerSatisfaction: number
    kitchenEfficiency: number
    peakHours: Array<{
      hour: number
      orders: number
    }>
    preparationTimes: Array<{
      mealName: string
      averageTime: number
      category: string
    }>
  }
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState('7d')
  const [selectedReport, setSelectedReport] = useState<'sales' | 'inventory' | 'performance'>('sales')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin')
    }
  }, [status])

  useEffect(() => {
    if (session) {
      // Check if user is admin
      if (session.user.role !== 'ADMIN') {
        redirect('/dashboard')
      } else {
        fetchReports()
      }
    }
  }, [session, selectedDateRange])

  const fetchReports = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/admin/reports?range=${selectedDateRange}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
        setError('')
      } else {
        setError('Failed to fetch reports')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      setError('Failed to load reports')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const exportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      const response = await fetch(`/api/admin/reports/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: selectedReport,
          dateRange: selectedDateRange,
          format
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedReport}-report-${selectedDateRange}.${format}`
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        setError('Failed to export report')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      setError('Failed to export report')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 90 Days'
      case '1y': return 'Last Year'
      default: return 'Custom Range'
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <ResponsiveHeader title="Israel Kitchen - Reports" showCart={false} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
            <p className="text-gray-600">Business insights and performance metrics</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Date Range Selector */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchReports}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    exportReport(e.target.value as 'pdf' | 'csv' | 'excel')
                    e.target.value = ''
                  }
                }}
                className="appearance-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium cursor-pointer"
              >
                <option value="">Export Report</option>
                <option value="pdf">Export as PDF</option>
                <option value="csv">Export as CSV</option>
                <option value="excel">Export as Excel</option>
              </select>
              <Download className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Report Type Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'sales', label: 'Sales Report', icon: DollarSign },
                { key: 'inventory', label: 'Inventory Report', icon: Package },
                { key: 'performance', label: 'Performance Metrics', icon: BarChart3 }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSelectedReport(key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    selectedReport === key
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {reportData && (
          <>
            {/* Sales Report */}
            {selectedReport === 'sales' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(reportData.salesReport.totalRevenue)}
                        </p>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className={`text-xs ${reportData.salesReport.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(reportData.salesReport.revenueGrowth)} vs previous period
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <Package className="w-8 h-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.salesReport.totalOrders}
                        </p>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className={`text-xs ${reportData.salesReport.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(reportData.salesReport.ordersGrowth)} vs previous period
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(reportData.salesReport.averageOrderValue)}
                        </p>
                        <p className="text-sm text-gray-600">Average Order Value</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <Calendar className="w-8 h-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {getDateRangeLabel(selectedDateRange)}
                        </p>
                        <p className="text-sm text-gray-600">Report Period</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Selling Meals */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Meals</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Meal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity Sold
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.salesReport.topMeals.map((meal, index) => (
                          <tr key={meal.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-orange-600 font-bold text-sm">#{index + 1}</span>
                                </div>
                                <div className="text-sm font-medium text-gray-900">{meal.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {meal.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {meal.totalSold}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(meal.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Report */}
            {selectedReport === 'inventory' && (
              <div className="space-y-6">
                {/* Inventory Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <Package className="w-8 h-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.inventoryReport.totalItems}
                        </p>
                        <p className="text-sm text-gray-600">Total Items</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <TrendingUp className="w-8 h-8 text-red-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.inventoryReport.lowStockItems}
                        </p>
                        <p className="text-sm text-gray-600">Low Stock Items</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <Calendar className="w-8 h-8 text-orange-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.inventoryReport.expiredItems}
                        </p>
                        <p className="text-sm text-gray-600">Expired Items</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(reportData.inventoryReport.totalValue)}
                        </p>
                        <p className="text-sm text-gray-600">Total Value</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Patterns */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Patterns & Waste Analysis</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Used
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Wasted
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Efficiency
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.inventoryReport.usagePatterns.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.itemName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.used}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.wasted}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      item.efficiency >= 80 ? 'bg-green-500' : 
                                      item.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${item.efficiency}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-900">{item.efficiency.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {selectedReport === 'performance' && (
              <div className="space-y-6">
                {/* Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.performanceMetrics.averagePreparationTime.toFixed(1)} min
                        </p>
                        <p className="text-sm text-gray-600">Avg Preparation Time</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.performanceMetrics.orderCompletionRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">Order Completion Rate</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <Users className="w-8 h-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.performanceMetrics.customerSatisfaction.toFixed(1)}/5
                        </p>
                        <p className="text-sm text-gray-600">Customer Satisfaction</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center">
                      <Package className="w-8 h-8 text-orange-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {reportData.performanceMetrics.kitchenEfficiency.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">Kitchen Efficiency</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preparation Times by Meal */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Preparation Times</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Meal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Average Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Performance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.performanceMetrics.preparationTimes.map((meal, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {meal.mealName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {meal.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {meal.averageTime.toFixed(1)} minutes
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                meal.averageTime <= 15 ? 'bg-green-100 text-green-800' :
                                meal.averageTime <= 25 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {meal.averageTime <= 15 ? 'Excellent' :
                                 meal.averageTime <= 25 ? 'Good' : 'Needs Improvement'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}