import { IsString, IsEnum, IsOptional, IsNumber, IsObject, IsBoolean, Min, Max } from 'class-validator';
import { InteractionType, PreferenceType } from '../recsys.entity';

export class TrackInteractionDto {
  @IsString()
  userId: string;

  @IsString()
  productId: string;

  @IsEnum(InteractionType)
  interactionType: InteractionType;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class GenerateRecommendationsDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  algorithm?: 'collaborative' | 'content' | 'popular' | 'hybrid';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  excludeViewed?: boolean;
}

export class UpdatePreferenceDto {
  @IsEnum(PreferenceType)
  preferenceType: PreferenceType;

  @IsString()
  preferenceValue: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  strength: number;
}

export class RecommendationFeedbackDto {
  @IsString()
  userId: string;

  @IsString()
  productId: string;

  @IsString()
  algorithm: string;

  @IsBoolean()
  wasClicked: boolean;

  @IsOptional()
  @IsBoolean()
  wasAddedToCart?: boolean;

  @IsOptional()
  @IsBoolean()
  wasPurchased?: boolean;
}

export class SimilarProductsDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class BulkInteractionDto {
  @IsString()
  userId: string;

  interactions: {
    productId: string;
    interactionType: InteractionType;
    timestamp?: string;
    metadata?: any;
  }[];
}