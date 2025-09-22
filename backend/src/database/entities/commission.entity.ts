
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum CommissionType {
  PLATFORM = 'platform',
  SELLER = 'seller',
  REFERRAL = 'referral',
}

@Entity('commissions')
export class Commission {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ enum: CommissionType })
  @Column({
    type: 'enum',
    enum: CommissionType,
  })
  type: CommissionType;

  @ApiProperty()
  @Column('decimal', { precision: 5, scale: 2 })
  rate: number;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minAmount: number;

  @ApiProperty()
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maxAmount: number;

  @ApiProperty()
  @Column({ nullable: true })
  description: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
