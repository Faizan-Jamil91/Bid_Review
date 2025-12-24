import { testApiConnection } from '../utils/apiTest'
import api from '../services/api'

// Mock the API module
jest.mock('../services/api')
const mockApi = api

describe('API Connection Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('testApiConnection', () => {
    it('should successfully connect to API and return data', async () => {
      // Arrange
      const mockResponse = {
        data: { results: [], count: 0 }
      }
      mockApi.get.mockResolvedValue(mockResponse)

      // Act
      const result = await testApiConnection()

      // Assert
      expect(mockApi.get).toHaveBeenCalledWith('/bids/')
      expect(result).toEqual(mockResponse.data)
    })

    it('should handle API response errors correctly', async () => {
      // Arrange
      const mockError = {
        response: {
          data: { error: 'Not found' },
          status: 404,
          statusText: 'Not Found',
          headers: {}
        }
      }
      mockApi.get.mockRejectedValue(mockError)

      // Act & Assert
      await expect(testApiConnection()).rejects.toThrow()
      expect(mockApi.get).toHaveBeenCalledWith('/bids/')
    })

    it('should handle network errors correctly', async () => {
      // Arrange
      const mockError = {
        request: {},
        message: 'Network Error'
      }
      mockApi.get.mockRejectedValue(mockError)

      // Act & Assert
      await expect(testApiConnection()).rejects.toThrow()
      expect(mockApi.get).toHaveBeenCalledWith('/bids/')
    })

    it('should handle request setup errors correctly', async () => {
      // Arrange
      const mockError = {
        message: 'Request setup failed'
      }
      mockApi.get.mockRejectedValue(mockError)

      // Act & Assert
      await expect(testApiConnection()).rejects.toThrow()
      expect(mockApi.get).toHaveBeenCalledWith('/bids/')
    })
  })
})
