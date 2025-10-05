
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User, LoginRequest, RegisterRequest } from '../services/auth.service';
import { API_CONFIG } from '../config/api.config';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<User>;
}

// Use RegisterRequest from auth service
type RegisterData = RegisterRequest;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'SET_LOADING'; payload: boolean };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // Use API_CONFIG storage keys
      const token = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      const userString = await AsyncStorage.getItem(API_CONFIG.STORAGE_KEYS.USER_DATA);

      if (token && userString) {
        const user = JSON.parse(userString);

        // Trust the stored token on startup
        // Server will validate on first API call
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
      } else {
        // No token stored, user not authenticated
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      dispatch({ type: 'LOGOUT' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const loginData: LoginRequest = { email, password };
      const authResponse = await authService.login(loginData);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: authResponse.user,
          token: authResponse.access_token,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const authResponse = await authService.register(userData);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: authResponse.user,
          token: authResponse.access_token,
        },
      });
    } catch (error: any) {
      console.error('Register error:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still dispatch logout even if API call fails
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData);

      dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });

      return updatedUser;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
