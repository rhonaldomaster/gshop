/**
 * AWS IVS Service Interface
 * Common interface for both mock and real AWS IVS implementations
 */

export interface IVSChannel {
  arn: string;
  name: string;
  latencyMode: 'LOW' | 'NORMAL';
  type: 'BASIC' | 'STANDARD';
  ingestEndpoint: string;
  playbackUrl: string;
}

export interface IVSStreamKey {
  arn: string;
  value: string;
  channelArn: string;
}

export interface IVSChannelWithKey {
  channel: IVSChannel;
  streamKey: IVSStreamKey;
}

export interface IIvsService {
  /**
   * Create a new IVS channel with stream key
   */
  createChannel(name: string): Promise<IVSChannelWithKey>;

  /**
   * Get channel details by ARN
   */
  getChannel(channelArn: string): Promise<IVSChannel | null>;

  /**
   * Delete channel and associated stream keys
   */
  deleteChannel(channelArn: string): Promise<void>;

  /**
   * Get stream key for channel
   */
  getStreamKey(channelArn: string): Promise<IVSStreamKey | null>;

  /**
   * Get thumbnail URL for stream
   */
  getThumbnailUrl(channelArn: string): string;

  /**
   * Get recording URL for stream
   */
  getRecordingUrl(channelArn: string): string;

  /**
   * List all existing IVS channels
   */
  listChannels(): Promise<IVSChannel[]>;

  /**
   * Get an existing channel with its stream key (for reuse)
   */
  getExistingChannelWithKey(channelArn: string): Promise<IVSChannelWithKey | null>;
}
