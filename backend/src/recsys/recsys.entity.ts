import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum InteractionType {
  VIEW = 'view',
  CLICK = 'click',
  ADD_TO_CART = 'add_to_cart',
  PURCHASE = 'purchase',
  WISHLIST = 'wishlist',
  SHARE = 'share',
  REVIEW = 'review',
  LIKE = 'like',
  WISHLIST_ADD = 'wishlist_add'
}

export enum PreferenceType {
  CATEGORY = 'category',
  BRAND = 'brand',
  PRICE_RANGE = 'price_range',
  ATTRIBUTE = 'attribute'
}

export enum RecommendationType {
  COLLABORATIVE = 'collaborative',
  CONTENT_BASED = 'content_based',
  HYBRID = 'hybrid',
  TRENDING = 'trending',
  SIMILAR_USERS = 'similar_users',
  CATEGORY_BASED = 'category_based'
}

@Entity('user_interactions')
export class UserInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  productId: string;

  @Column({ type: 'enum', enum: InteractionType })
  interactionType: InteractionType;

  @Column('decimal', { precision: 3, scale: 2, default: 1.0 })
  weight: number;

  @Column('json', { nullable: true })
  context: any;

  @Column('varchar', { length: 100, nullable: true })
  sessionId: string;

  @Column('varchar', { length: 45, nullable: true })
  ipAddress: string;

  @Column('text', { nullable: true })
  userAgent: string;

  @CreateDateColumn()
  timestamp: Date;
}

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'enum', enum: PreferenceType })
  preferenceType: PreferenceType;

  @Column('varchar', { length: 255 })
  preferenceValue: string;

  @Column('decimal', { precision: 3, scale: 2, default: 0.5 })
  strength: number;

  @Column('json', { nullable: true })
  categories: string[];

  @Column('json', { nullable: true })
  brands: string[];

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maxPrice: number;

  @Column('json', { nullable: true })
  attributes: any;

  @Column('decimal', { precision: 3, scale: 2, default: 0.5 })
  exploreExploitRatio: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('product_features')
export class ProductFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  productId: string;

  @Column('json')
  categoryVector: number[];

  @Column('json')
  priceVector: number[];

  @Column('json')
  brandVector: number[];

  @Column('json')
  textFeatures: number[];

  @Column('json')
  imageFeatures: number[];

  @Column('decimal', { precision: 8, scale: 6, default: 0 })
  popularityScore: number;

  @Column('decimal', { precision: 8, scale: 6, default: 0 })
  qualityScore: number;

  @Column('decimal', { precision: 8, scale: 6, default: 0 })
  trendinessScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  productId: string;

  @Column({ type: 'enum', enum: RecommendationType })
  type: RecommendationType;

  @Column('decimal', { precision: 8, scale: 6 })
  score: number;

  @Column('varchar', { length: 255, nullable: true })
  reason: string;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ default: false })
  wasShown: boolean;

  @Column({ default: false })
  wasClicked: boolean;

  @Column({ default: false })
  wasPurchased: boolean;

  @Column({ type: 'timestamp', nullable: true })
  shownAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  clickedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  generatedAt: Date;

  @Column({ nullable: true })
  algorithm: string;

  @Column('int', { nullable: true })
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('similarity_matrix')
export class SimilarityMatrix {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  productA: string;

  @Column('uuid')
  productB: string;

  @Column('decimal', { precision: 8, scale: 6 })
  similarity: number;

  @Column({ type: 'enum', enum: RecommendationType })
  similarityType: RecommendationType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('user_clusters')
export class UserCluster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('int')
  clusterId: number;

  @Column('decimal', { precision: 8, scale: 6 })
  confidence: number;

  @Column('json')
  clusterFeatures: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('recommendation_metrics')
export class RecommendationMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'enum', enum: RecommendationType })
  type: RecommendationType;

  @Column('int', { default: 0 })
  totalRecommendations: number;

  @Column('int', { default: 0 })
  totalViews: number;

  @Column('int', { default: 0 })
  totalClicks: number;

  @Column('int', { default: 0 })
  totalPurchases: number;

  @Column('decimal', { precision: 5, scale: 4, default: 0 })
  ctr: number;

  @Column('decimal', { precision: 5, scale: 4, default: 0 })
  conversionRate: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  revenue: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Add missing entity aliases
export class ProductSimilarity extends SimilarityMatrix {}
export class RecommendationResult extends Recommendation {}