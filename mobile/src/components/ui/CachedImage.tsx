import React, { useState, useEffect } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialIcons } from '@expo/vector-icons';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  cacheKey?: string;
  fallbackIcon?: keyof typeof MaterialIcons.glyphMap;
  showPlaceholder?: boolean;
}

const CACHE_DIR = `${FileSystem.cacheDirectory}images/`;

/**
 * CachedImage component with automatic caching and lazy loading
 * Caches images to local filesystem for faster subsequent loads
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  cacheKey,
  fallbackIcon = 'image',
  showPlaceholder = true,
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cachedUri, setCachedUri] = useState<string | null>(null);

  useEffect(() => {
    loadImage();
  }, [uri]);

  const getCacheFilePath = (): string => {
    const filename = cacheKey || uri.split('/').pop() || 'image';
    return `${CACHE_DIR}${filename}`;
  };

  const ensureCacheDir = async (): Promise<void> => {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  };

  const loadImage = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(false);

      // Check if image exists in cache
      await ensureCacheDir();
      const cacheFilePath = getCacheFilePath();
      const fileInfo = await FileSystem.getInfoAsync(cacheFilePath);

      if (fileInfo.exists) {
        // Load from cache
        setCachedUri(cacheFilePath);
        setLoading(false);
      } else {
        // Download and cache
        const downloadResult = await FileSystem.downloadAsync(uri, cacheFilePath);
        setCachedUri(downloadResult.uri);
        setLoading(false);
      }
    } catch (err) {
      console.error('Image loading error:', err);
      setError(true);
      setLoading(false);
    }
  };

  if (loading && showPlaceholder) {
    return (
      <View style={[styles.placeholder, style]}>
        <ActivityIndicator size="small" color="#666" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.placeholder, style]}>
        <MaterialIcons name={fallbackIcon} size={32} color="#999" />
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={{ uri: cachedUri || uri }}
      style={style}
      onError={() => setError(true)}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Utility function to clear cache
export const clearImageCache = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    }
  } catch (err) {
    console.error('Error clearing image cache:', err);
  }
};

// Utility function to get cache size
export const getCacheSize = async (): Promise<number> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) return 0;

    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;

    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
      if (fileInfo.exists && 'size' in fileInfo) {
        totalSize += fileInfo.size || 0;
      }
    }

    return totalSize;
  } catch (err) {
    console.error('Error calculating cache size:', err);
    return 0;
  }
};