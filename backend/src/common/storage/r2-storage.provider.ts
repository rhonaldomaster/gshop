import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider } from './storage.interface';
import * as path from 'path';

@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;
  private available = false;

  constructor(private configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME', 'gshop-products');
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL', '');

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'R2 credentials not configured. Falling back to local storage. ' +
        'Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY to enable R2.',
      );
      return;
    }

    try {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      this.available = true;
      this.logger.log('✅ Cloudflare R2 storage initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize R2 client:', error);
      this.available = false;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new Error('R2 client not initialized');
    }

    const sanitizedFilename = this.sanitizeFilename(filename);
    const key = `products/${sanitizedFilename}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      const url = this.getFileUrl(key);
      this.logger.log(`File uploaded to R2: ${url}`);

      return url;
    } catch (error) {
      this.logger.error('Failed to upload file to R2:', error);
      throw new Error('Failed to upload file to R2');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('R2 client not initialized');
    }

    try {
      // Extract key from URL
      const key = this.extractKeyFromUrl(fileUrl);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted from R2: ${key}`);
    } catch (error) {
      this.logger.error('Failed to delete file from R2:', error);
      // Don't throw, just log - file might already be deleted
    }
  }

  getFileUrl(filename: string): string {
    // If filename is already a full key (products/...), use as-is
    // Otherwise, prefix with products/
    const key = filename.startsWith('products/') ? filename : `products/${filename}`;

    // Return absolute R2 URL
    return `${this.publicUrl}/${key}`;
  }

  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    const sanitized = name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    return `${sanitized}-${uniqueSuffix}${ext}`;
  }

  private extractKeyFromUrl(url: string): string {
    // Extract key from R2 public URL
    // https://pub-xxxxx.r2.dev/products/image.jpg -> products/image.jpg
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading /
    } catch {
      // If not a valid URL, assume it's already a key
      return url;
    }
  }
}
