import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { R2StorageProvider } from './r2-storage.provider';
import { LocalStorageProvider } from './local-storage.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [StorageService, R2StorageProvider, LocalStorageProvider],
  exports: [StorageService],
})
export class StorageModule {}
