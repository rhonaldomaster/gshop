/**
 * Profile Types
 *
 * TypeScript interfaces for seller and affiliate public profiles.
 */

// ==================== Seller Types ====================

export interface SellerPublicProfile {
  id: string;
  businessName: string;
  logoUrl?: string;
  profileDescription?: string;
  isVerified: boolean;
  followersCount: number;
  productsCount: number;
  rating: number;
  totalReviews: number;
  city?: string;
  state?: string;
  createdAt: string;
  isFollowing?: boolean;
  notificationsEnabled?: boolean;
}

export interface SellerProductSummary {
  id: string;
  name: string;
  price: number;
  images: string[];
  vatType: string;
  stock: number;
}

export interface SellerStreamSummary {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'scheduled' | 'live' | 'ended';
  viewerCount: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export interface SellerProductsResponse {
  products: SellerProductSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SellerStreamsResponse {
  streams: SellerStreamSummary[];
  total: number;
  page: number;
  totalPages: number;
}

// ==================== Affiliate Types ====================

export interface AffiliatePublicProfile {
  id: string;
  username: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  location?: string;
  categories?: string[];
  website?: string;
  socialMedia?: string;
  isVerified: boolean;
  stats: {
    followersCount: number;
    followingCount: number;
    totalViews: number;
    totalSales: number;
    productsPromoted: number;
    videosCount: number;
    liveStreamsCount: number;
  };
  followStats: {
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    mutualFollows: number;
  };
  recentVideos?: AffiliateVideo[];
  activeLiveStreams?: AffiliateStreamSummary[];
  promotedProducts?: AffiliatePromotedProduct[];
  createdAt: string;
}

export interface AffiliateVideo {
  id: string;
  title: string;
  thumbnailUrl?: string;
  viewCount: number;
  status: string;
  createdAt: string;
}

export interface AffiliateStreamSummary {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: 'scheduled' | 'live' | 'ended';
  viewerCount: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export interface AffiliatePromotedProduct {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
  };
  specialPrice?: number;
  promotionalText?: string;
  clicks: number;
  sales: number;
}

export interface AffiliateStreamsResponse {
  streams: AffiliateStreamSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==================== Common Types ====================

export type ProfileTab = 'products' | 'live' | 'past_streams';

export type StreamStatus = 'live' | 'ended' | 'all';

export interface FollowResponse {
  success: boolean;
  message: string;
  isFollowing?: boolean;
  notificationsEnabled?: boolean;
}

export interface IsFollowingResponse {
  isFollowing: boolean;
  notificationsEnabled?: boolean;
  followedAt?: string;
}
