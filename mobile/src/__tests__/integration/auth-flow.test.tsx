import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../../screens/auth/LoginScreen';
import RegisterScreen from '../../screens/auth/RegisterScreen';
import ProfileScreen from '../../screens/profile/ProfileScreen';
import { AuthContext } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';

jest.mock('../../services/auth.service');

describe('Authentication Flow', () => {
  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockLogin = jest.fn();
      const mockAuthContext = {
        login: mockLogin,
        isAuthenticated: false,
        user: null,
        token: null,
        logout: jest.fn(),
        register: jest.fn(),
      };

      (authService.login as jest.Mock).mockResolvedValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-token',
      });

      const { getByPlaceholderText, getByText } = render(
        <NavigationContainer>
          <AuthContext.Provider value={mockAuthContext}>
            <LoginScreen />
          </AuthContext.Provider>
        </NavigationContainer>
      );

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByText('Login');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('should show error with invalid credentials', async () => {
      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const { getByPlaceholderText, getByText } = render(
        <NavigationContainer>
          <LoginScreen />
        </NavigationContainer>
      );

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('Password');
      const loginButton = getByText('Login');

      fireEvent.changeText(emailInput, 'wrong@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Invalid credentials')).toBeTruthy();
      });
    });

    it('should validate email format', async () => {
      const { getByPlaceholderText, getByText } = render(
        <NavigationContainer>
          <LoginScreen />
        </NavigationContainer>
      );

      const emailInput = getByPlaceholderText('Email');
      const loginButton = getByText('Login');

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(getByText('Please enter a valid email')).toBeTruthy();
      });
    });
  });

  describe('Registration', () => {
    it('should register new user successfully', async () => {
      const mockRegister = jest.fn();

      (authService.register as jest.Mock).mockResolvedValue({
        user: { id: '1', email: 'new@example.com', name: 'New User' },
        token: 'mock-token',
      });

      const { getByPlaceholderText, getByText } = render(
        <NavigationContainer>
          <RegisterScreen />
        </NavigationContainer>
      );

      fireEvent.changeText(getByPlaceholderText('Name'), 'New User');
      fireEvent.changeText(getByPlaceholderText('Email'), 'new@example.com');
      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.changeText(
        getByPlaceholderText('Confirm Password'),
        'password123'
      );

      fireEvent.press(getByText('Register'));

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
        });
      });
    });

    it('should validate password match', async () => {
      const { getByPlaceholderText, getByText } = render(
        <NavigationContainer>
          <RegisterScreen />
        </NavigationContainer>
      );

      fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
      fireEvent.changeText(
        getByPlaceholderText('Confirm Password'),
        'different'
      );

      fireEvent.press(getByText('Register'));

      await waitFor(() => {
        expect(getByText('Passwords do not match')).toBeTruthy();
      });
    });
  });

  describe('Logout', () => {
    it('should logout user and clear session', async () => {
      const mockLogout = jest.fn();
      const mockAuthContext = {
        logout: mockLogout,
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-token',
        login: jest.fn(),
        register: jest.fn(),
      };

      const { getByText } = render(
        <NavigationContainer>
          <AuthContext.Provider value={mockAuthContext}>
            <ProfileScreen />
          </AuthContext.Provider>
        </NavigationContainer>
      );

      const logoutButton = getByText('Logout');
      fireEvent.press(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });
    });
  });
});