import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VodStatus, StorageProvider } from '../vod.entity';

export class VodResponseDto {
  id: string;
  streamId: string;
  videoUrl: string;
  thumbnailUrl: string;
  hlsManifestUrl: string;
  duration: number;
  fileSize: number;
  viewCount: number;
  status: VodStatus;
  storageProvider: StorageProvider;
  qualities: string[];
  createdAt: Date;
  processedAt: Date;

  // Stream info
  stream?: {
    id: string;
    title: string;
    description: string;
    hostType: string;
    sellerId: string;
    affiliateId: string;
    thumbnailUrl: string;
    totalSales: number;
    peakViewers: number;
    category: string;
    tags: string[];
  };

  // Host info
  host?: {
    id: string;
    name: string;
    avatar: string;
    type: 'seller' | 'affiliate';
  };

  // Products shown during the stream
  products?: Array<{
    id: string;
    name: string;
    price: number;
    specialPrice?: number;
    imageUrl: string;
    orderCount: number;
  }>;
}

export class VodListResponseDto {
  vods: VodResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}

export class VodQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @IsUUID()
  affiliateId?: string;

  @IsOptional()
  @IsEnum(VodStatus)
  status?: VodStatus;

  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateVodFromStreamDto {
  @IsUUID()
  streamId: string;
}

export class IVSRecordingWebhookDto {
  @IsString()
  stream_id: string;

  @IsString()
  recording_s3_bucket_name: string;

  @IsString()
  recording_s3_key_prefix: string;

  @IsNumber()
  recording_duration_ms: number;

  @IsString()
  recording_status: 'RECORDING_ENDED' | 'RECORDING_STARTED' | 'RECORDING_FAILED';

  @IsString()
  channel_arn: string;
}

export class VodStatsDto {
  vodId: string;
  viewCount: number;
  duration: number;
  fileSize: number;
  createdAt: Date;
  streamStats: {
    totalSales: number;
    peakViewers: number;
    totalOrders: number;
  };
}
