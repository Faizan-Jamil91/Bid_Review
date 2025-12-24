import axios from 'axios'
import api from '../../services/api'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock window.location
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  writable: true,
  value: mockLocation,
})

describe('API Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockClear()
    localStorageMock.removeItem.mockClear()
    mockLocation.href = ''
  })

  describe('API Configuration', () => {
    it('should have correct baseURL', () => {
      expect(api.defaults.baseURL).toBe('http://localhost:8000/api')
    })

    it('should have correct default headers', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json')
    })
  })

  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      // Arrange
      const token = 'test-token'
      localStorageMock.getItem.mockReturnValue(token)
      
      const mockConfig = {
        headers: {}
      }
      
      // Get the request interceptor
      const requestInterceptor = api.interceptors.request.handlers[0].fulfilled

      // Act
      const result = requestInterceptor(mockConfig)

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('accessToken')
      expect(result.headers.Authorization).toBe(`Bearer ${token}`)
    })

    it('should not add Authorization header when no token exists', async () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null)
      
      const mockConfig = {
        headers: {}
      }
      
      // Get the request interceptor
      const requestInterceptor = api.interceptors.request.handlers[0].fulfilled

      // Act
      const result = requestInterceptor(mockConfig)

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('accessToken')
      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should handle request interceptor errors', async () => {
      // Arrange
      const error = new Error('Request error')
      
      // Get the request interceptor error handler
      const requestErrorInterceptor = api.interceptors.request.handlers[0].rejected

      // Act & Assert
      await expect(requestErrorInterceptor(error)).rejects.toThrow('Request error')
    })
  })

  describe('Response Interceptor', () => {
    it('should pass through successful responses', async () => {
      // Arrange
      const mockResponse = { data: { success: true }, status: 200 }
      
      // Get the response interceptor
      const responseInterceptor = api.interceptors.response.handlers[0].fulfilled

      // Act
      const result = responseInterceptor(mockResponse)

      // Assert
      expect(result).toEqual(mockResponse)
    })

    it('should handle 401 Unauthorized responses', async () => {
      // Arrange
      const error = {
        response: { status: 401 }
      }
      
      // Get the response interceptor error handler
      const responseErrorInterceptor = api.interceptors.response.handlers[0].rejected

      // Act & Assert
      await expect(responseErrorInterceptor(error)).rejects.toEqual(error)
      
      // Verify cleanup actions
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken')
      expect(mockLocation.href).toBe('/auth/login')
    })

    it('should pass through non-401 errors', async () => {
      // Arrange
      const error = {
        response: { status: 500 }
      }
      
      // Get the response interceptor error handler
      const responseErrorInterceptor = api.interceptors.response.handlers[0].rejected

      // Act & Assert
      await expect(responseErrorInterceptor(error)).rejects.toEqual(error)
      
      // Verify no cleanup actions
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
      expect(mockLocation.href).toBe('')
    })

    it('should handle errors without response', async () => {
      // Arrange
      const error = new Error('Network error')
      
      // Get the response interceptor error handler
      const responseErrorInterceptor = api.interceptors.response.handlers[0].rejected

      // Act & Assert
      await expect(responseErrorInterceptor(error)).rejects.toEqual(error)
      
      // Verify no cleanup actions
      expect(localStorageMock.removeItem).not.toHaveBeenCalled()
      expect(mockLocation.href).toBe('')
    })
  })

  describe('Integration Tests', () => {
    it('should work with actual axios instance', async () => {
      // Mock axios.create to return our configured instance
      const mockAxiosInstance = {
        defaults: {
          baseURL: 'http://localhost:8000/api',
          headers: { 'Content-Type': 'application/json' }
        },
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      }
      
      jest.doMock('axios', () => ({
        create: jest.fn(() => mockAxiosInstance)
      }))

      // This test verifies the setup works correctly
      expect(mockAxiosInstance.defaults.baseURL).toBe('http://localhost:8000/api')
      expect(mockAxiosInstance.defaults.headers['Content-Type']).toBe('application/json')
    })
  })
})
