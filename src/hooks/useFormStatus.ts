'use client'

import { useState, useCallback } from 'react'

interface FormStatus {
  isLoading: boolean
  error: string | null
  success: boolean
}

interface UseFormStatusReturn extends FormStatus {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSuccess: (success: boolean) => void
  reset: () => void
  handleSubmit: <T>(
    submitFn: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
      successMessage?: string
      errorMessage?: string
    }
  ) => Promise<void>
}

export function useFormStatus(): UseFormStatusReturn {
  const [status, setStatus] = useState<FormStatus>({
    isLoading: false,
    error: null,
    success: false
  })

  const setLoading = useCallback((loading: boolean) => {
    setStatus(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setStatus(prev => ({ ...prev, error, success: false }))
  }, [])

  const setSuccess = useCallback((success: boolean) => {
    setStatus(prev => ({ ...prev, success, error: null }))
  }, [])

  const reset = useCallback(() => {
    setStatus({
      isLoading: false,
      error: null,
      success: false
    })
  }, [])

  const handleSubmit = useCallback(async <T>(
    submitFn: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void
      onError?: (error: Error) => void
      successMessage?: string
      errorMessage?: string
    }
  ) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await submitFn()
      setSuccess(true)
      options?.onSuccess?.(result)
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : options?.errorMessage || 'An unexpected error occurred'
      
      setError(errorMessage)
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError, setSuccess])

  return {
    ...status,
    setLoading,
    setError,
    setSuccess,
    reset,
    handleSubmit
  }
}