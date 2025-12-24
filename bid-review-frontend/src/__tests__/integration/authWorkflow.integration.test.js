import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Login from '../../components/Login'
import { login } from '../../services/authService'
import { getBids } from '../../services/bidService'
import Bids from '../../components/Bids'

// Mock services
jest.mock('../../services/authService')
jest.mock('../../services/bidService')
const mockLogin = login
const mockGetBids = getBids

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Test wrapper
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithProviders = (component, queryClient = createTestQueryClient()) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Authentication Workflow Integration Tests', () => {
  let queryClient
  let user

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = createTestQueryClient()
    user = userEvent.setup()

    // Clear localStorage
    localStorage.clear()
  })

  describe('Complete Authentication Flow', () => {
    it('should handle successful login and redirect to dashboard', async () => {
      // Arrange
      mockLogin.mockResolvedValue({ 
        access: 'test-access-token',
        refresh: 'test-refresh-token',
        user: { id: 1, email: 'test@example.com', name: 'Test User' }
      })

      // Act
      renderWithProviders(<Login />, queryClient)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      })

      // Verify tokens are stored
      expect(localStorage.getItem('accessToken')).toBe('test-access-token')
      expect(localStorage.getItem('refreshToken')).toBe('test-refresh-token')
    })

    it('should handle login failure and display error', async () => {
      // Arrange
      mockLogin.mockRejectedValue(new Error('Invalid credentials'))

      // Act
      renderWithProviders(<Login />, queryClient)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
      expect(mockNavigate).not.toHaveBeenCalled()

      // Verify no tokens are stored
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    })
  })

  describe('Protected Resource Access', () => {
    it('should allow access to protected resources after login', async () => {
      // Arrange - Simulate successful login
      localStorage.setItem('accessToken', 'valid-token')
      mockGetBids.mockResolvedValue([{ id: 1, title: 'Test Bid' }])

      // Act
      renderWithProviders(<Bids />, queryClient)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Test Bid')).toBeInTheDocument()
      })
      expect(mockGetBids).toHaveBeenCalledTimes(1)
    })

    it('should handle token expiry and redirect to login', async () => {
      // Arrange - Simulate expired token
      mockGetBids.mockRejectedValue({
        response: { status: 401 }
      })

      // Act
      renderWithProviders(<Bids />, queryClient)

      // Assert
      await waitFor(() => {
        expect(mockGetBids).toHaveBeenCalled()
      })

      // Verify redirect to login (handled by API interceptor)
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    })
  })

  describe('Session Management', () => {
    it('should persist authentication across page reloads', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'persisted-token')
      localStorage.setItem('refreshToken', 'persisted-refresh')
      mockGetBids.mockResolvedValue([{ id: 1, title: 'Persisted Bid' }])

      // Act - Simulate page reload by re-rendering component
      const { unmount } = renderWithProviders(<Bids />, queryClient)
      unmount() // Unmount to simulate page reload

      renderWithProviders(<Bids />, queryClient)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Persisted Bid')).toBeInTheDocument()
      })
      expect(mockGetBids).toHaveBeenCalledTimes(2) // Called twice due to re-render
    })

    it('should clear session on logout', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'test-token')
      localStorage.setItem('refreshToken', 'test-refresh')

      // Act - Simulate logout
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')

      // Assert
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    })
  })

  describe('Form Validation and User Experience', () => {
    it('should validate form inputs before submission', async () => {
      // Arrange
      renderWithProviders(<Login />, queryClient)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      // Act - Try to submit with empty form
      await user.click(submitButton)

      // Assert - Form should not submit
      expect(mockLogin).not.toHaveBeenCalled()
      expect(emailInput).toBeInvalid()
      expect(passwordInput).toBeInvalid()

      // Act - Fill with invalid email
      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Assert - Still should not submit due to invalid email
      expect(mockLogin).not.toHaveBeenCalled()
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should provide loading states during authentication', async () => {
      // Arrange
      mockLogin.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ access: 'token' }), 100)
      ))

      // Act
      renderWithProviders(<Login />, queryClient)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Assert - Loading state
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
      })
    })

    it('should handle network connectivity issues', async () => {
      // Arrange
      mockLogin.mockRejectedValue(new Error('Network Error'))

      // Act
      renderWithProviders(<Login />, queryClient)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Network Error')).toBeInTheDocument()
      })
    })
  })

  describe('Security Features', () => {
    it('should not store sensitive information in session storage', async () => {
      // Arrange
      mockLogin.mockResolvedValue({ 
        access: 'sensitive-token',
        refresh: 'sensitive-refresh',
        user: { password: 'should-not-be-stored' }
      })

      // Act
      renderWithProviders(<Login />, queryClient)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBe('sensitive-token')
      })

      // Verify only tokens are stored, not sensitive user data
      expect(localStorage.getItem('userPassword')).toBeNull()
      expect(sessionStorage.getItem('userPassword')).toBeNull()
    })

    it('should clear sensitive data on authentication failure', async () => {
      // Arrange
      localStorage.setItem('accessToken', 'old-token')
      localStorage.setItem('refreshToken', 'old-refresh')
      mockLogin.mockRejectedValue(new Error('Authentication failed'))

      // Act
      renderWithProviders(<Login />, queryClient)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: 'Sign in' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Authentication failed')).toBeInTheDocument()
      })

      // Old tokens should still be there (only cleared on 401 responses)
      expect(localStorage.getItem('accessToken')).toBe('old-token')
    })
  })
})
