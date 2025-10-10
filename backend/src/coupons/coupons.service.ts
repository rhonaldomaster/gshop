import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Coupon,
  CouponType,
  CouponStatus,
} from '../database/entities/coupon.entity';

interface CreateCouponDto {
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  validFrom?: Date;
  validUntil?: Date;
}

interface ValidateCouponResult {
  valid: boolean;
  coupon?: Coupon;
  discount: number;
  message?: string;
}

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  /**
   * Create new coupon
   */
  async create(dto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.couponRepository.findOne({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    const coupon = this.couponRepository.create({
      ...dto,
      code: dto.code.toUpperCase(),
      status: CouponStatus.ACTIVE,
    });

    return this.couponRepository.save(coupon);
  }

  /**
   * Find coupon by code
   */
  async findByCode(code: string): Promise<Coupon | null> {
    return this.couponRepository.findOne({
      where: { code: code.toUpperCase() },
    });
  }

  /**
   * Validate coupon and calculate discount
   */
  async validateCoupon(
    code: string,
    cartSubtotal: number,
  ): Promise<ValidateCouponResult> {
    const coupon = await this.findByCode(code);

    if (!coupon) {
      return {
        valid: false,
        discount: 0,
        message: 'Invalid coupon code',
      };
    }

    // Check status
    if (coupon.status !== CouponStatus.ACTIVE) {
      return {
        valid: false,
        discount: 0,
        message: 'This coupon is not active',
      };
    }

    // Check dates
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return {
        valid: false,
        discount: 0,
        message: 'This coupon is not valid yet',
      };
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return {
        valid: false,
        discount: 0,
        message: 'This coupon has expired',
      };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        discount: 0,
        message: 'This coupon has reached its usage limit',
      };
    }

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount && cartSubtotal < coupon.minPurchaseAmount) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required`,
      };
    }

    // Calculate discount
    let discount = 0;

    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (cartSubtotal * Number(coupon.value)) / 100;
    } else if (coupon.type === CouponType.FIXED) {
      discount = Number(coupon.value);
    }

    // Apply max discount limit
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = Number(coupon.maxDiscountAmount);
    }

    // Don't allow discount to exceed cart total
    if (discount > cartSubtotal) {
      discount = cartSubtotal;
    }

    return {
      valid: true,
      coupon,
      discount,
    };
  }

  /**
   * Increment usage count
   */
  async incrementUsage(couponId: string): Promise<void> {
    await this.couponRepository.increment({ id: couponId }, 'usageCount', 1);
  }

  /**
   * Get all coupons
   */
  async findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get active coupons
   */
  async findActive(): Promise<Coupon[]> {
    const now = new Date();

    return this.couponRepository
      .createQueryBuilder('coupon')
      .where('coupon.status = :status', { status: CouponStatus.ACTIVE })
      .andWhere(
        '(coupon.validFrom IS NULL OR coupon.validFrom <= :now)',
        { now },
      )
      .andWhere(
        '(coupon.validUntil IS NULL OR coupon.validUntil >= :now)',
        { now },
      )
      .andWhere(
        '(coupon.usageLimit IS NULL OR coupon.usageCount < coupon.usageLimit)',
      )
      .orderBy('coupon.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Update coupon status
   */
  async updateStatus(id: string, status: CouponStatus): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    coupon.status = status;
    return this.couponRepository.save(coupon);
  }

  /**
   * Delete coupon
   */
  async delete(id: string): Promise<void> {
    const result = await this.couponRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('Coupon not found');
    }
  }
}
