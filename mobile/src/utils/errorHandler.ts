/**
 * Centralized error handling utilities
 */

import { crashReporter } from './crashReporting';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  isOperational?: boolean;
}

export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  AUTH = 'AUTH_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

/**
 * Create a custom app error
 */
export const createAppError = (
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  statusCode?: number
): AppError => {
  const error: AppError = new Error(message);
  error.code = type;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

/**
 * Parse API error response
 */
export const parseApiError = (error: any): AppError => {
  // Axios error
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message || 'An error occurred';

    if (status === 401 || status === 403) {
      return createAppError(message, ErrorType.AUTH, status);
    }

    if (status === 404) {
      return createAppError(message, ErrorType.NOT_FOUND, status);
    }

    if (status >= 400 && status < 500) {
      return createAppError(message, ErrorType.VALIDATION, status);
    }

    if (status >= 500) {
      return createAppError(message, ErrorType.SERVER, status);
    }
  }

  // Network error
  if (error.request) {
    return createAppError(
      'Network error. Please check your connection.',
      ErrorType.NETWORK
    );
  }

  // Unknown error
  return createAppError(
    error.message || 'An unexpected error occurred',
    ErrorType.UNKNOWN
  );
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: AppError): string => {
  switch (error.code) {
    case ErrorType.NETWORK:
      return 'Unable to connect. Please check your internet connection.';
    case ErrorType.AUTH:
      return 'Authentication failed. Please log in again.';
    case ErrorType.VALIDATION:
      return error.message || 'Please check your input and try again.';
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    case ErrorType.SERVER:
      return 'Server error. Please try again later.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

/**
 * Handle error with logging and user notification
 */
export const handleError = (
  error: any,
  context?: string,
  showToUser: boolean = true
): AppError => {
  const appError = parseApiError(error);

  // Log to crash reporter
  crashReporter.captureError(appError);

  if (context) {
    crashReporter.addBreadcrumb({
      message: `Error in ${context}`,
      level: 'error',
      data: { error: appError.message },
    });
  }

  // Log to console in development
  if (__DEV__) {
    console.error(`[Error Handler] ${context || 'Error'}:`, appError);
  }

  // TODO: Show toast/alert to user if needed
  if (showToUser) {
    // showToast(getUserFriendlyMessage(appError));
  }

  return appError;
};

/**
 * Retry async operation with exponential backoff
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

/**
 * Safe async wrapper that catches and handles errors
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return fallback;
  }
};