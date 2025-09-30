import { useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { runAfterInteractions } from '../utils/navigationOptimization';

/**
 * Hook to track screen focus state and defer expensive operations
 */
export const useScreenFocus = () => {
  const isFocused = useIsFocused();
  const [isReady, setIsReady] = useState(false);
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (isFocused) {
      if (!hasLoadedOnce.current) {
        // First time focus - wait for animations
        runAfterInteractions(() => {
          setIsReady(true);
          hasLoadedOnce.current = true;
        });
      } else {
        // Screen returning to focus - no delay needed
        setIsReady(true);
      }
    } else {
      // Screen lost focus - can pause expensive operations
      setIsReady(false);
    }
  }, [isFocused]);

  return {
    isFocused,
    isReady,
    shouldLoad: isFocused && isReady,
  };
};

/**
 * Hook to defer data fetching until after screen transition
 */
export const useDeferredLoad = (loadFn: () => void | Promise<void>) => {
  const { shouldLoad } = useScreenFocus();
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (shouldLoad && !hasLoaded.current) {
      hasLoaded.current = true;
      loadFn();
    }
  }, [shouldLoad]);

  return hasLoaded.current;
};

/**
 * Hook to pause/resume expensive operations based on screen focus
 */
export const useFocusAwareEffect = (
  effect: () => void | (() => void),
  deps: any[] = []
) => {
  const isFocused = useIsFocused();
  const cleanup = useRef<void | (() => void)>();

  useEffect(() => {
    if (isFocused) {
      cleanup.current = effect();
    } else {
      // Cleanup when screen loses focus
      if (cleanup.current && typeof cleanup.current === 'function') {
        cleanup.current();
      }
    }

    return () => {
      if (cleanup.current && typeof cleanup.current === 'function') {
        cleanup.current();
      }
    };
  }, [isFocused, ...deps]);
};