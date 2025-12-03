import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MulterModule } from '@nestjs/platform-express'
import { SellersController } from './sellers.controller'
import { SellersService } from './sellers.service'
import { SellersUploadService } from './sellers-upload.service'
import { Seller } from './entities/seller.entity'
import { SellerLocation } from './entities/seller-location.entity'
import { Withdrawal } from './entities/withdrawal.entity'
import { Order } from '../database/entities/order.entity'
import { User } from '../database/entities/user.entity'
import { EmailModule } from '../email/email.module'
import * as multer from 'multer'
import * as path from 'path'
import * as fs from 'fs'

@Module({
  imports: [
    TypeOrmModule.forFeature([Seller, SellerLocation, Withdrawal, Order, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    ConfigModule,
    EmailModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'sellers')

        // Ensure upload directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        return {
          storage: multer.diskStorage({
            destination: (req, file, cb) => {
              cb(null, uploadDir)
            },
            filename: (req, file, cb) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
              const ext = path.extname(file.originalname)
              cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
            },
          }),
          fileFilter: (req, file, cb) => {
            const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
            if (allowedMimes.includes(file.mimetype)) {
              cb(null, true)
            } else {
              cb(new Error('Solo se permiten archivos PDF o imágenes'), false)
            }
          },
          limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
          },
        }
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [SellersController],
  providers: [SellersService, SellersUploadService],
  exports: [SellersService],
})
export class SellersModule {}