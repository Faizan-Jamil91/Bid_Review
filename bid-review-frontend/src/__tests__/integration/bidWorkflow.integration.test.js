import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { getBids, createBid, updateBid, deleteBid } from '../../services/bidService'
import Bids from '../../components/Bids'

// Mock the bid service
jest.mock('../../services/bidService')
const mockGetBids = getBids
const mockCreateBid = createBid
const mockUpdateBid = updateBid
const mockDeleteBid = deleteBid

// Mock react-router-dom
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Test wrapper with React Query
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

describe('Bid Workflow Integration Tests', () => {
  let queryClient
  let user

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = createTestQueryClient()
    user = userEvent.setup()
  })

  describe('Complete Bid Management Workflow', () => {
    it('should handle the complete bid lifecycle', async () => {
      // Arrange - Mock API responses
      const initialBids = [
        { id: 1, title: 'Existing Bid', status: 'pending', amount: 1000 }
      ]
      const newBid = { id: 2, title: 'New Bid', status: 'pending', amount: 2000 }
      const updatedBid = { id: 1, title: 'Updated Bid', status: 'approved', amount: 1500 }

      mockGetBids.mockResolvedValue(initialBids)
      mockCreateBid.mockResolvedValue(newBid)
      mockUpdateBid.mockResolvedValue(updatedBid)
      mockDeleteBid.mockResolvedValue()

      // Act & Assert - Initial load
      renderWithProviders(<Bids />, queryClient)

      await waitFor(() => {
        expect(screen.getByText('Existing Bid')).toBeInTheDocument()
      })

      // Verify initial state
      expect(mockGetBids).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Existing Bid')).toBeInTheDocument()
      expect(screen.getByText('$1000')).toBeInTheDocument()

      // Act - Create new bid
      const createButton = screen.getByRole('button', { name: /create bid/i })
      await user.click(createButton)

      // Fill out bid form
      const titleInput = screen.getByLabelText(/title/i)
      const amountInput = screen.getByLabelText(/amount/i)
      const submitButton = screen.getByRole('button', { name: /create/i })

      await user.type(titleInput, 'New Bid')
      await user.type(amountInput, '2000')
      await user.click(submitButton)

      // Assert - Bid created
      await waitFor(() => {
        expect(mockCreateBid).toHaveBeenCalledWith({
          title: 'New Bid',
          amount: 2000
        })
      })

      // Act - Refresh to show new bid
      mockGetBids.mockResolvedValue([...initialBids, newBid])
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      // Assert - New bid appears
      await waitFor(() => {
        expect(screen.getByText('New Bid')).toBeInTheDocument()
        expect(screen.getByText('$2000')).toBeInTheDocument()
      })

      // Act - Update existing bid
      const editButton = screen.getAllByRole('button', { name: /edit/i })[0]
      await user.click(editButton)

      const updateTitleInput = screen.getByDisplayValue('Existing Bid')
      const updateAmountInput = screen.getByDisplayValue('1000')
      const updateButton = screen.getByRole('button', { name: /update/i })

      await user.clear(updateTitleInput)
      await user.type(updateTitleInput, 'Updated Bid')
      await user.clear(updateAmountInput)
      await user.type(updateAmountInput, '1500')
      await user.click(updateButton)

      // Assert - Bid updated
      await waitFor(() => {
        expect(mockUpdateBid).toHaveBeenCalledWith(1, {
          title: 'Updated Bid',
          amount: 1500
        })
      })

      // Act - Delete bid
      mockGetBids.mockResolvedValue([newBid]) // Remove the updated bid from list
      const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0]
      await user.click(deleteButton)

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      // Assert - Bid deleted
      await waitFor(() => {
        expect(mockDeleteBid).toHaveBeenCalledWith(1)
      })

      // Verify final state
      await waitFor(() => {
        expect(screen.queryByText('Updated Bid')).not.toBeInTheDocument()
        expect(screen.getByText('New Bid')).toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully throughout the workflow', async () => {
      // Arrange - Mock error responses
      mockGetBids.mockRejectedValue(new Error('Network error'))
      mockCreateBid.mockRejectedValue(new Error('Creation failed'))
      mockUpdateBid.mockRejectedValue(new Error('Update failed'))
      mockDeleteBid.mockRejectedValue(new Error('Delete failed'))

      // Act & Assert - Initial load error
      renderWithProviders(<Bids />, queryClient)

      await waitFor(() => {
        expect(screen.getByText(/error loading bids/i)).toBeInTheDocument()
      })

      // Act - Try to create bid with error
      const createButton = screen.getByRole('button', { name: /create bid/i })
      await user.click(createButton)

      const titleInput = screen.getByLabelText(/title/i)
      const amountInput = screen.getByLabelText(/amount/i)
      const submitButton = screen.getByRole('button', { name: /create/i })

      await user.type(titleInput, 'Test Bid')
      await user.type(amountInput, '1000')
      await user.click(submitButton)

      // Assert - Creation error
      await waitFor(() => {
        expect(screen.getByText(/creation failed/i)).toBeInTheDocument()
      })

      // Verify error handling
      expect(mockCreateBid).toHaveBeenCalled()
    })
  })

  describe('Real-time Data Updates', () => {
    it('should automatically refresh data when mutations succeed', async () => {
      // Arrange
      const initialBids = [{ id: 1, title: 'Bid 1', status: 'pending' }]
      const updatedBids = [{ id: 1, title: 'Bid 1', status: 'approved' }]

      mockGetBids
        .mockResolvedValueOnce(initialBids)
        .mockResolvedValueOnce(updatedBids)
      mockUpdateBid.mockResolvedValue(updatedBids[0])

      // Act
      renderWithProviders(<Bids />, queryClient)

      await waitFor(() => {
        expect(screen.getByText('Bid 1')).toBeInTheDocument()
        expect(screen.getByText('pending')).toBeInTheDocument()
      })

      // Update bid status
      const editButton = screen.getByRole('button', { name: /edit/i })
      await user.click(editButton)

      // Find status dropdown and change it
      const statusSelect = screen.getByLabelText(/status/i)
      await user.selectOptions(statusSelect, 'approved')
      
      const updateButton = screen.getByRole('button', { name: /update/i })
      await user.click(updateButton)

      // Assert - Data should refresh automatically
      await waitFor(() => {
        expect(screen.getByText('approved')).toBeInTheDocument()
      })

      expect(mockGetBids).toHaveBeenCalledTimes(2) // Initial load + refresh
    })
  })

  describe('User Experience Flow', () => {
    it('should provide loading states during operations', async () => {
      // Arrange - Slow API responses
      mockGetBids.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve([{ id: 1, title: 'Bid 1' }]), 100)
      ))

      // Act
      renderWithProviders(<Bids />, queryClient)

      // Assert - Initial loading state
      expect(screen.getByText(/loading bids/i)).toBeInTheDocument()

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Bid 1')).toBeInTheDocument()
      })

      // Act - Create bid with loading
      mockCreateBid.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ id: 2, title: 'New Bid' }), 100)
      ))

      const createButton = screen.getByRole('button', { name: /create bid/i })
      await user.click(createButton)

      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Assert - Creation loading state
      expect(screen.getByText(/creating/i)).toBeInTheDocument()
    })

    it('should handle empty states appropriately', async () => {
      // Arrange
      mockGetBids.mockResolvedValue([])

      // Act
      renderWithProviders(<Bids />, queryClient)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/no bids found/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create your first bid/i })).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery', () => {
    it('should allow retry after failed operations', async () => {
      // Arrange
      mockGetBids.mockRejectedValueOnce(new Error('Network error'))
      mockGetBids.mockResolvedValue([{ id: 1, title: 'Bid 1' }])

      // Act
      renderWithProviders(<Bids />, queryClient)

      await waitFor(() => {
        expect(screen.getByText(/error loading bids/i)).toBeInTheDocument()
      })

      // Act - Retry
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      // Assert - Success after retry
      await waitFor(() => {
        expect(screen.getByText('Bid 1')).toBeInTheDocument()
      })

      expect(mockGetBids).toHaveBeenCalledTimes(2)
    })
  })
})
