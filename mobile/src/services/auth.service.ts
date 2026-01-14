import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiResponse } from './api';
import { API_CONFIG } from '../config/api.config';

// Types for authentication
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  phone?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
}

export interface SocialLoginRequest {
  accessToken: string;
  provider: 'google' | 'facebook';
  idToken?: string;
}

class AuthService {
  // Login with email and password
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (response.success && response.data) {
        // Store token and user data
        await this.storeAuthData(response.data);
        await apiClient.setAuthToken(response.data.access_token);

        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('AuthService: Login failed', error);
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  }

  // Social login (Google/Facebook)
  async socialLogin(socialData: SocialLoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.SOCIAL,
        socialData,
      );

      if (response.success && response.data) {
        await this.storeAuthData(response.data);
        await apiClient.setAuthToken(response.data.access_token);
        return response.data;
      } else {
        throw new Error(response.message || 'Social login failed');
      }
    } catch (error: any) {
      console.error('AuthService: Social login failed', error);
      throw new Error(error.message || 'Social login failed. Please try again.');
    }
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        userData
      );

      if (response.success && response.data) {
        // Store token and user data
        await this.storeAuthData(response.data);
        await apiClient.setAuthToken(response.data.access_token);

        return response.data;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('AuthService: Registration failed', error);

      // Handle specific error cases
      if (error.statusCode === 409) {
        throw new Error('Email already exists. Please use a different email.');
      }

      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate token on server
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Continue with local logout even if server call fails
      console.warn('Server logout failed, continuing with local logout');
    } finally {
      // Clear local data
      await this.clearAuthData();
      await apiClient.clearAuthToken();
    }
  }

  // Get current user profile
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<User>(API_CONFIG.ENDPOINTS.AUTH.PROFILE);

      if (response.success && response.data) {
        // Update stored user data
        await AsyncStorage.setItem(
          API_CONFIG.STORAGE_KEYS.USER_DATA,
          JSON.stringify(response.data)
        );

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get profile');
      }
    } catch (error: any) {
      console.error('AuthService: Get profile failed', error);
      throw new Error(error.message || 'Failed to get user profile');
    }
  }

  // Upload avatar image
  async uploadAvatar(imageUri: string): Promise<string> {
    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Extract filename from URI
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      const fileType = filename.split('.').pop()?.toLowerCase() || 'jpg';

      // Map file extension to mime type
      const mimeTypeMap: { [key: string]: string } = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
      };

      const mimeType = mimeTypeMap[fileType] || 'image/jpeg';

      // Append file to FormData with proper format for React Native
      formData.append('avatar', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);

      const response = await apiClient.uploadFile<{ url: string; provider: string }>(
        '/auth/avatar/upload',
        formData
      );

      if (response.success && response.data) {
        return response.data.url;
      } else {
        throw new Error(response.message || 'Failed to upload avatar');
      }
    } catch (error: any) {
      console.error('AuthService: Avatar upload failed', error);
      throw new Error(error.message || 'Failed to upload avatar image');
    }
  }

  // Update user profile
  async updateProfile(updateData: UpdateProfileRequest): Promise<User> {
    try {
      const response = await apiClient.put<User>(
        API_CONFIG.ENDPOINTS.AUTH.PROFILE,
        updateData
      );

      if (response.success && response.data) {
        // Update stored user data
        await AsyncStorage.setItem(
          API_CONFIG.STORAGE_KEYS.USER_DATA,
          JSON.stringify(response.data)
        );

        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('AuthService: Update profile failed', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  // Refresh auth token
  async refreshToken(): Promise<string> {
    try {
      const response = await apiClient.post<{ access_token: string }>(
        API_CONFIG.ENDPOINTS.AUTH.REFRESH
      );

      if (response.success && response.data) {
        const newToken = response.data.access_token;
        await apiClient.setAuthToken(newToken);
        return newToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error: any) {
      console.error('AuthService: Token refresh failed', error);
      // Clear auth data if refresh fails
      await this.clearAuthData();
      await apiClient.clearAuthToken();
      throw new Error('Session expired. Please login again.');
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        return false;
      }

      // Optionally verify token with server
      try {
        await this.getProfile();
        return true;
      } catch (error) {
        // Token might be invalid, clear it
        await this.clearAuthData();
        await apiClient.clearAuthToken();
        return false;
      }
    } catch (error) {
      console.error('AuthService: Auth check failed', error);
      return false;
    }
  }

  // Get stored user data
  async getStoredUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.USER_DATA);

      if (userString) {
        return JSON.parse(userString);
      }

      return null;
    } catch (error) {
      console.error('AuthService: Failed to get stored user', error);
      return null;
    }
  }

  // Get stored auth token
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('AuthService: Failed to get stored token', error);
      return null;
    }
  }

  // Private helper methods
  private async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [API_CONFIG.STORAGE_KEYS.AUTH_TOKEN, authData.access_token],
        [API_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user)],
      ]);
    } catch (error) {
      console.error('AuthService: Failed to store auth data', error);
      throw new Error('Failed to store authentication data');
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        API_CONFIG.STORAGE_KEYS.AUTH_TOKEN,
        API_CONFIG.STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('AuthService: Failed to clear auth data', error);
    }
  }

  // Password change (if needed)
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('AuthService: Change password failed', error);
      throw new Error(error.message || 'Failed to change password');
    }
  }

  // Forgot password (if needed)
  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });

      if (!response.success) {
        throw new Error(response.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      console.error('AuthService: Forgot password failed', error);
      throw new Error(error.message || 'Failed to send reset email');
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
