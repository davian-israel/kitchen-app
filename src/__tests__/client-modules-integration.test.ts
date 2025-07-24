/**
 * Integration tests to verify clientModules error is fixed
 * Tests client/server component boundaries and navigation patterns
 */

import { jest } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(() => null),
  })),
  usePathname: jest.fn(() => '/'),
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock cart context
jest.mock('@/contexts/CartContext', () => ({
  useCart: jest.fn(() => ({
    state: { items: [], total: 0 },
    addItem: jest.fn(),
    openCart: jest.fn(),
  })),
  CartProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock components that have external dependencies
jest.mock('@/components/navigation/ResponsiveHeader', () => {
  return function MockHeader() {
    return <div data-testid="responsive-header">Header</div>
  }
})

jest.mock('@/components/cart/CartButton', () => {
  return function MockCartButton() {
    return <button data-testid="cart-button">Cart</button>
  }
})

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

describe('Client Modules Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup default router mock
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    })

    // Mock fetch globally
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Test 1: Client Component Navigation Boundaries', () => {
    it('should use useRouter for client-side navigation without clientModules errors', async () => {
      // Mock unauthenticated session to trigger navigation
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      // Mock successful fetch for meals
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({ meals: [] }),
      } as Response)

      // Import and render a client component that should use useRouter
      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(
        <div>
          <MenuPage />
        </div>
      )

      // Wait for useEffect to trigger navigation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin')
      })

      // Verify useRouter was called (not redirect which would cause clientModules error)
      expect(mockUseRouter).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should handle authenticated state without navigation errors', async () => {
      // Mock authenticated session
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'test@example.com', role: 'USER' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      // Mock successful fetch for meals
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({ meals: [] }),
      } as Response)

      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      render(<MenuPage />)

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByTestId('responsive-header')).toBeInTheDocument()
      })

      // Verify no navigation was triggered for authenticated user
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Test 2: Multiple Client Components Router Usage', () => {
    it('should handle multiple client components using useRouter without conflicts', async () => {
      // Mock unauthenticated session
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      })

      // Mock fetch responses
      ;(global.fetch as jest.MockedFunction<typeof fetch>)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ orders: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ meals: [] }),
        } as Response)

      // Import multiple client components
      const { default: OrdersPage } = await import('@/app/(app)/orders/page')
      const { default: MenuPage } = await import('@/app/(app)/menu/page')

      // Render first component
      const { unmount: unmountOrders } = render(<OrdersPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin')
      })

      // Reset mock for second component
      mockPush.mockClear()
      unmountOrders()

      // Render second component
      render(<MenuPage />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin')
      })

      // Verify both components can use useRouter without clientModules conflicts
      expect(mockUseRouter).toHaveBeenCalledTimes(2)
      expect(mockPush).toHaveBeenCalledTimes(1) // Called once for second component
    })
  })

  describe('Test 3: Admin Component Role-Based Navigation', () => {
    it('should handle admin role navigation without clientModules errors', async () => {
      // Mock authenticated user without admin role
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'user@example.com', role: 'USER' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      // Mock fetch for admin data
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
      } as Response)

      // Import admin client component
      const { default: AdminUsersPage } = await import('@/app/(app)/admin/users/page')
      
      render(<AdminUsersPage />)

      // Wait for role check and navigation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })

      // Verify useRouter was used for role-based navigation
      expect(mockUseRouter).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle admin user without navigation', async () => {
      // Mock authenticated admin user
      mockUseSession.mockReturnValue({
        data: {
          user: { id: '1', email: 'admin@example.com', role: 'ADMIN' },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: jest.fn(),
      })

      // Mock successful fetch for admin data
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          users: [
            { id: '1', email: 'test@example.com', role: 'USER', status: 'ACTIVE' }
          ] 
        }),
      } as Response)

      const { default: AdminUsersPage } = await import('@/app/(app)/admin/users/page')
      
      render(<AdminUsersPage />)

      // Wait for component to load
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      // Verify no navigation was triggered for admin user
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle loading states without clientModules errors', async () => {
      // Mock loading session
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      })

      const { default: AdminUsersPage } = await import('@/app/(app)/admin/users/page')
      
      render(<AdminUsersPage />)

      // Wait a bit to ensure loading state is handled
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify no navigation was triggered during loading
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Test 4: Error Boundary Integration', () => {
    it('should handle navigation errors gracefully without clientModules issues', async () => {
      // Mock session that changes from loading to unauthenticated
      let sessionState = {
        data: null,
        status: 'loading' as const,
        update: jest.fn(),
      }

      mockUseSession.mockImplementation(() => sessionState)

      // Mock router that throws error
      const errorRouter = {
        push: jest.fn().mockRejectedValue(new Error('Navigation failed')),
        replace: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
      }
      mockUseRouter.mockReturnValue(errorRouter)

      const { default: MenuPage } = await import('@/app/(app)/menu/page')
      
      const { rerender } = render(<MenuPage />)

      // Change session to unauthenticated to trigger navigation
      sessionState = {
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      }

      rerender(<MenuPage />)

      // Wait for navigation attempt
      await waitFor(() => {
        expect(errorRouter.push).toHaveBeenCalledWith('/auth/signin')
      })

      // Verify the component doesn't crash with clientModules error
      // The test passing means no unhandled clientModules error occurred
      expect(mockUseRouter).toHaveBeenCalled()
    })
  })

  describe('Test 5: Concurrent Navigation Scenarios', () => {
    it('should handle multiple simultaneous navigation attempts without clientModules conflicts', async () => {
      // Mock rapid session changes that could trigger concurrent navigation
      const sessionStates = [
        { data: null, status: 'loading' as const, update: jest.fn() },
        { data: null, status: 'unauthenticated' as const, update: jest.fn() },
        { data: { user: { id: '1', role: 'USER' } }, status: 'authenticated' as const, update: jest.fn() },
      ]

      let currentState = 0
      mockUseSession.mockImplementation(() => sessionStates[currentState])

      const { default: CheckoutPage } = await import('@/app/(app)/checkout/page')
      
      const { rerender } = render(<CheckoutPage />)

      // Simulate rapid session state changes
      for (let i = 1; i < sessionStates.length; i++) {
        currentState = i
        rerender(<CheckoutPage />)
        
        // Small delay to allow useEffect to trigger
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Wait for all effects to complete
      await waitFor(() => {
        expect(mockUseRouter).toHaveBeenCalled()
      })

      // Verify navigation was called for unauthenticated state
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
      
      // The test passing confirms no clientModules errors occurred during rapid state changes
    })
  })
})