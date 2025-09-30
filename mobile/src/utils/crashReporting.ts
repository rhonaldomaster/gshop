/**
 * Crash reporting utilities
 * Placeholder for Sentry or other crash reporting services
 */

import { ErrorInfo } from 'react';

export interface CrashReport {
  error: Error;
  errorInfo?: ErrorInfo;
  context?: Record<string, any>;
  timestamp: number;
  userId?: string;
  appVersion?: string;
}

class CrashReporter {
  private isInitialized: boolean = false;
  private userId: string | null = null;
  private context: Record<string, any> = {};

  /**
   * Initialize crash reporting service
   * In production, this would initialize Sentry or similar
   */
  initialize(config?: { dsn?: string; environment?: string }): void {
    if (this.isInitialized) {
      console.warn('CrashReporter already initialized');
      return;
    }

    if (__DEV__) {
      console.log('[CrashReporter] Initialized in development mode');
    } else {
      // TODO: Initialize Sentry or other service
      // Sentry.init({
      //   dsn: config?.dsn,
      //   environment: config?.environment || 'production',
      // });
      console.log('[CrashReporter] Production crash reporting enabled');
    }

    this.isInitialized = true;
  }

  /**
   * Set user context for crash reports
   */
  setUser(userId: string, metadata?: Record<string, any>): void {
    this.userId = userId;
    if (metadata) {
      this.context = { ...this.context, user: metadata };
    }

    // TODO: Send to Sentry
    // Sentry.setUser({ id: userId, ...metadata });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    this.userId = null;
    delete this.context.user;

    // TODO: Clear in Sentry
    // Sentry.setUser(null);
  }

  /**
   * Add custom context to crash reports
   */
  setContext(key: string, value: any): void {
    this.context[key] = value;

    // TODO: Send to Sentry
    // Sentry.setContext(key, value);
  }

  /**
   * Report an error
   */
  captureError(error: Error, errorInfo?: ErrorInfo): void {
    const report: CrashReport = {
      error,
      errorInfo,
      context: this.context,
      timestamp: Date.now(),
      userId: this.userId || undefined,
      appVersion: this.getAppVersion(),
    };

    if (__DEV__) {
      console.error('[CrashReporter] Error captured:', report);
    } else {
      // TODO: Send to Sentry
      // Sentry.captureException(error, {
      //   contexts: { react: errorInfo },
      //   tags: this.context,
      // });
    }

    // Also log to local storage for debugging
    this.logToStorage(report);
  }

  /**
   * Report a message (non-error)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (__DEV__) {
      console.log(`[CrashReporter] ${level}: ${message}`);
    } else {
      // TODO: Send to Sentry
      // Sentry.captureMessage(message, level);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: 'info' | 'warning' | 'error';
    data?: Record<string, any>;
  }): void {
    if (__DEV__) {
      console.log('[CrashReporter] Breadcrumb:', breadcrumb);
    } else {
      // TODO: Send to Sentry
      // Sentry.addBreadcrumb(breadcrumb);
    }
  }

  /**
   * Get app version (placeholder)
   */
  private getAppVersion(): string {
    // TODO: Get from app.json or Constants
    return '1.0.0';
  }

  /**
   * Store error report locally for debugging
   */
  private async logToStorage(report: CrashReport): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const existingReports = await AsyncStorage.getItem('@gshop:crash_reports');
      const reports = existingReports ? JSON.parse(existingReports) : [];

      // Keep only last 10 reports
      reports.push(report);
      if (reports.length > 10) {
        reports.shift();
      }

      await AsyncStorage.setItem('@gshop:crash_reports', JSON.stringify(reports));
    } catch (err) {
      console.error('Failed to log crash report to storage:', err);
    }
  }

  /**
   * Get local crash reports
   */
  async getLocalReports(): Promise<CrashReport[]> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const reports = await AsyncStorage.getItem('@gshop:crash_reports');
      return reports ? JSON.parse(reports) : [];
    } catch (err) {
      console.error('Failed to get local crash reports:', err);
      return [];
    }
  }

  /**
   * Clear local crash reports
   */
  async clearLocalReports(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('@gshop:crash_reports');
    } catch (err) {
      console.error('Failed to clear crash reports:', err);
    }
  }
}

// Singleton instance
export const crashReporter = new CrashReporter();

/**
 * Global error handler setup
 */
export const setupGlobalErrorHandlers = (): void => {
  // Handle unhandled promise rejections
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    crashReporter.captureError(error);

    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  // Handle console.error
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    crashReporter.captureMessage(
      `Console Error: ${args.join(' ')}`,
      'error'
    );
    originalConsoleError(...args);
  };

  // Handle unhandled rejections
  if (typeof global.HermesInternal === 'undefined') {
    // Non-Hermes environment
    const promiseRejectionTracking = require('promise/setimmediate/rejection-tracking');
    promiseRejectionTracking.enable({
      allRejections: true,
      onUnhandled: (id: string, error: Error) => {
        crashReporter.captureError(error);
      },
    });
  }
};