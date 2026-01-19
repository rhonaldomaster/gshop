import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LiveStream } from './live.entity';

export enum VodStatus {
  PROCESSING = 'processing',
  AVAILABLE = 'available',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export enum StorageProvider {
  R2 = 'r2',
  S3 = 's3',
  CLOUDFLARE_STREAM = 'cloudflare_stream',
}

@Entity('live_stream_vods')
@Index(['streamId'])
@Index(['status'])
@Index(['createdAt'])
export class LiveStreamVod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  streamId: string;

  @ManyToOne(() => LiveStream, (stream) => stream.vods, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'streamId' })
  stream: LiveStream;

  @Column({
    type: 'enum',
    enum: StorageProvider,
    default: StorageProvider.R2,
  })
  storageProvider: StorageProvider;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column('int', { default: 0 })
  duration: number;

  @Column('bigint', { default: 0 })
  fileSize: number;

  @Column('int', { default: 0 })
  viewCount: number;

  @Column({
    type: 'enum',
    enum: VodStatus,
    default: VodStatus.PROCESSING,
  })
  status: VodStatus;

  @Column({ nullable: true })
  s3Bucket: string;

  @Column({ nullable: true })
  s3Key: string;

  @Column({ nullable: true })
  r2Key: string;

  @Column({ nullable: true })
  hlsManifestUrl: string;

  @Column('simple-array', { nullable: true })
  qualities: string[];

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
