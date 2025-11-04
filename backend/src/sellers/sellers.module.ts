import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import { SellersController } from './sellers.controller'
import { SellersService } from './sellers.service'
import { SellersUploadService } from './sellers-upload.service'
import { Seller } from './entities/seller.entity'
import { EmailModule } from '../email/email.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Seller]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    ConfigModule,
    EmailModule,
  ],
  controllers: [SellersController],
  providers: [SellersService, SellersUploadService],
  exports: [SellersService],
})
export class SellersModule {}