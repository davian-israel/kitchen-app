import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import RegisterPage from '@/app/auth/register/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch for API calls
const mockFetch = jest.fn()
global.fetch = mockFetch

const mockPush = jest.fn()
const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('User Registration E2E', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    })
  })

  it('should complete full registration flow', async () => {
    const user = userEvent.setup()

    // Mock successful registration API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: 'User created successfully',
        user: {
          id: 'user-123',
          email: 'john@example.com',
          name: 'John Doe',
          role: 'CUSTOMER',
        },
      }),
    })

    render(<RegisterPage />)

    // Fill out the registration form
    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'StrongP@ssw0rd!')
    await user.type(confirmPasswordInput, 'StrongP@ssw0rd!')

    // Submit the form
    await user.click(submitButton)

    // Wait for API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'StrongP@ssw0rd!',
          confirmPassword: 'StrongP@ssw0rd!',
        }),
      })
    })

    // Should redirect to sign in page after successful registration
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })
  })

  it('should show validation errors for invalid input', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // Enter invalid data
    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'weak')
    await user.type(confirmPasswordInput, 'different')

    await user.click(submitButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument()
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    })

    // Should not make API call
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should handle registration failure', async () => {
    const user = userEvent.setup()

    // Mock failed registration API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: 'EMAIL_EXISTS',
        message: 'User with this email already exists',
      }),
    })

    render(<RegisterPage />)

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'StrongP@ssw0rd!')
    await user.type(confirmPasswordInput, 'StrongP@ssw0rd!')

    await user.click(submitButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/user with this email already exists/i)).toBeInTheDocument()
    })

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()

    // Mock delayed API response
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 201,
                json: async () => ({
                  success: true,
                  message: 'User created successfully',
                }),
              }),
            100
          )
        )
    )

    render(<RegisterPage />)

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'StrongP@ssw0rd!')
    await user.type(confirmPasswordInput, 'StrongP@ssw0rd!')

    await user.click(submitButton)

    // Should show loading state
    expect(screen.getByText(/creating account/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Wait for completion
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/signin')
    })
  })

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup()

    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<RegisterPage />)

    const nameInput = screen.getByLabelText(/name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'StrongP@ssw0rd!')
    await user.type(confirmPasswordInput, 'StrongP@ssw0rd!')

    await user.click(submitButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should provide password strength feedback', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    const passwordInput = screen.getByLabelText(/^password$/i)

    // Type weak password
    await user.type(passwordInput, 'weak')

    // Should show password strength feedback
    await waitFor(() => {
      expect(screen.getByText(/add uppercase letters/i)).toBeInTheDocument()
      expect(screen.getByText(/add numbers/i)).toBeInTheDocument()
      expect(screen.getByText(/add special characters/i)).toBeInTheDocument()
    })

    // Clear and type strong password
    await user.clear(passwordInput)
    await user.type(passwordInput, 'StrongP@ssw0rd!')

    // Should show strong password indicator
    await waitFor(() => {
      expect(screen.getByText(/strong password/i)).toBeInTheDocument()
    })
  })

  it('should navigate to sign in page when link is clicked', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    const signInLink = screen.getByRole('link', { name: /sign in/i })
    await user.click(signInLink)

    expect(mockPush).toHaveBeenCalledWith('/auth/signin')
  })

  it('should be accessible', () => {
    render(<RegisterPage />)

    // Check for proper form labels
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()

    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()

    // Check for form submission button
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })
})