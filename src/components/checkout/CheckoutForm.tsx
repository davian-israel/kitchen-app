'use client'

import { useState } from 'react'
import {
  useStripe,
  useElements,
  PaymentElement,
  AddressElement
} from '@stripe/react-stripe-js'
import { useCart } from '@/contexts/CartContext'

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  deliveryInstructions?: string
}

interface CheckoutFormProps {
  customerInfo: CustomerInfo
  paymentMethod: 'stripe' | 'google-pay'
  isValid: boolean
  onSuccess: () => void
  onError: (error: string) => void
}

export default function CheckoutForm({
  customerInfo,
  paymentMethod,
  isValid,
  onSuccess,
  onError
}: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { state: cartState } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !isValid) {
      return
    }

    setIsProcessing(true)
    onError('')

    try {
      // Create the order first
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartState.items,
          customerInfo,
          totalAmount: cartState.totalAmount,
          paymentMethod: 'stripe'
        }),
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const { orderId } = await orderResponse.json()

      // Confirm the payment
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
          receipt_email: customerInfo.email,
        },
        redirect: 'if_required'
      })

      if (stripeError) {
        if (stripeError.type === 'card_error' || stripeError.type === 'validation_error') {
          onError(stripeError.message || 'Payment failed')
        } else {
          onError('An unexpected error occurred')
        }
      } else {
        // Payment succeeded
        onSuccess()
      }
    } catch (error) {
      console.error('Payment error:', error)
      onError('Payment processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGooglePay = async () => {
    if (!isValid) {
      onError('Please fill in all required fields')
      return
    }

    setIsProcessing(true)
    onError('')

    try {
      // Create the order first
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartState.items,
          customerInfo,
          totalAmount: cartState.totalAmount,
          paymentMethod: 'google-pay'
        }),
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const { orderId } = await orderResponse.json()

      // Process Google Pay payment
      const paymentResponse = await fetch('/api/payments/google-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount: Math.round(cartState.totalAmount * 100),
          currency: 'usd'
        }),
      })

      if (!paymentResponse.ok) {
        throw new Error('Google Pay processing failed')
      }

      onSuccess()
    } catch (error) {
      console.error('Google Pay error:', error)
      onError('Google Pay processing failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (paymentMethod === 'google-pay') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Click the button below to pay with Google Pay. Make sure you have Google Pay set up on your device.
          </p>
        </div>
        
        <button
          onClick={handleGooglePay}
          disabled={!isValid || isProcessing}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            !isValid || isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            'Pay with Google Pay'
          )}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs'
        }}
      />
      
      <div className="pt-4">
        <button
          type="submit"
          disabled={!stripe || !elements || !isValid || isProcessing}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            !stripe || !elements || !isValid || isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </div>
          ) : (
            `Pay $${cartState.totalAmount.toFixed(2)}`
          )}
        </button>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        Your payment information is secure and encrypted. We use Stripe for payment processing.
      </div>
    </form>
  )
}