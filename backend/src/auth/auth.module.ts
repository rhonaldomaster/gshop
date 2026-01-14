
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { HttpModule } from '@nestjs/axios';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import { SocialAuthService } from './services/social-auth.service';
import { AuthController } from './auth.controller';
import { AuthSellerController } from './auth-seller.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User } from '../database/entities/user.entity';
import { Affiliate } from '../affiliates/entities/affiliate.entity';
import { UsersModule } from '../users/users.module';
import { SellersModule } from '../sellers/sellers.module';
import { StorageModule } from '../common/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Affiliate]),
    UsersModule,
    SellersModule,
    StorageModule,
    PassportModule,
    HttpModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max for avatars
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AuthSellerController],
  providers: [AuthService, SocialAuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
