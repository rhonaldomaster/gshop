import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ProductsUploadService {
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'products');
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getMulterConfig() {
    return {
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, this.uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          const sanitizedName = file.originalname
            .replace(ext, '')
            .replace(/[^a-zA-Z0-9]/g, '-')
            .toLowerCase();
          cb(null, `product-${sanitizedName}-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Only allow images
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only image files are allowed (JPEG, PNG, JPG, GIF, WEBP)',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB maximum
      },
    };
  }

  getFileUrl(filename: string): string {
    const baseUrl = this.configService.get<string>(
      'API_URL',
      'http://localhost:3000',
    );
    return `${baseUrl}/uploads/products/${filename}`;
  }

  deleteFile(fileUrl: string): void {
    try {
      const filename = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  deleteMultipleFiles(fileUrls: string[]): void {
    fileUrls.forEach((url) => this.deleteFile(url));
  }
}
