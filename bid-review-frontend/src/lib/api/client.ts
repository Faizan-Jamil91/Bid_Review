// src/lib/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, AxiosProgressEvent } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle 401 Unauthorized
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              // No refresh token, redirect to login
              this.clearAuth();
              window.location.href = '/auth/login';
              return Promise.reject(error);
            }

            // Try to refresh the token using SimpleJWT's expected payload
            const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });

            // Save new tokens (SimpleJWT returns 'access' only)
            if (data.access) {
              localStorage.setItem('accessToken', data.access);
            }
            // If server returns a new refresh token, save it
            if (data.refresh) {
              localStorage.setItem('refreshToken', data.refresh);
            }

            // Update the Authorization header
            originalRequest.headers.Authorization = `Bearer ${data.access}`;

            // Retry the original request
            return this.client(originalRequest);
          } catch (err) {
            // Refresh token failed, clear auth and redirect to login
            this.clearAuth();
            window.location.href = '/auth/login?sessionExpired=true';
            return Promise.reject(err);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private clearAuth() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Auth methods
  async login(credentials: { email: string; password: string }) {
    try {
      console.log('Making login request to:', '/auth/login/');
      console.log('Base URL:', this.client.defaults.baseURL);
      console.log('Full URL:', this.client.getUri({url: '/auth/login/'}));
      console.log('Credentials:', credentials);
      const response = await this.client.post('/auth/login/', credentials);
      console.log('Login response:', response);
      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number; data: any; headers: any } };
        console.error('Error response status:', axiosError.response?.status);
        console.error('Error response data:', axiosError.response?.data);
        console.error('Error response headers:', axiosError.response?.headers);
      }
      throw error;
    }
  }

  async register(userData: { name?: string; email: string; password: string }) {
    // Map frontend 'name' to backend expected fields
    const username = userData.email.split('@')[0];
    const [first_name = '', ...rest] = (userData.name || '').split(' ');
    const last_name = rest.join(' ');

    const payload = {
      email: userData.email,
      username,
      first_name,
      last_name,
      password: userData.password,
      password2: userData.password,
    };

    const response = await this.client.post('/auth/register/', payload);
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.client.post('/auth/forgot-password/', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await this.client.post('/auth/reset-password/', { token, password });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/profile/');
    return response.data;
  }

  logout() {
    this.clearAuth();
  }

  // Bids methods
  async getBids(params?: any) {
    const response = await this.client.get('/bids/', { params });
    return response.data;
  }

  async getBidById(id: string) {
    const response = await this.client.get(`/bids/${id}/`);
    return response.data;
  }

  async createBid(data: any) {
    try {
      console.log('Sending create bid request with data:', JSON.stringify(data, null, 2));
      const response = await this.client.post('/bids/', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error in createBid:', error);

      const axiosError = error as {
        response?: {
          data: any;
          status: number;
          statusText: string;
          headers: any;
          config: any;
        };
        request?: any;
        message: string;
        config?: any;
      };

      if (axiosError.response) {
        const { data, status, statusText, headers, config } = axiosError.response;

        console.error('Error details:', {
          status,
          statusText,
          headers,
          request: {
            method: config?.method,
            url: config?.url,
            data: config?.data,
            headers: config?.headers,
          },
          responseData: data,
        });

        // Try to extract more detailed error information
        let errorMessage = 'Failed to create bid';

        if (data) {
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (data.errors) {
            errorMessage = Object.entries(data.errors)
              .map(([field, messages]) => {
                const messageList = Array.isArray(messages) ? messages.join(', ') : String(messages);
                return `${field}: ${messageList}`;
              })
              .join('; ');
          } else if (typeof data === 'object') {
            errorMessage = JSON.stringify(data);
          }
        }

        throw new Error(`[${status}] ${errorMessage}`);

      } else if (axiosError.request) {
        console.error('No response received. Request details:', {
          request: axiosError.request,
          config: axiosError.config,
        });
        throw new Error('No response received from server. Please check your network connection.');
      } else {
        const message = axiosError.message || 'Unknown error occurred';
        console.error('Error setting up request:', {
          message,
          config: axiosError.config,
        });
        throw new Error(`Request setup error: ${message}`);
      }
    }
  }

  async updateBid(id: string, data: any) {
    const response = await this.client.put(`/bids/${id}/`, data);
    return response.data;
  }

  async deleteBid(id: string) {
    const response = await this.client.delete(`/bids/${id}/`);
    return response.data;
  }

  // Bid actions
  async predictBid(id: string) {
    const response = await this.client.post(`/bids/${id}/predict/`);
    return response.data;
  }

  async generateProposal(id: string) {
    const response = await this.client.post(`/bids/${id}/generate-proposal/`);
    return response.data;
  }

  async analyzeRequirements(id: string, requirements: string) {
    const response = await this.client.post(`/bids/${id}/analyze-requirements/`, { requirements });
    return response.data;
  }

  // Analytics methods
  async getBidAnalytics() {
    // Analytics dashboard contains multiple metrics including bids overview
    const response = await this.client.get('/analytics/dashboard/');
    return response.data;
  }

  async getWinRateAnalytics() {
    const data = await this.getBidAnalytics();
    return data?.overview?.win_rate ?? 0;
  }

  // Dashboard methods
  async getDashboardData() {
    const response = await this.client.get('/bids/dashboard/');
    return response.data;
  }

  // Admin methods
  async getUsers() {
    const response = await this.client.get('/admin/users');
    return response.data;
  }

  async updateUserRole(userId: string, role: string) {
    const response = await this.client.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  }

  // Customer methods
  async getCustomers(params?: any) {
    const response = await this.client.get('/bids/customers/', { params });
    return response.data;
  }

  async createCustomer(data: any) {
    const response = await this.client.post('/bids/customers/', data);
    return response.data;
  }

  async updateCustomer(id: string, data: any) {
    const response = await this.client.put(`/bids/customers/${id}/`, data);
    return response.data;
  }

  async deleteCustomer(id: string) {
    const response = await this.client.delete(`/bids/customers/${id}/`);
    return response.data;
  }

  // AI Tools
  async generateAIContent(prompt: string, context?: any) {
    const response = await this.client.post('/bids/ai/tools/', { prompt, context });
    return response.data;
  }

  // ML Training
  async trainMLModels() {
    const response = await this.client.post('/bids/ml/train/');
    return response.data;
  }

  async getMLModelStatus() {
    const response = await this.client.get('/bids/ml/status/');
    return response.data;
  }

  // File upload
  async uploadFile(file: File, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });

    return response.data;
  }

  // Document management methods
  async getBidDocuments(bidId: string) {
    const response = await this.client.get(`/bids/${bidId}/documents/`);
    return response.data;
  }

  async uploadBidDocuments(bidId: string, formData: FormData) {
    const response = await this.client.post(`/bids/${bidId}/upload_documents/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteBidDocument(bidId: string, documentId: string) {
    const response = await this.client.delete(`/bids/${bidId}/documents/${documentId}/`);
    return response.data;
  }

  async updateBidDocument(bidId: string, documentId: string, data: any) {
    const response = await this.client.patch(`/bids/${bidId}/documents/${documentId}/`, data);
    return response.data;
  }

  async downloadBidDocument(bidId: string, documentId: string) {
    const response = await this.client.get(`/bids/${bidId}/documents/${documentId}/download/`, {
      responseType: 'blob',
    });
    return response;
  }
}

export const api = new ApiClient();