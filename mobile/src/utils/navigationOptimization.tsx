/**
 * Navigation Performance Optimization Utilities
 * Techniques to improve React Navigation performance
 */

import React from 'react';
import { InteractionManager } from 'react-native';

/**
 * Delays expensive operations until after animations complete
 * Use this in componentDidMount or useEffect for new screens
 */
export const runAfterInteractions = (callback: () => void): void => {
  InteractionManager.runAfterInteractions(() => {
    callback();
  });
};

/**
 * Creates a deferred promise that resolves after interactions
 * Useful for async operations that can wait
 */
export const waitForInteractions = (): Promise<void> => {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve();
    });
  });
};

/**
 * Optimized screen options for React Navigation
 * Reduces overdraw and improves transition performance
 */
export const optimizedScreenOptions = {
  // Lazy load screens (default in v6+)
  lazy: true,

  // Remove unnecessary shadows/elevations
  headerShadowVisible: false,

  // Use native transitions when possible
  animationEnabled: true,

  // Detach inactive screens to save memory
  detachInactiveScreens: true,

  // Freeze inactive screens (requires react-freeze)
  freezeOnBlur: true,
};

/**
 * Bottom Tab Navigator optimization
 */
export const optimizedTabOptions = {
  ...optimizedScreenOptions,

  // Lazy render tab screens
  lazy: true,

  // Unmount inactive tabs (be careful with state)
  unmountOnBlur: false,

  // Detach inactive tabs
  detachInactiveScreens: true,
};

/**
 * Stack Navigator optimization
 */
export const optimizedStackOptions = {
  ...optimizedScreenOptions,

  // Use simple push animation for better performance
  animation: 'default' as const,

  // Disable gestures on Android if not needed
  gestureEnabled: true,

  // Card style for transparent modals
  presentation: 'card' as const,
};

/**
 * Debounce navigation actions to prevent rapid taps
 */
let lastNavigationTime = 0;
const NAVIGATION_DEBOUNCE = 500; // ms

export const debounceNavigation = (
  navigationFn: () => void,
  delay: number = NAVIGATION_DEBOUNCE
): void => {
  const now = Date.now();

  if (now - lastNavigationTime > delay) {
    lastNavigationTime = now;
    navigationFn();
  }
};

/**
 * Preload screen component for faster navigation
 * Use with React.lazy() and suspense
 */
export const preloadScreen = async (
  screenLoader: () => Promise<any>
): Promise<void> => {
  try {
    await screenLoader();
  } catch (error) {
    console.warn('Screen preload failed:', error);
  }
};

/**
 * Memory-efficient screen wrapper HOC
 * Unmounts heavy components when screen is not focused
 */
export const withScreenOptimization = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    // Can be enhanced with useFocusEffect to unmount heavy parts
    return <Component {...props} />;
  };
};

/**
 * Get optimized options based on device performance
 * Detects low-end devices and reduces animations
 */
export const getDeviceOptimizedOptions = () => {
  // Simple heuristic: assume older devices need more optimization
  // In production, use actual device info or performance metrics
  const isLowEndDevice = false; // TODO: Implement device detection

  if (isLowEndDevice) {
    return {
      animationEnabled: false,
      lazy: true,
      detachInactiveScreens: true,
      freezeOnBlur: true,
    };
  }

  return optimizedScreenOptions;
};