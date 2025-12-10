'use client'

import { CheckCircle, PlayCircle, Clock } from 'lucide-react'

interface OrderStatusToggleProps {
  currentStatus: string
  onStatusChange: (newStatus: string) => Promise<void>
  updating: boolean
}

export default function OrderStatusToggle({
  currentStatus,
  onStatusChange,
  updating
}: OrderStatusToggleProps) {
  const handleMarkAsReady = async () => {
    await onStatusChange('READY')
  }

  const handleStartPreparation = async () => {
    await onStatusChange('IN_PREPARATION')
  }

  const handleMarkAsCompleted = async () => {
    await onStatusChange('COMPLETED')
  }

  return (
    <div className="space-y-3">
      {/* Status transition buttons */}
      <div className="flex flex-wrap gap-2">
        {currentStatus === 'PENDING' && (
          <button
            onClick={handleStartPreparation}
            disabled={updating}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Start Preparation</span>
          </button>
        )}

        {currentStatus === 'IN_PREPARATION' && (
          <button
            onClick={handleMarkAsReady}
            disabled={updating}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark as Ready</span>
          </button>
        )}

        {currentStatus === 'READY' && (
          <button
            onClick={handleMarkAsCompleted}
            disabled={updating}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark as Completed</span>
          </button>
        )}

        {currentStatus === 'COMPLETED' && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium">Order Completed</span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {(currentStatus === 'PENDING' || currentStatus === 'IN_PREPARATION') && (
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={currentStatus === 'READY'}
              onChange={(e) => {
                if (e.target.checked) {
                  handleMarkAsReady()
                }
              }}
              disabled={updating}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-900">
              Quick mark as ready
            </span>
          </label>
        </div>
      )}

      {updating && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4 animate-spin" />
          <span>Updating status...</span>
        </div>
      )}
    </div>
  )
}

