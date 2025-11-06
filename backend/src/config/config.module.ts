import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { ConfigListener } from './config.listener';
import { PlatformConfig } from '../database/entities/platform-config.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformConfig]),
    CommonModule, // Import for AuditLogService
  ],
  controllers: [ConfigController],
  providers: [ConfigService, ConfigListener],
  exports: [ConfigService], // Export for use in other modules
})
export class ConfigModule {}
