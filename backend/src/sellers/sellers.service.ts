import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { Seller } from './entities/seller.entity'
import { CreateSellerDto } from './dto/create-seller.dto'
import { SellerLoginDto } from './dto/seller-login.dto'

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
    private jwtService: JwtService,
  ) {}

  async register(createSellerDto: CreateSellerDto) {
    const existingSeller = await this.sellersRepository.findOne({
      where: { email: createSellerDto.email }
    })

    if (existingSeller) {
      throw new ConflictException('Email already registered')
    }

    const hashedPassword = await bcrypt.hash(createSellerDto.password, 10)

    const seller = this.sellersRepository.create({
      ...createSellerDto,
      passwordHash: hashedPassword,
      commissionRate: createSellerDto.commissionRate || 7.0,
    })

    const savedSeller = await this.sellersRepository.save(seller)

    // Remove password from response
    const { passwordHash, ...sellerResponse } = savedSeller
    return sellerResponse
  }

  async login(sellerLoginDto: SellerLoginDto) {
    const seller = await this.sellersRepository.findOne({
      where: { email: sellerLoginDto.email }
    })

    if (!seller) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(sellerLoginDto.password, seller.passwordHash)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (!seller.isActive) {
      throw new UnauthorizedException('Account is deactivated')
    }

    const payload = {
      sellerId: seller.id,
      email: seller.email,
      type: 'seller'
    }
    const access_token = this.jwtService.sign(payload)

    const { passwordHash, ...sellerResponse } = seller

    return {
      access_token,
      seller: sellerResponse
    }
  }

  async findOne(id: string) {
    const seller = await this.sellersRepository.findOne({
      where: { id },
      relations: ['products']
    })

    if (!seller) {
      throw new NotFoundException('Seller not found')
    }

    const { passwordHash, ...sellerResponse } = seller
    return sellerResponse
  }

  async updateBalance(sellerId: string, amount: number, type: 'add' | 'subtract' = 'add') {
    const seller = await this.sellersRepository.findOne({ where: { id: sellerId } })

    if (!seller) {
      throw new NotFoundException('Seller not found')
    }

    if (type === 'add') {
      seller.availableBalance = Number(seller.availableBalance) + amount
      seller.totalEarnings = Number(seller.totalEarnings) + amount
    } else {
      seller.availableBalance = Number(seller.availableBalance) - amount
    }

    return this.sellersRepository.save(seller)
  }

  async requestWithdrawal(sellerId: string, amount: number) {
    const seller = await this.sellersRepository.findOne({ where: { id: sellerId } })

    if (!seller) {
      throw new NotFoundException('Seller not found')
    }

    if (Number(seller.availableBalance) < amount) {
      throw new ConflictException('Insufficient balance')
    }

    // Move money from available to pending
    seller.availableBalance = Number(seller.availableBalance) - amount
    seller.pendingBalance = Number(seller.pendingBalance) + amount

    await this.sellersRepository.save(seller)

    // TODO: Integrate with MercadoPago API for actual withdrawal
    // For now, just simulate the process

    return {
      message: 'Withdrawal request submitted',
      amount,
      remainingBalance: seller.availableBalance
    }
  }

  async getSellerStats(sellerId: string) {
    const seller = await this.sellersRepository.findOne({
      where: { id: sellerId },
      relations: ['products']
    })

    if (!seller) {
      throw new NotFoundException('Seller not found')
    }

    // TODO: Add more detailed stats from orders, commissions, etc.
    return {
      totalProducts: seller.products.length,
      totalEarnings: seller.totalEarnings,
      availableBalance: seller.availableBalance,
      pendingBalance: seller.pendingBalance,
      commissionRate: seller.commissionRate,
      status: seller.status
    }
  }
}