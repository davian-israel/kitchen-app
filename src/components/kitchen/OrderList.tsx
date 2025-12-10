'use client'

import OrderCard from './OrderCard'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  totalAmount: number
  createdAt: string
  customer: {
    name: string
    email: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    meal: {
      id: string
      name: string
      imageUrl: string
      category: string
    }
  }>
  statusHistory: Array<{
    status: string
    timestamp: string
    notes: string
  }>
}

interface OrderListProps {
  orders: Order[]
  onStatusUpdate: (orderId: string, newStatus: string) => Promise<void>
}

export default function OrderList({ orders, onStatusUpdate }: OrderListProps) {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onStatusUpdate={onStatusUpdate}
        />
      ))}
    </div>
  )
}

