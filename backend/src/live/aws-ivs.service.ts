import { ConfigService } from '@nestjs/config';
import { IIvsService, IVSChannel, IVSChannelWithKey, IVSStreamKey } from './interfaces/ivs-service.interface';

/**
 * Real AWS IVS Service
 * Connects to AWS Interactive Video Service using official SDK
 * Enabled when AWS_IVS_ENABLED=true in .env
 *
 * Required environment variables:
 * - AWS_IVS_ENABLED=true
 * - AWS_IVS_REGION=us-east-1
 * - AWS_IVS_ACCESS_KEY_ID=your-access-key
 * - AWS_IVS_SECRET_ACCESS_KEY=your-secret-key
 */

export class AwsIvsService implements IIvsService {
  private ivsClient: any; // Will be AWS.IVS from @aws-sdk/client-ivs
  private region: string;
  private s3BucketName: string;
  private cdnUrl: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_IVS_REGION', 'us-east-1');
    this.s3BucketName = this.configService.get('S3_BUCKET_NAME', 'gshop-live-streams');
    this.cdnUrl = this.configService.get('CDN_URL', 'https://cdn.gshop.com');

    // Initialize AWS IVS client
    this.initializeClient();
  }

  /**
   * Initialize AWS IVS client
   */
  private async initializeClient() {
    try {
      // Dynamic import to avoid errors when @aws-sdk/client-ivs is not installed
      const { IvsClient } = await import('@aws-sdk/client-ivs');

      this.ivsClient = new IvsClient({
        region: this.region,
        credentials: {
          accessKeyId: this.configService.get('AWS_IVS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_IVS_SECRET_ACCESS_KEY'),
        },
      });

      console.log(`[AWS IVS] Client initialized for region: ${this.region}`);
    } catch (error) {
      console.error('[AWS IVS] Failed to initialize client. Make sure @aws-sdk/client-ivs is installed:');
      console.error('  npm install @aws-sdk/client-ivs');
      throw new Error('AWS IVS SDK not found. Run: npm install @aws-sdk/client-ivs');
    }
  }

  /**
   * Create a new IVS channel with stream key
   */
  async createChannel(name: string): Promise<IVSChannelWithKey> {
    try {
      const { CreateChannelCommand, CreateStreamKeyCommand } = await import('@aws-sdk/client-ivs');

      // Create IVS channel
      const channelResponse = await this.ivsClient.send(
        new CreateChannelCommand({
          name,
          latencyMode: 'LOW', // LOW or NORMAL
          type: 'STANDARD', // STANDARD or BASIC
        })
      );

      const channel = channelResponse.channel;

      // Create stream key for the channel
      const streamKeyResponse = await this.ivsClient.send(
        new CreateStreamKeyCommand({
          channelArn: channel.arn,
        })
      );

      const streamKey = streamKeyResponse.streamKey;

      console.log(`[AWS IVS] Created channel: ${channel.arn}`);
      console.log(`[AWS IVS] Stream key: ${streamKey.value}`);

      return {
        channel: {
          arn: channel.arn,
          name: channel.name,
          latencyMode: channel.latencyMode,
          type: channel.type,
          ingestEndpoint: channel.ingestEndpoint,
          playbackUrl: channel.playbackUrl,
        },
        streamKey: {
          arn: streamKey.arn,
          value: streamKey.value,
          channelArn: streamKey.channelArn,
        },
      };
    } catch (error) {
      console.error('[AWS IVS] Error creating channel:', error);
      throw new Error(`Failed to create IVS channel: ${error.message}`);
    }
  }

  /**
   * Get channel details by ARN
   */
  async getChannel(channelArn: string): Promise<IVSChannel | null> {
    try {
      const { GetChannelCommand } = await import('@aws-sdk/client-ivs');

      const response = await this.ivsClient.send(
        new GetChannelCommand({
          arn: channelArn,
        })
      );

      const channel = response.channel;

      return {
        arn: channel.arn,
        name: channel.name,
        latencyMode: channel.latencyMode,
        type: channel.type,
        ingestEndpoint: channel.ingestEndpoint,
        playbackUrl: channel.playbackUrl,
      };
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        return null;
      }
      console.error('[AWS IVS] Error getting channel:', error);
      throw error;
    }
  }

  /**
   * Delete channel and associated stream keys
   */
  async deleteChannel(channelArn: string): Promise<void> {
    try {
      const { DeleteChannelCommand } = await import('@aws-sdk/client-ivs');

      await this.ivsClient.send(
        new DeleteChannelCommand({
          arn: channelArn,
        })
      );

      console.log(`[AWS IVS] Deleted channel: ${channelArn}`);
    } catch (error) {
      console.error('[AWS IVS] Error deleting channel:', error);
      throw error;
    }
  }

  /**
   * Get stream key for channel
   */
  async getStreamKey(channelArn: string): Promise<IVSStreamKey | null> {
    try {
      const { ListStreamKeysCommand } = await import('@aws-sdk/client-ivs');

      const response = await this.ivsClient.send(
        new ListStreamKeysCommand({
          channelArn,
        })
      );

      if (response.streamKeys && response.streamKeys.length > 0) {
        const streamKey = response.streamKeys[0];
        return {
          arn: streamKey.arn,
          value: streamKey.value,
          channelArn: streamKey.channelArn,
        };
      }

      return null;
    } catch (error) {
      console.error('[AWS IVS] Error getting stream key:', error);
      return null;
    }
  }

  /**
   * Get thumbnail URL for stream
   */
  getThumbnailUrl(channelArn: string): string {
    // Extract channel ID from ARN
    const channelId = channelArn.split('/').pop();
    return `${this.cdnUrl}/thumbnails/${channelId}/latest.jpg`;
  }

  /**
   * Get recording URL for stream
   */
  getRecordingUrl(channelArn: string): string {
    // Extract channel ID from ARN
    const channelId = channelArn.split('/').pop();
    return `${this.cdnUrl}/recordings/${channelId}/recording.mp4`;
  }
}
