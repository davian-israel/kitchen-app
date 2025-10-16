'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trash2, Heart, AlertCircle, Package } from 'lucide-react'
import { CartItem as CartItemType } from '@/contexts/CartContext'
import QuantityControls from './QuantityControls'

interface EnhancedCartItem extends CartItemType {
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock'
  maxQuantity?: number
  lastUpdated?: Date
  savedForLater?: boolean
}

interface CartItemProps {
  item: EnhancedCartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onSaveForLater?: (id: string) => void
  onMoveToCart?: (id: string) => void
  isUpdating?: boolean
}

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onSaveForLater,
  onMoveToCart,
  isUpdating = false
}: CartItemProps) {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [imageError, setImageError] = useState(false)

  const {
    id,
    name,
    price,
    quantity,
    imageUrl,
    category,
    availability = 'in_stock',
    maxQuantity = 99,
    savedForLater = false
  } = item

  const itemTotal = price * quantity

  const handleRemoveClick = () => {
    setShowRemoveConfirm(true)
  }

  const handleConfirmRemove = () => {
    onRemoveItem(id)
    setShowRemoveConfirm(false)
  }

  const handleCancelRemove = () => {
    setShowRemoveConfirm(false)
  }

  const handleQuantityChange = (newQuantity: number) => {
    onUpdateQuantity(id, newQuantity)
  }

  const handleSaveForLater = () => {
    if (onSaveForLater) {
      onSaveForLater(id)
    }
  }

  const handleMoveToCart = () => {
    if (onMoveToCart) {
      onMoveToCart(id)
    }
  }

  const getAvailabilityInfo = () => {
    switch (availability) {
      case 'low_stock':
        return {
          icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
          text: 'Low stock',
          className: 'text-yellow-600 bg-yellow-50 border-yellow-200'
        }
      case 'out_of_stock':
        return {
          icon: <Package className="w-4 h-4 text-red-600" />,
          text: 'Out of stock',
          className: 'text-red-600 bg-red-50 border-red-200'
        }
      default:
        return null
    }
  }

  const availabilityInfo = getAvailabilityInfo()
  const isOutOfStock = availability === 'out_of_stock'

  return (
    <div className={`
      relative bg-white rounded-lg border p-4 transition-all duration-200
      ${isUpdating ? 'opacity-60 pointer-events-none' : ''}
      ${isOutOfStock ? 'bg-gray-50 border-gray-200' : 'border-gray-200 hover:shadow-md'}
      ${savedForLater ? 'border-blue-200 bg-blue-50' : ''}
    `}>
      {/* Loading Overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Item Image */}
        <div className="flex-shrink-0">
          <div className="relative w-full sm:w-24 h-32 sm:h-24 rounded-md overflow-hidden bg-gray-100">
            {imageUrl && !imageError ? (
              <Image
                src={imageUrl}
                alt={name}
                fill={true}
                className={`object-cover transition-opacity duration-200 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`}
                onError={() => setImageError(true)}
                sizes="(max-width: 640px) 100vw, 96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-8 h-8" />
                <span className="sr-only">No image available</span>
              </div>
            )}
            
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
                <span className="text-white text-xs font-medium px-2 py-1 bg-red-600 rounded">
                  Out of Stock
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Item Details */}
        <div className="flex-grow min-w-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-grow">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-grow">
                  <h3 className={`text-lg font-semibold truncate ${isOutOfStock ? 'text-gray-500' : 'text-gray-900'}`}>
                    {name}
                  </h3>
                  <p className={`text-sm ${isOutOfStock ? 'text-gray-400' : 'text-gray-600'}`}>
                    {category}
                  </p>
                </div>
                
                {/* Price */}
                <div className="text-right ml-4">
                  <p className={`text-lg font-semibold ${isOutOfStock ? 'text-gray-500' : 'text-orange-600'}`}>
                    ${price.toFixed(2)}
                  </p>
                  {quantity > 1 && (
                    <p className="text-sm text-gray-500">
                      ${itemTotal.toFixed(2)} total
                    </p>
                  )}
                </div>
              </div>

              {/* Availability Status */}
              {availabilityInfo && (
                <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs font-medium mb-3 ${availabilityInfo.className}`}>
                  {availabilityInfo.icon}
                  {availabilityInfo.text}
                </div>
              )}

              {/* Saved for Later Badge */}
              {savedForLater && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium mb-3">
                  <Heart className="w-3 h-3" />
                  Saved for Later
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-4">
              {savedForLater ? (
                /* Saved for Later Controls */
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMoveToCart}
                    disabled={isOutOfStock}
                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Move to Cart
                  </button>
                </div>
              ) : (
                /* Regular Cart Controls */
                <QuantityControls
                  quantity={quantity}
                  maxQuantity={Math.min(maxQuantity, isOutOfStock ? 0 : 99)}
                  onQuantityChange={handleQuantityChange}
                  disabled={isOutOfStock || isUpdating}
                  size="md"
                />
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                {!savedForLater && onSaveForLater && (
                  <button
                    onClick={handleSaveForLater}
                    disabled={isUpdating}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save for Later"
                    aria-label="Save item for later"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                )}

                {/* Remove Button */}
                {!showRemoveConfirm ? (
                  <button
                    onClick={handleRemoveClick}
                    disabled={isUpdating}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove Item"
                    aria-label="Remove item from cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  /* Remove Confirmation */
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Remove?</span>
                    <button
                      onClick={handleConfirmRemove}
                      className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded"
                    >
                      Yes
                    </button>
                    <button
                      onClick={handleCancelRemove}
                      className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}