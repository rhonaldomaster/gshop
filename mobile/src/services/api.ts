import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ApiResponse, ApiError } from '../config/api.config';

class ApiClient {
  private axiosInstance: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}`,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadAuthToken();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        if (__DEV__) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        if (__DEV__) {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`, response.data);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (__DEV__) {
          console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, {
            data: error.response?.data,
            message: error.message,
          });
        }

        // Handle 401 - Unauthorized (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.clearAuthToken();
            // TODO: Navigate to login screen
            console.log('Token refresh failed, redirecting to login...');
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private formatError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || 'Server error occurred',
        statusCode: error.response.status,
        errors: error.response.data?.errors || [],
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error - Please check your connection',
        statusCode: 0,
        errors: ['NETWORK_ERROR'],
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        statusCode: 0,
        errors: ['UNKNOWN_ERROR'],
      };
    }
  }

  // Auth token management
  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    await AsyncStorage.setItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA);
  }

  private async loadAuthToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      const response = await this.axiosInstance.post('/auth/refresh');
      const newToken = response.data.token;
      await this.setAuthToken(newToken);
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      // Wrap the response in ApiResponse format
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, config);
      // Wrap the response in ApiResponse format
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, config);
      // Wrap the response in ApiResponse format
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<T>(url, data, config);
      // Wrap the response in ApiResponse format
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<T>(url, config);
      // Wrap the response in ApiResponse format
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  // Upload file method for product images, reviews, etc.
  async uploadFile<T>(url: string, file: FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const uploadConfig: AxiosRequestConfig = {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...config?.headers,
        },
      };

      const response = await this.axiosInstance.post<T>(url, file, uploadConfig);
      // Wrap the response in ApiResponse format
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  // Helper method to build URL with path parameters
  buildUrl(endpoint: string, params?: Record<string, string | number>): string {
    let url = endpoint;

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, String(value));
      });
    }

    return url;
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiResponse, ApiError };
export { ApiClient };