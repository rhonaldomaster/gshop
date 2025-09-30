import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Animated skeleton loader component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
});

/**
 * Product card skeleton
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <View style={styles.productCard}>
      <Skeleton height={150} borderRadius={8} />
      <View style={styles.productInfo}>
        <Skeleton height={16} width="80%" style={{ marginBottom: 8 }} />
        <Skeleton height={14} width="60%" style={{ marginBottom: 8 }} />
        <Skeleton height={20} width="40%" />
      </View>
    </View>
  );
};

const productCardStyles = StyleSheet.create({
  productCard: {
    width: 160,
    marginRight: 12,
  },
  productInfo: {
    paddingTop: 8,
  },
});

Object.assign(styles, productCardStyles);

/**
 * List item skeleton
 */
export const ListItemSkeleton: React.FC = () => {
  return (
    <View style={styles.listItem}>
      <Skeleton width={60} height={60} borderRadius={8} />
      <View style={styles.listItemContent}>
        <Skeleton height={16} width="70%" style={{ marginBottom: 8 }} />
        <Skeleton height={14} width="50%" style={{ marginBottom: 8 }} />
        <Skeleton height={18} width="30%" />
      </View>
    </View>
  );
};

const listItemStyles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
});

Object.assign(styles, listItemStyles);

/**
 * Profile header skeleton
 */
export const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <View style={styles.profileHeader}>
      <Skeleton width={80} height={80} borderRadius={40} />
      <View style={styles.profileInfo}>
        <Skeleton height={20} width={120} style={{ marginBottom: 8 }} />
        <Skeleton height={16} width={160} style={{ marginBottom: 12 }} />
        <View style={styles.statsRow}>
          <Skeleton height={40} width={60} style={{ marginRight: 20 }} />
          <Skeleton height={40} width={60} style={{ marginRight: 20 }} />
          <Skeleton height={40} width={60} />
        </View>
      </View>
    </View>
  );
};

const profileStyles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profileInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

Object.assign(styles, profileStyles);

/**
 * Grid skeleton loader
 */
interface GridSkeletonProps {
  count?: number;
  columns?: number;
}

export const GridSkeleton: React.FC<GridSkeletonProps> = ({
  count = 6,
  columns = 2,
}) => {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[styles.gridItem, { width: `${100 / columns}%` }]}
        >
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
};

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  gridItem: {
    padding: 8,
  },
});

Object.assign(styles, gridStyles);