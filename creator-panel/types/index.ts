export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface Affiliate {
  id: string
  userId: string
  username: string
  bio?: string
  avatarUrl?: string
  coverImageUrl?: string
  followersCount: number
  followingCount: number
  totalViews: number
  totalLikes: number
  totalEarnings: number
  commissionRate: number
  isVerified: boolean
  status: AffiliateStatus
  createdAt: string
  updatedAt: string
  user?: User
}

export enum AffiliateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected'
}

export interface AffiliateVideo {
  id: string
  affiliateId: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  views: number
  likes: number
  comments: number
  shares: number
  type: VideoType
  status: VideoStatus
  isPublished: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
  taggedProducts?: VideoProduct[]
  affiliate?: Affiliate
}

export enum VideoType {
  ORGANIC = 'organic',
  SPONSORED = 'sponsored',
  PRODUCT_REVIEW = 'product_review',
  UNBOXING = 'unboxing',
  TUTORIAL = 'tutorial'
}

export enum VideoStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published'
}

export interface VideoProduct {
  id: string
  videoId: string
  productId: string
  sellerId: string
  position: number
  createdAt: string
  product?: Product
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  sellerId: string
  isActive: boolean
}

export interface LiveStream {
  id: string
  affiliateId?: string
  sellerId?: string
  title: string
  description?: string
  thumbnailUrl?: string
  status: LiveStatus
  hostType: HostType
  viewers: number
  maxViewers: number
  rtmpUrl?: string
  hlsUrl?: string
  streamKey?: string
  startedAt?: string
  endedAt?: string
  createdAt: string
  products?: LiveProduct[]
}

export enum LiveStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export enum HostType {
  SELLER = 'seller',
  AFFILIATE = 'affiliate'
}

export interface LiveProduct {
  id: string
  liveStreamId: string
  productId: string
  isVisible: boolean
  pinnedAt?: string
  product?: Product
}

export interface CreatorStats {
  totalVideos: number
  totalViews: number
  totalLikes: number
  totalFollowers: number
  totalEarnings: number
  engagementRate: number
  topVideo?: AffiliateVideo
  recentEarnings: EarningsData[]
  viewsOverTime: ViewsData[]
}

export interface EarningsData {
  date: string
  amount: number
  orders: number
}

export interface ViewsData {
  date: string
  views: number
}

export interface FollowerActivity {
  followerId: string
  followingId: string
  createdAt: string
  followerUser?: User
}

export interface NotificationData {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}