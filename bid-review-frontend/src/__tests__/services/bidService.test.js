import axios from 'axios'
import { 
  createBid, 
  getBids, 
  getBidById, 
  updateBid, 
  deleteBid, 
  analyzeBidRequirements 
} from '../../services/bidService'

// Mock the API module
jest.mock('../../services/api')
const mockApi = axios

describe('Bid Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createBid', () => {
    it('should create a bid successfully', async () => {
      // Arrange
      const bidData = { title: 'Test Bid', amount: 1000 }
      const mockResponse = { data: { id: 1, ...bidData } }
      mockApi.post.mockResolvedValue(mockResponse)

      // Act
      const result = await createBid(bidData)

      // Assert
      expect(mockApi.post).toHaveBeenCalledWith('/bids/', bidData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle errors when creating a bid', async () => {
      // Arrange
      const bidData = { title: 'Test Bid' }
      const mockError = new Error('Network error')
      mockApi.post.mockRejectedValue(mockError)

      // Act & Assert
      await expect(createBid(bidData)).rejects.toThrow('Network error')
      expect(mockApi.post).toHaveBeenCalledWith('/bids/', bidData)
    })
  })

  describe('getBids', () => {
    it('should fetch bids successfully without params', async () => {
      // Arrange
      const mockResponse = { 
        data: { 
          results: [{ id: 1, title: 'Bid 1' }],
          count: 1 
        } 
      }
      mockApi.get.mockResolvedValue(mockResponse)

      // Act
      const result = await getBids()

      // Assert
      expect(mockApi.get).toHaveBeenCalledWith('/bids/', { params: {} })
      expect(result).toEqual(mockResponse.data)
    })

    it('should fetch bids successfully with params', async () => {
      // Arrange
      const params = { status: 'pending', page: 1 }
      const mockResponse = { 
        data: { 
          results: [{ id: 1, title: 'Bid 1', status: 'pending' }],
          count: 1 
        } 
      }
      mockApi.get.mockResolvedValue(mockResponse)

      // Act
      const result = await getBids(params)

      // Assert
      expect(mockApi.get).toHaveBeenCalledWith('/bids/', { params })
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle errors when fetching bids', async () => {
      // Arrange
      const mockError = new Error('API error')
      mockApi.get.mockRejectedValue(mockError)

      // Act & Assert
      await expect(getBids()).rejects.toThrow('API error')
      expect(mockApi.get).toHaveBeenCalledWith('/bids/', { params: {} })
    })
  })

  describe('getBidById', () => {
    it('should fetch a bid by ID successfully', async () => {
      // Arrange
      const bidId = 1
      const mockResponse = { 
        data: { id: bidId, title: 'Test Bid' } 
      }
      mockApi.get.mockResolvedValue(mockResponse)

      // Act
      const result = await getBidById(bidId)

      // Assert
      expect(mockApi.get).toHaveBeenCalledWith(`/bids/${bidId}/`)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle errors when fetching a bid by ID', async () => {
      // Arrange
      const bidId = 999
      const mockError = new Error('Bid not found')
      mockApi.get.mockRejectedValue(mockError)

      // Act & Assert
      await expect(getBidById(bidId)).rejects.toThrow('Bid not found')
      expect(mockApi.get).toHaveBeenCalledWith(`/bids/${bidId}/`)
    })
  })

  describe('updateBid', () => {
    it('should update a bid successfully', async () => {
      // Arrange
      const bidId = 1
      const bidData = { title: 'Updated Bid', amount: 2000 }
      const mockResponse = { 
        data: { id: bidId, ...bidData } 
      }
      mockApi.put.mockResolvedValue(mockResponse)

      // Act
      const result = await updateBid(bidId, bidData)

      // Assert
      expect(mockApi.put).toHaveBeenCalledWith(`/bids/${bidId}/`, bidData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle errors when updating a bid', async () => {
      // Arrange
      const bidId = 1
      const bidData = { title: 'Updated Bid' }
      const mockError = new Error('Update failed')
      mockApi.put.mockRejectedValue(mockError)

      // Act & Assert
      await expect(updateBid(bidId, bidData)).rejects.toThrow('Update failed')
      expect(mockApi.put).toHaveBeenCalledWith(`/bids/${bidId}/`, bidData)
    })
  })

  describe('deleteBid', () => {
    it('should delete a bid successfully', async () => {
      // Arrange
      const bidId = 1
      mockApi.delete.mockResolvedValue({})

      // Act
      await deleteBid(bidId)

      // Assert
      expect(mockApi.delete).toHaveBeenCalledWith(`/bids/${bidId}/`)
    })

    it('should handle errors when deleting a bid', async () => {
      // Arrange
      const bidId = 1
      const mockError = new Error('Delete failed')
      mockApi.delete.mockRejectedValue(mockError)

      // Act & Assert
      await expect(deleteBid(bidId)).rejects.toThrow('Delete failed')
      expect(mockApi.delete).toHaveBeenCalledWith(`/bids/${bidId}/`)
    })
  })

  describe('analyzeBidRequirements', () => {
    it('should analyze bid requirements successfully', async () => {
      // Arrange
      const bidId = 1
      const bidData = { requirements: ['Requirement 1', 'Requirement 2'] }
      const mockResponse = { 
        data: { 
          analysis: 'Analysis result',
          score: 85
        } 
      }
      mockApi.post.mockResolvedValue(mockResponse)

      // Act
      const result = await analyzeBidRequirements(bidId, bidData)

      // Assert
      expect(mockApi.post).toHaveBeenCalledWith(`/bids/${bidId}/analyze-requirements/`, bidData)
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle errors when analyzing bid requirements', async () => {
      // Arrange
      const bidId = 1
      const bidData = { requirements: [] }
      const mockError = new Error('Analysis failed')
      mockApi.post.mockRejectedValue(mockError)

      // Act & Assert
      await expect(analyzeBidRequirements(bidId, bidData)).rejects.toThrow('Analysis failed')
      expect(mockApi.post).toHaveBeenCalledWith(`/bids/${bidId}/analyze-requirements/`, bidData)
    })
  })
})
