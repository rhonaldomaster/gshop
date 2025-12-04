import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider } from './storage.interface';
import { R2StorageProvider } from './r2-storage.provider';
import { LocalStorageProvider } from './local-storage.provider';

@Injectable()
export class StorageService implements StorageProvider {
  private readonly logger = new Logger(StorageService.name);
  private activeProvider: StorageProvider;

  constructor(
    private r2Provider: R2StorageProvider,
    private localProvider: LocalStorageProvider,
  ) {
    // Choose provider based on availability
    if (this.r2Provider.isAvailable()) {
      this.activeProvider = this.r2Provider;
      this.logger.log('🌐 Using Cloudflare R2 for file storage');
    } else {
      this.activeProvider = this.localProvider;
      this.logger.log('📁 Using local file storage (development mode)');
    }
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    return this.activeProvider.uploadFile(file, filename, contentType);
  }

  async deleteFile(fileUrl: string): Promise<void> {
    return this.activeProvider.deleteFile(fileUrl);
  }

  getFileUrl(filename: string): string {
    return this.activeProvider.getFileUrl(filename);
  }

  isAvailable(): boolean {
    return this.activeProvider.isAvailable();
  }

  /**
   * Get the name of the currently active storage provider
   */
  getProviderName(): string {
    if (this.activeProvider === this.r2Provider) {
      return 'Cloudflare R2';
    }
    return 'Local Storage';
  }

  /**
   * Check if using R2 (production) storage
   */
  isUsingR2(): boolean {
    return this.activeProvider === this.r2Provider;
  }
}
