
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../database/entities/user.entity';
import { Order } from '../database/entities/order.entity';
import { Affiliate } from '../affiliates/entities/affiliate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order, Affiliate])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
