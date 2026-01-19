import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LiveStreamVod, VodStatus, StorageProvider } from './vod.entity';
import { LiveStream, StreamStatus, HostType } from './live.entity';
import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

export interface IVSRecordingEvent {
  stream_id: string;
  recording_s3_bucket_name: string;
  recording_s3_key_prefix: string;
  recording_duration_ms: number;
  recording_status: 'RECORDING_ENDED' | 'RECORDING_STARTED' | 'RECORDING_FAILED';
  channel_arn: string;
}

export interface VodListParams {
  page?: number;
  limit?: number;
  sellerId?: string;
  affiliateId?: string;
  status?: VodStatus;
}

@Injectable()
export class VodService {
  private readonly logger = new Logger(VodService.name);
  private s3Client: S3Client | null = null;
  private r2Client: S3Client | null = null;
  private r2BucketName: string;
  private r2PublicUrl: string;
  private ivsRecordingBucket: string;

  constructor(
    @InjectRepository(LiveStreamVod)
    private vodRepository: Repository<LiveStreamVod>,
    @InjectRepository(LiveStream)
    private liveStreamRepository: Repository<LiveStream>,
    private configService: ConfigService,
  ) {
    this.initializeClients();
  }

  private initializeClients() {
    // Initialize AWS S3 client for IVS recordings
    const awsAccessKeyId = this.configService.get<string>('AWS_IVS_ACCESS_KEY_ID');
    const awsSecretAccessKey = this.configService.get<string>('AWS_IVS_SECRET_ACCESS_KEY');
    const awsRegion = this.configService.get<string>('AWS_IVS_REGION', 'us-east-1');
    this.ivsRecordingBucket = this.configService.get<string>('AWS_IVS_RECORDING_S3_BUCKET', '');

    if (awsAccessKeyId && awsSecretAccessKey) {
      this.s3Client = new S3Client({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
      });
      this.logger.log('AWS S3 client initialized for IVS recordings');
    } else {
      this.logger.warn('AWS S3 credentials not configured - VOD features will use mock data');
    }

    // Initialize Cloudflare R2 client
    const r2AccountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const r2AccessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const r2SecretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.r2BucketName = this.configService.get<string>('R2_BUCKET_NAME', 'gshop-products');
    this.r2PublicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

    if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
      this.r2Client = new S3Client({
        region: 'auto',
        endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey,
        },
      });
      this.logger.log('Cloudflare R2 client initialized for VOD storage');
    } else {
      this.logger.warn('Cloudflare R2 credentials not configured');
    }
  }

  /**
   * Handle IVS recording webhook when recording completes
   * This is called by an AWS EventBridge or Lambda trigger
   */
  async handleRecordingComplete(event: IVSRecordingEvent): Promise<LiveStreamVod> {
    this.logger.log(`Processing recording complete event for channel: ${event.channel_arn}`);

    // Find the stream by IVS channel ARN
    const liveStream = await this.liveStreamRepository.findOne({
      where: { ivsChannelArn: event.channel_arn },
    });

    if (!liveStream) {
      throw new NotFoundException(`Stream not found for channel ARN: ${event.channel_arn}`);
    }

    // Check if VOD already exists for this stream
    const existingVod = await this.vodRepository.findOne({
      where: { streamId: liveStream.id },
    });

    if (existingVod && existingVod.status === VodStatus.AVAILABLE) {
      this.logger.warn(`VOD already exists for stream ${liveStream.id}`);
      return existingVod;
    }

    // Create or update VOD record
    const vod = existingVod || this.vodRepository.create({
      streamId: liveStream.id,
      status: VodStatus.PROCESSING,
    });

    vod.s3Bucket = event.recording_s3_bucket_name;
    vod.s3Key = event.recording_s3_key_prefix;
    vod.duration = Math.floor(event.recording_duration_ms / 1000);

    await this.vodRepository.save(vod);

    // If recording failed, mark as failed
    if (event.recording_status === 'RECORDING_FAILED') {
      vod.status = VodStatus.FAILED;
      vod.errorMessage = 'IVS recording failed';
      await this.vodRepository.save(vod);
      return vod;
    }

    // Start async process to copy from S3 to R2
    this.copyRecordingToR2(vod).catch(error => {
      this.logger.error(`Failed to copy recording to R2: ${error.message}`);
    });

    return vod;
  }

  /**
   * Copy IVS recording from S3 to Cloudflare R2
   */
  private async copyRecordingToR2(vod: LiveStreamVod): Promise<void> {
    if (!this.s3Client || !this.r2Client) {
      this.logger.warn('S3 or R2 client not initialized - skipping copy');
      // For development, create a mock VOD URL
      await this.createMockVod(vod);
      return;
    }

    try {
      this.logger.log(`Copying VOD ${vod.id} from S3 to R2...`);

      // List all files in the S3 recording prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: vod.s3Bucket,
        Prefix: vod.s3Key,
      });

      const listResult = await this.s3Client.send(listCommand);
      const files = listResult.Contents || [];

      if (files.length === 0) {
        throw new Error('No recording files found in S3');
      }

      // Find the main HLS manifest and video files
      const manifestFile = files.find(f => f.Key?.endsWith('.m3u8'));
      const videoFiles = files.filter(f => f.Key?.endsWith('.ts'));

      if (!manifestFile) {
        throw new Error('No HLS manifest found in recording');
      }

      // Create R2 key prefix for this VOD
      const r2KeyPrefix = `vod/${vod.id}`;

      // Copy all files to R2
      for (const file of files) {
        if (!file.Key) continue;

        const fileName = file.Key.split('/').pop();
        const r2Key = `${r2KeyPrefix}/${fileName}`;

        // Get the file from S3
        const getCommand = new GetObjectCommand({
          Bucket: vod.s3Bucket,
          Key: file.Key,
        });

        const s3Object = await this.s3Client.send(getCommand);
        const bodyContents = await s3Object.Body?.transformToByteArray();

        if (bodyContents) {
          // Upload to R2
          const putCommand = new PutObjectCommand({
            Bucket: this.r2BucketName,
            Key: r2Key,
            Body: bodyContents,
            ContentType: file.Key.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/mp2t',
          });

          await this.r2Client.send(putCommand);
          this.logger.debug(`Copied ${file.Key} to R2: ${r2Key}`);
        }
      }

      // Get total file size
      let totalSize = 0;
      for (const file of files) {
        totalSize += file.Size || 0;
      }

      // Update VOD record with R2 URLs
      const manifestFileName = manifestFile.Key?.split('/').pop();
      vod.r2Key = r2KeyPrefix;
      vod.hlsManifestUrl = `${this.r2PublicUrl}/${r2KeyPrefix}/${manifestFileName}`;
      vod.videoUrl = vod.hlsManifestUrl;
      vod.fileSize = totalSize;
      vod.storageProvider = StorageProvider.R2;
      vod.status = VodStatus.AVAILABLE;
      vod.processedAt = new Date();

      // Generate thumbnail from first frame (simplified - in production use FFmpeg)
      vod.thumbnailUrl = await this.generateThumbnail(vod);

      // Detect available qualities from HLS manifest
      vod.qualities = await this.detectQualities(vod);

      await this.vodRepository.save(vod);

      this.logger.log(`VOD ${vod.id} successfully copied to R2: ${vod.videoUrl}`);
    } catch (error) {
      this.logger.error(`Failed to copy VOD ${vod.id} to R2: ${error.message}`);
      vod.status = VodStatus.FAILED;
      vod.errorMessage = error.message;
      await this.vodRepository.save(vod);
    }
  }

  /**
   * Create a mock VOD for development without AWS
   */
  private async createMockVod(vod: LiveStreamVod): Promise<void> {
    this.logger.log(`Creating mock VOD for stream ${vod.streamId}`);

    // Get the original stream for thumbnail
    const stream = await this.liveStreamRepository.findOne({
      where: { id: vod.streamId },
    });

    vod.videoUrl = `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`; // Public test HLS stream
    vod.hlsManifestUrl = vod.videoUrl;
    vod.thumbnailUrl = stream?.thumbnailUrl || 'https://via.placeholder.com/640x360?text=VOD';
    vod.storageProvider = StorageProvider.R2;
    vod.status = VodStatus.AVAILABLE;
    vod.processedAt = new Date();
    vod.duration = vod.duration || 300; // 5 minutes mock duration
    vod.fileSize = 50 * 1024 * 1024; // 50MB mock size
    vod.qualities = ['720p', '480p', '360p'];

    await this.vodRepository.save(vod);
    this.logger.log(`Mock VOD created for stream ${vod.streamId}`);
  }

  /**
   * Generate thumbnail for VOD (simplified version)
   * In production, use FFmpeg or a media processing service
   */
  private async generateThumbnail(vod: LiveStreamVod): Promise<string> {
    // For now, use the stream's thumbnail
    const stream = await this.liveStreamRepository.findOne({
      where: { id: vod.streamId },
    });

    if (stream?.thumbnailUrl) {
      return stream.thumbnailUrl;
    }

    // Default placeholder thumbnail
    return `${this.r2PublicUrl}/vod/${vod.id}/thumbnail.jpg`;
  }

  /**
   * Detect available qualities from HLS manifest
   */
  private async detectQualities(vod: LiveStreamVod): Promise<string[]> {
    // AWS IVS typically provides these qualities
    return ['1080p', '720p', '480p', '360p'];
  }

  /**
   * Get VOD by ID
   */
  async findById(vodId: string): Promise<LiveStreamVod> {
    const vod = await this.vodRepository.findOne({
      where: { id: vodId },
      relations: ['stream', 'stream.seller', 'stream.affiliate', 'stream.products', 'stream.products.product'],
    });

    if (!vod) {
      throw new NotFoundException('VOD not found');
    }

    return vod;
  }

  /**
   * Get VOD by stream ID
   */
  async findByStreamId(streamId: string): Promise<LiveStreamVod | null> {
    return this.vodRepository.findOne({
      where: { streamId },
      relations: ['stream'],
    });
  }

  /**
   * Get all VODs with pagination and filters
   */
  async findAll(params: VodListParams): Promise<{
    vods: LiveStreamVod[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.vodRepository
      .createQueryBuilder('vod')
      .leftJoinAndSelect('vod.stream', 'stream')
      .leftJoinAndSelect('stream.seller', 'seller')
      .leftJoinAndSelect('stream.affiliate', 'affiliate');

    // Filter by status (default to AVAILABLE)
    const status = params.status || VodStatus.AVAILABLE;
    queryBuilder.where('vod.status = :status', { status });

    // Filter by seller
    if (params.sellerId) {
      queryBuilder.andWhere('stream.sellerId = :sellerId', { sellerId: params.sellerId });
    }

    // Filter by affiliate
    if (params.affiliateId) {
      queryBuilder.andWhere('stream.affiliateId = :affiliateId', { affiliateId: params.affiliateId });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('vod.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const vods = await queryBuilder.skip(skip).take(limit).getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      vods,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get VODs by seller ID
   */
  async findBySellerId(sellerId: string, page = 1, limit = 20): Promise<{
    vods: LiveStreamVod[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll({ sellerId, page, limit, status: VodStatus.AVAILABLE });
  }

  /**
   * Get VODs by affiliate ID
   */
  async findByAffiliateId(affiliateId: string, page = 1, limit = 20): Promise<{
    vods: LiveStreamVod[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll({ affiliateId, page, limit, status: VodStatus.AVAILABLE });
  }

  /**
   * Increment view count for a VOD
   */
  async incrementViewCount(vodId: string): Promise<void> {
    await this.vodRepository.increment({ id: vodId }, 'viewCount', 1);
  }

  /**
   * Delete a VOD
   */
  async deleteVod(vodId: string, hostId: string, hostType: HostType): Promise<void> {
    const vod = await this.findById(vodId);

    // Verify ownership
    if (hostType === HostType.SELLER && vod.stream.sellerId !== hostId) {
      throw new BadRequestException('You do not have permission to delete this VOD');
    }
    if (hostType === HostType.AFFILIATE && vod.stream.affiliateId !== hostId) {
      throw new BadRequestException('You do not have permission to delete this VOD');
    }

    // Mark as deleted (soft delete)
    vod.status = VodStatus.DELETED;
    await this.vodRepository.save(vod);

    this.logger.log(`VOD ${vodId} marked as deleted by ${hostType} ${hostId}`);

    // TODO: Queue background job to delete files from R2
  }

  /**
   * Create VOD manually from an ended stream
   * Useful for testing or when webhook fails
   */
  async createVodFromStream(streamId: string): Promise<LiveStreamVod> {
    const stream = await this.liveStreamRepository.findOne({
      where: { id: streamId },
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (stream.status !== StreamStatus.ENDED) {
      throw new BadRequestException('Can only create VOD from ended streams');
    }

    // Check if VOD already exists
    const existingVod = await this.vodRepository.findOne({
      where: { streamId },
    });

    if (existingVod) {
      return existingVod;
    }

    // Calculate duration from stream start/end times
    let duration = 0;
    if (stream.startedAt && stream.endedAt) {
      duration = Math.floor((stream.endedAt.getTime() - stream.startedAt.getTime()) / 1000);
    }

    // Create VOD record
    const vod = this.vodRepository.create({
      streamId: stream.id,
      status: VodStatus.PROCESSING,
      duration,
    });

    await this.vodRepository.save(vod);

    // Create mock VOD for development
    await this.createMockVod(vod);

    return vod;
  }

  /**
   * Get popular/trending VODs
   */
  async getTrendingVods(limit = 10): Promise<LiveStreamVod[]> {
    return this.vodRepository
      .createQueryBuilder('vod')
      .leftJoinAndSelect('vod.stream', 'stream')
      .leftJoinAndSelect('stream.seller', 'seller')
      .leftJoinAndSelect('stream.affiliate', 'affiliate')
      .where('vod.status = :status', { status: VodStatus.AVAILABLE })
      .orderBy('vod.viewCount', 'DESC')
      .addOrderBy('vod.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Get recent VODs
   */
  async getRecentVods(limit = 10): Promise<LiveStreamVod[]> {
    return this.vodRepository
      .createQueryBuilder('vod')
      .leftJoinAndSelect('vod.stream', 'stream')
      .leftJoinAndSelect('stream.seller', 'seller')
      .leftJoinAndSelect('stream.affiliate', 'affiliate')
      .where('vod.status = :status', { status: VodStatus.AVAILABLE })
      .orderBy('vod.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
