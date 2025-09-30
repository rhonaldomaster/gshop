import React, { useState, useEffect, useRef } from 'react';
import { View, ViewProps, Dimensions, ScrollView } from 'react-native';

interface LazyLoadViewProps extends ViewProps {
  /** Children to render when in viewport */
  children: React.ReactNode;
  /** Placeholder to show while not loaded */
  placeholder?: React.ReactNode;
  /** Threshold in pixels to trigger load before entering viewport */
  threshold?: number;
  /** Parent ScrollView ref for better detection */
  scrollViewRef?: React.RefObject<ScrollView>;
}

/**
 * LazyLoadView component for rendering children only when visible
 * Improves performance by deferring render of off-screen components
 */
export const LazyLoadView: React.FC<LazyLoadViewProps> = ({
  children,
  placeholder = null,
  threshold = 100,
  scrollViewRef,
  style,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const viewRef = useRef<View>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Simple implementation: load after mount with delay
    // In production, use onLayout + scroll position tracking
    const timer = setTimeout(() => {
      checkVisibility();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const checkVisibility = async () => {
    if (hasLoaded.current) return;

    try {
      if (viewRef.current) {
        viewRef.current.measure((x, y, width, height, pageX, pageY) => {
          const screenHeight = Dimensions.get('window').height;

          // Check if element is within viewport + threshold
          if (pageY < screenHeight + threshold && pageY + height > -threshold) {
            setIsVisible(true);
            hasLoaded.current = true;
          }
        });
      }
    } catch (err) {
      // Fallback: just load it
      setIsVisible(true);
      hasLoaded.current = true;
    }
  };

  return (
    <View ref={viewRef} style={style} {...props} onLayout={checkVisibility}>
      {isVisible || hasLoaded.current ? children : placeholder}
    </View>
  );
};