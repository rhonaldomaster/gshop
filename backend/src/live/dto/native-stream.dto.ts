import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for native streaming credentials
 * Used when mobile apps need to broadcast directly to AWS IVS
 */
export class NativeStreamCredentialsDto {
  @ApiProperty({
    description: 'RTMP ingest endpoint for streaming',
    example: 'rtmps://abc123.global-contribute.live-video.net:443/app',
  })
  ingestEndpoint: string;

  @ApiProperty({
    description: 'Stream key for authentication',
    example: 'sk_us-east-1_abcdefghij1234567890',
  })
  streamKey: string;

  @ApiProperty({
    description: 'AWS IVS Channel ARN',
    example: 'arn:aws:ivs:us-east-1:123456789012:channel/abcd1234',
  })
  channelArn: string;

  @ApiProperty({
    description: 'HLS playback URL for viewers',
    example: 'https://abc123.us-east-1.playback.live-video.net/api/video/v1/us-east-1.123456789012.channel.abcd1234.m3u8',
  })
  playbackUrl: string;

  @ApiProperty({
    description: 'Stream ID',
    example: 'uuid-of-the-stream',
  })
  streamId: string;

  @ApiProperty({
    description: 'Stream title',
    example: 'My Live Shopping Stream',
  })
  title: string;

  @ApiProperty({
    description: 'Recommended video bitrate in kbps',
    example: 2500,
  })
  recommendedBitrate: number;

  @ApiProperty({
    description: 'Recommended video resolution',
    example: '720p',
  })
  recommendedResolution: string;

  @ApiProperty({
    description: 'Maximum allowed bitrate in kbps',
    example: 8500,
  })
  maxBitrate: number;
}

/**
 * DTO for stream method selection
 */
export class StreamMethodDto {
  @ApiProperty({
    description: 'Streaming method',
    enum: ['native', 'obs', 'rtmp_external'],
    example: 'native',
  })
  method: 'native' | 'obs' | 'rtmp_external';
}

/**
 * DTO for OBS setup information
 */
export class OBSSetupInfoDto {
  @ApiProperty({
    description: 'RTMP Server URL for OBS',
    example: 'rtmps://abc123.global-contribute.live-video.net:443/app',
  })
  rtmpUrl: string;

  @ApiProperty({
    description: 'Stream Key for OBS',
    example: 'sk_us-east-1_abcdefghij1234567890',
  })
  streamKey: string;

  @ApiProperty({
    description: 'QR code data URL for easy mobile scanning',
    example: 'data:image/png;base64,...',
  })
  qrCodeDataUrl?: string;

  @ApiProperty({
    description: 'Recommended OBS settings',
  })
  recommendedSettings: {
    encoder: string;
    bitrate: number;
    keyframeInterval: number;
    resolution: string;
    fps: number;
  };
}
