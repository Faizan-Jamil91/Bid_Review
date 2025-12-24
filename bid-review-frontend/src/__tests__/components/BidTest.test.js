import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import BidTest from '../../components/BidTest'
import { getBids } from '../../services/bidService'

// Mock the bid service
jest.mock('../../services/bidService')
const mockGetBids = getBids

// Test wrapper with React Query
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithQueryClient = (component, queryClient = createTestQueryClient()) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('BidTest Component', () => {
  let queryClient

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = createTestQueryClient()
  })

  it('should render the test component correctly', () => {
    // Act
    renderWithQueryClient(<BidTest />, queryClient)

    // Assert
    expect(screen.getByText('API Test Results')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run API Tests' })).toBeInTheDocument()
  })

  it('should show loading state when tests are running', async () => {
    // Arrange
    mockGetBids.mockImplementation(() => new Promise(() => {})) // Never resolves

    // Act
    renderWithQueryClient(<BidTest />, queryClient)
    const testButton = screen.getByRole('button', { name: 'Run API Tests' })
    fireEvent.click(testButton)

    // Assert
    expect(screen.getByRole('button', { name: 'Testing...' })).toBeInTheDocument()
    expect(testButton).toBeDisabled()
  })

  it('should display successful API test results', async () => {
    // Arrange
    const mockBidData = [
      { id: 1, title: 'Test Bid 1', status: 'pending' },
      { id: 2, title: 'Test Bid 2', status: 'approved' }
    ]
    mockGetBids.mockResolvedValue(mockBidData)

    // Act
    renderWithQueryClient(<BidTest />, queryClient)
    const testButton = screen.getByRole('button', { name: 'Run API Tests' })
    fireEvent.click(testButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Test Results:')).toBeInTheDocument()
    })

    const resultsContainer = screen.getByText('Test Results:').closest('div')
    const preElement = resultsContainer.querySelector('pre')
    const resultsText = preElement.textContent

    expect(resultsText).toContain('apiCall')
    expect(resultsText).toContain('success": true')
    expect(resultsText).toContain('isArray": true')
    expect(resultsText).toContain('hasResults')
    expect(resultsText).toContain('hasData')
  })

  it('should handle API errors gracefully', async () => {
    // Arrange
    const mockError = {
      message: 'Network error',
      response: {
        status: 500,
        statusText: 'Internal Server Error',
        data: { error: 'Server error' }
      }
    }
    mockGetBids.mockRejectedValue(mockError)

    // Act
    renderWithQueryClient(<BidTest />, queryClient)
    const testButton = screen.getByRole('button', { name: 'Run API Tests' })
    fireEvent.click(testButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Test Results:')).toBeInTheDocument()
    })

    const resultsContainer = screen.getByText('Test Results:').closest('div')
    const preElement = resultsContainer.querySelector('pre')
    const resultsText = preElement.textContent

    expect(resultsText).toContain('error')
    expect(resultsText).toContain('Network error')
    expect(resultsText).toContain('500')
    expect(resultsText).toContain('Internal Server Error')
  })

  it('should test different response formats', async () => {
    // Arrange - Test with results format
    const mockResponseWithResults = {
      results: [
        { id: 1, title: 'Test Bid' }
      ]
    }
    mockGetBids.mockResolvedValue(mockResponseWithResults)

    // Act
    renderWithQueryClient(<BidTest />, queryClient)
    const testButton = screen.getByRole('button', { name: 'Run API Tests' })
    fireEvent.click(testButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Test Results:')).toBeInTheDocument()
    })

    const resultsContainer = screen.getByText('Test Results:').closest('div')
    const preElement = resultsContainer.querySelector('pre')
    const resultsText = preElement.textContent

    expect(resultsText).toContain('hasResults')
    expect(resultsText).toContain('success": true')
    expect(resultsText).toContain('length": 1')
  })

  it('should test data format response', async () => {
    // Arrange - Test with data format
    const mockResponseWithData = {
      data: [
        { id: 1, title: 'Test Bid' }
      ]
    }
    mockGetBids.mockResolvedValue(mockResponseWithData)

    // Act
    renderWithQueryClient(<BidTest />, queryClient)
    const testButton = screen.getByRole('button', { name: 'Run API Tests' })
    fireEvent.click(testButton)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Test Results:')).toBeInTheDocument()
    })

    const resultsContainer = screen.getByText('Test Results:').closest('div')
    const preElement = resultsContainer.querySelector('pre')
    const resultsText = preElement.textContent

    expect(resultsText).toContain('hasData')
    expect(resultsText).toContain('success": true')
    expect(resultsText).toContain('length": 1')
  })
})
