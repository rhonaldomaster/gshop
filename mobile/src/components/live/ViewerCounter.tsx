import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ViewerCounterProps {
  count: number;
  style?: any;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function ViewerCounter({
  count,
  style,
  animated = true,
  size = 'medium'
}: ViewerCounterProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (animated && count !== displayCount) {
      // Animate when count changes
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
    setDisplayCount(count);
  }, [count, animated, displayCount, scaleAnim]);

  const formatViewerCount = (viewerCount: number) => {
    if (viewerCount < 1000) return viewerCount.toString();
    if (viewerCount < 1000000) return `${(viewerCount / 1000).toFixed(1)}K`;
    return `${(viewerCount / 1000000).toFixed(1)}M`;
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          icon: 12,
          text: styles.smallText,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          icon: 20,
          text: styles.largeText,
        };
      default:
        return {
          container: styles.mediumContainer,
          icon: 16,
          text: styles.mediumText,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        sizeStyles.container,
        { transform: [{ scale: scaleAnim }] },
        style
      ]}
    >
      <MaterialIcons
        name="visibility"
        size={sizeStyles.icon}
        color="white"
      />
      <Text style={[styles.text, sizeStyles.text]}>
        {formatViewerCount(displayCount)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mediumContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  largeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  text: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  smallText: {
    fontSize: 10,
    marginLeft: 3,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
    marginLeft: 5,
  },
});