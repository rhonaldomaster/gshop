/**
 * Share Hooks
 *
 * React hooks for sharing content with dynamic links.
 */

import { useState, useCallback } from 'react';
import shareService, {
  SharePlatform,
  ShareResult,
  ProductShareData,
  LiveStreamShareData,
  AffiliateShareData,
} from '../services/share.service';

/**
 * Main share hook
 */
export const useShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [lastShareResult, setLastShareResult] = useState<ShareResult | null>(null);

  const shareProduct = useCallback(
    async (data: ProductShareData, platform: SharePlatform = SharePlatform.GENERIC) => {
      setIsSharing(true);
      try {
        const result = await shareService.shareProduct(data, platform);
        setLastShareResult(result);
        return result;
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  const shareLiveStream = useCallback(
    async (data: LiveStreamShareData, platform: SharePlatform = SharePlatform.GENERIC) => {
      setIsSharing(true);
      try {
        const result = await shareService.shareLiveStream(data, platform);
        setLastShareResult(result);
        return result;
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  const shareAffiliateLink = useCallback(
    async (data: AffiliateShareData, platform: SharePlatform = SharePlatform.GENERIC) => {
      setIsSharing(true);
      try {
        const result = await shareService.shareAffiliateLink(data, platform);
        setLastShareResult(result);
        return result;
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  const shareOrderConfirmation = useCallback(
    async (orderId: string, orderTotal: number, platform: SharePlatform = SharePlatform.GENERIC) => {
      setIsSharing(true);
      try {
        const result = await shareService.shareOrderConfirmation(orderId, orderTotal, platform);
        setLastShareResult(result);
        return result;
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  return {
    isSharing,
    lastShareResult,
    shareProduct,
    shareLiveStream,
    shareAffiliateLink,
    shareOrderConfirmation,
  };
};

/**
 * Hook for checking platform availability
 */
export const useSharePlatform = () => {
  const [availablePlatforms, setAvailablePlatforms] = useState<SharePlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkPlatforms = useCallback(async () => {
    setIsLoading(true);
    const platforms = Object.values(SharePlatform);
    const available: SharePlatform[] = [];

    for (const platform of platforms) {
      const isAvailable = await shareService.isPlatformAvailable(platform);
      if (isAvailable) {
        available.push(platform);
      }
    }

    setAvailablePlatforms(available);
    setIsLoading(false);
  }, []);

  return {
    availablePlatforms,
    isLoading,
    checkPlatforms,
  };
};

/**
 * Hook for quick product sharing
 */
export const useProductShare = (product: ProductShareData) => {
  const { shareProduct } = useShare();

  const shareToWhatsApp = useCallback(async () => {
    return await shareProduct(product, SharePlatform.WHATSAPP);
  }, [product, shareProduct]);

  const shareToFacebook = useCallback(async () => {
    return await shareProduct(product, SharePlatform.FACEBOOK);
  }, [product, shareProduct]);

  const shareToTwitter = useCallback(async () => {
    return await shareProduct(product, SharePlatform.TWITTER);
  }, [product, shareProduct]);

  const shareToInstagram = useCallback(async () => {
    return await shareProduct(product, SharePlatform.INSTAGRAM);
  }, [product, shareProduct]);

  const shareGeneric = useCallback(async () => {
    return await shareProduct(product, SharePlatform.GENERIC);
  }, [product, shareProduct]);

  return {
    shareToWhatsApp,
    shareToFacebook,
    shareToTwitter,
    shareToInstagram,
    shareGeneric,
  };
};

/**
 * Hook for affiliate sharing with quick actions
 */
export const useAffiliateShare = (affiliateCode: string) => {
  const { shareAffiliateLink } = useShare();

  const createShareData = useCallback(
    (productId?: string, productName?: string, customMessage?: string): AffiliateShareData => {
      return {
        code: affiliateCode,
        productId,
        productName,
        customMessage,
      };
    },
    [affiliateCode]
  );

  const shareProduct = useCallback(
    async (productId: string, productName: string, platform: SharePlatform = SharePlatform.GENERIC) => {
      const data = createShareData(productId, productName);
      return await shareAffiliateLink(data, platform);
    },
    [affiliateCode, createShareData, shareAffiliateLink]
  );

  const shareGenericLink = useCallback(
    async (platform: SharePlatform = SharePlatform.GENERIC) => {
      const data = createShareData();
      return await shareAffiliateLink(data, platform);
    },
    [createShareData, shareAffiliateLink]
  );

  return {
    createShareData,
    shareProduct,
    shareGenericLink,
  };
};

export default useShare;