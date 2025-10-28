import React, { useEffect, useRef, useState } from 'react';
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
  }, [shouldLoad, loadFn]);

  return hasLoaded.current;
};

/**
 * Hook to pause/resume expensive operations based on screen focus
 */
export const useFocusAwareEffect = (
  effect: () => void | (() => void),
  deps: React.DependencyList = []
) => {
  const isFocused = useIsFocused();
  const cleanup = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (isFocused) {
      const result = effect();
      cleanup.current = typeof result === 'function' ? result : undefined;
    } else {
      // Cleanup when screen loses focus
      if (cleanup.current) {
        cleanup.current();
      }
    }

    return () => {
      if (cleanup.current) {
        cleanup.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, effect, ...deps]);
};