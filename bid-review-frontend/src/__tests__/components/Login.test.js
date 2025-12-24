import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../../components/Login'
import { login } from '../../services/authService'

// Mock the auth service
jest.mock('../../services/authService')
const mockLogin = login

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  )
}

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the login form correctly', () => {
    // Act
    renderWithRouter(<Login />)

    // Assert
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('should update email and password fields when user types', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithRouter(<Login />)

    // Act
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Assert
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('should call login service and navigate on successful login', async () => {
    // Arrange
    const user = userEvent.setup()
    mockLogin.mockResolvedValue()

    renderWithRouter(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    // Act
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should display error message on login failure', async () => {
    // Arrange
    const user = userEvent.setup()
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValue(new Error(errorMessage))

    renderWithRouter(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    // Act
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should display default error message when error has no message', async () => {
    // Arrange
    const user = userEvent.setup()
    const error = new Error()
    error.message = undefined
    mockLogin.mockRejectedValue(error)

    renderWithRouter(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    // Act
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument()
    })
  })

  it('should show loading state during login attempt', async () => {
    // Arrange
    const user = userEvent.setup()
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    renderWithRouter(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    // Act
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Assert
    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()

    // Wait for the login to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    })
  })

  it('should clear error message when user starts typing again', async () => {
    // Arrange
    const user = userEvent.setup()
    mockLogin.mockRejectedValue(new Error('Login failed'))

    renderWithRouter(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    // First, trigger an error
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Login failed')).toBeInTheDocument()
    })

    // Act - clear the error by typing
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')

    // Assert
    expect(screen.queryByText('Login failed')).not.toBeInTheDocument()
  })

  it('should submit form when Enter key is pressed in password field', async () => {
    // Arrange
    const user = userEvent.setup()
    mockLogin.mockResolvedValue()

    renderWithRouter(<Login />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    // Act
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123{enter}')

    // Assert
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should have proper form accessibility attributes', () => {
    // Act
    renderWithRouter(<Login />)

    // Assert
    expect(screen.getByRole('form')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText(/email address/i)).toBeRequired()
    expect(screen.getByLabelText(/password/i)).toBeRequired()
  })
})
