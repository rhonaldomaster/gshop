import { Injectable } from '@nestjs/common';
import { StorageService } from '../common/storage/storage.service';

@Injectable()
export class ProductsUploadService {
  constructor(private storageService: StorageService) {}

  /**
   * Upload a file buffer to storage (R2 or local)
   * @param file - File buffer
   * @param filename - Original filename
   * @param contentType - MIME type
   * @returns URL to access the file
   */
  async uploadFile(
    file: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    return this.storageService.uploadFile(file, filename, contentType);
  }

  /**
   * Get file URL (handles both R2 absolute URLs and local relative paths)
   * @param filename - Filename or key
   * @returns URL to access the file
   */
  getFileUrl(filename: string): string {
    return this.storageService.getFileUrl(filename);
  }

  /**
   * Delete a file from storage
   * @param fileUrl - URL or key of the file
   */
  async deleteFile(fileUrl: string): Promise<void> {
    return this.storageService.deleteFile(fileUrl);
  }

  /**
   * Delete multiple files from storage
   * @param fileUrls - Array of URLs or keys
   */
  async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    await Promise.all(fileUrls.map((url) => this.deleteFile(url)));
  }

  /**
   * Get the name of the active storage provider
   */
  getProviderName(): string {
    return this.storageService.getProviderName();
  }

  /**
   * Check if using R2 storage
   */
  isUsingR2(): boolean {
    return this.storageService.isUsingR2();
  }
}
