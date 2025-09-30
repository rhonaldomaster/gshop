import { useState, useEffect } from 'react';
import { Asset } from 'expo-asset';
import { Image } from 'react-native';

interface PreloadResult {
  loading: boolean;
  error: Error | null;
  loaded: boolean;
}

/**
 * Hook for preloading images
 * Useful for splash screens or critical images
 */
export const useImagePreloader = (images: (string | number)[]): PreloadResult => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    preloadImages();
  }, []);

  const preloadImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const imagePromises = images.map((image) => {
        if (typeof image === 'string') {
          // Remote image
          return Image.prefetch(image);
        } else {
          // Local require() image
          return Asset.fromModule(image).downloadAsync();
        }
      });

      await Promise.all(imagePromises);

      setLoaded(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to preload images'));
      setLoading(false);
    }
  };

  return { loading, error, loaded };
};

/**
 * Preload a single image
 */
export const preloadImage = async (uri: string): Promise<boolean> => {
  try {
    await Image.prefetch(uri);
    return true;
  } catch (err) {
    console.error('Image preload failed:', err);
    return false;
  }
};

/**
 * Preload multiple images in batches
 */
export const preloadImagesBatch = async (
  uris: string[],
  batchSize: number = 5
): Promise<void> => {
  for (let i = 0; i < uris.length; i += batchSize) {
    const batch = uris.slice(i, i + batchSize);
    await Promise.all(batch.map(uri => preloadImage(uri)));
  }
};