import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider } from './storage.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'products');
    this.ensureUploadDirExists();
    this.logger.log('📁 Local file storage initialized (development mode)');
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  isAvailable(): boolean {
    return true; // Always available as fallback
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    const sanitizedFilename = this.sanitizeFilename(filename);
    const filePath = path.join(this.uploadDir, sanitizedFilename);

    try {
      await fs.promises.writeFile(filePath, file);
      this.logger.log(`File saved locally: ${sanitizedFilename}`);

      // Return RELATIVE path (important for ngrok/different hosts)
      return `/uploads/products/${sanitizedFilename}`;
    } catch (error) {
      this.logger.error('Failed to save file locally:', error);
      throw new Error('Failed to save file locally');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract filename from URL (/uploads/products/image.jpg -> image.jpg)
      const filename = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, filename);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`File deleted locally: ${filename}`);
      }
    } catch (error) {
      this.logger.error('Failed to delete file locally:', error);
      // Don't throw, just log
    }
  }

  getFileUrl(filename: string): string {
    // Return RELATIVE path for local files
    // This allows the frontend to prepend NEXT_PUBLIC_API_URL
    return `/uploads/products/${filename}`;
  }

  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    const sanitized = name
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    return `product-${sanitized}-${uniqueSuffix}${ext}`;
  }
}
