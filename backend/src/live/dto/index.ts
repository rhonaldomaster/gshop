import { IsString, IsOptional, IsNumber, IsDateString, IsUUID, IsBoolean, IsEnum } from 'class-validator';
import { HostType } from '../live.entity';

export class CreateLiveStreamDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsEnum(HostType)
  hostType?: HostType;

  @IsOptional()
  @IsUUID()
  affiliateId?: string;
}

export class UpdateLiveStreamDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class AddProductToStreamDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsNumber()
  specialPrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SendMessageDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  username: string;

  @IsString()
  message: string;
}

export class JoinStreamDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export { LiveDashboardStatsDto, LiveStreamAnalyticsDto } from './live-stats.dto';
export { NativeStreamCredentialsDto, StreamMethodDto, OBSSetupInfoDto } from './native-stream.dto';
export {
  VodResponseDto,
  VodListResponseDto,
  VodQueryDto,
  CreateVodFromStreamDto,
  IVSRecordingWebhookDto,
  VodStatsDto,
} from './vod.dto';