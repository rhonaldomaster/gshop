import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { SellersController } from './sellers.controller'
import { SellersService } from './sellers.service'
import { Seller } from './entities/seller.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Seller]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}