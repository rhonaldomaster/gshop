import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IIvsService, IVSChannel, IVSChannelWithKey, IVSStreamKey } from './interfaces/ivs-service.interface';

/**
 * Mock AWS IVS Service
 * Simulates AWS Interactive Video Service operations without requiring real credentials
 * Used for development/testing when AWS credentials are not available
 * Automatically switches to real AWS service when AWS_IVS_ENABLED=true
 */

@Injectable()
export class AwsIvsMockService implements IIvsService {
  private channels: Map<string, IVSChannel> = new Map();
  private streamKeys: Map<string, IVSStreamKey> = new Map();

  /**
   * Create a new IVS channel with stream key
   */
  async createChannel(name: string): Promise<IVSChannelWithKey> {
    const channelId = uuidv4();
    const streamKeyId = uuidv4();
    const streamKeyValue = this.generateStreamKey();

    // Mock channel ARN
    const channelArn = `arn:aws:ivs:us-east-1:123456789012:channel/${channelId}`;
    const streamKeyArn = `arn:aws:ivs:us-east-1:123456789012:stream-key/${streamKeyId}`;

    // Create mock channel
    const channel: IVSChannel = {
      arn: channelArn,
      name,
      latencyMode: 'LOW',
      type: 'STANDARD',
      // Mock RTMP ingest endpoint
      ingestEndpoint: `rtmps://mock-ingest.ivs.amazonaws.com:443/app`,
      // Mock HLS playback URL
      playbackUrl: `https://mock-playback.ivs.amazonaws.com/v1/${channelId}/index.m3u8`,
    };

    // Create mock stream key
    const streamKey: IVSStreamKey = {
      arn: streamKeyArn,
      value: streamKeyValue,
      channelArn,
    };

    // Store in memory
    this.channels.set(channelArn, channel);
    this.streamKeys.set(streamKeyArn, streamKey);

    console.log(`[AWS IVS MOCK] Created channel: ${channelArn}`);
    console.log(`[AWS IVS MOCK] Stream key: ${streamKeyValue}`);

    return {
      channel,
      streamKey,
    };
  }

  /**
   * Get channel details
   */
  async getChannel(channelArn: string): Promise<IVSChannel | null> {
    return this.channels.get(channelArn) || null;
  }

  /**
   * Delete channel
   */
  async deleteChannel(channelArn: string): Promise<void> {
    // Find and delete associated stream keys
    for (const [keyArn, key] of this.streamKeys.entries()) {
      if (key.channelArn === channelArn) {
        this.streamKeys.delete(keyArn);
      }
    }

    this.channels.delete(channelArn);
    console.log(`[AWS IVS MOCK] Deleted channel: ${channelArn}`);
  }

  /**
   * Get stream key for channel
   */
  async getStreamKey(channelArn: string): Promise<IVSStreamKey | null> {
    for (const key of this.streamKeys.values()) {
      if (key.channelArn === channelArn) {
        return key;
      }
    }
    return null;
  }

  /**
   * Get thumbnail URL for stream
   */
  getThumbnailUrl(channelArn: string): string {
    return `https://mock-s3.amazonaws.com/thumbnails/${channelArn}/latest.jpg`;
  }

  /**
   * Get recording URL for stream
   */
  getRecordingUrl(channelArn: string): string {
    return `https://mock-s3.amazonaws.com/recordings/${channelArn}/recording.mp4`;
  }

  /**
   * Simulate webhook callback when stream goes live
   * In production, this would be triggered by AWS IVS
   */
  simulateStreamStartWebhook(channelArn: string): void {
    console.log(`[AWS IVS MOCK] Stream started webhook: ${channelArn}`);
    // TODO: Implement webhook handler
  }

  /**
   * Simulate webhook callback when stream ends
   */
  simulateStreamEndWebhook(channelArn: string): void {
    console.log(`[AWS IVS MOCK] Stream ended webhook: ${channelArn}`);
    // TODO: Implement webhook handler
  }

  /**
   * Generate a random stream key
   */
  private generateStreamKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'sk_';
    for (let i = 0; i < 40; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }
}
