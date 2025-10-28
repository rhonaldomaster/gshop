import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceSeller, MarketplaceProduct, Review, Inventory, Shipping } from './marketplace.entity';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

// Use /tmp for serverless (Vercel), ./uploads for local dev
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : './uploads';

// Ensure upload directory exists (only works locally or in /tmp)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketplaceSeller, MarketplaceProduct, Review, Inventory, Shipping]),
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}