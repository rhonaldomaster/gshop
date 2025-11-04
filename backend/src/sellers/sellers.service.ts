import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { Seller, SellerType, DocumentType, VerificationStatus } from './entities/seller.entity'
import { SellerLocation } from './entities/seller-location.entity'
import { CreateSellerDto } from './dto/create-seller.dto'
import { SellerLoginDto } from './dto/seller-login.dto'
import { UploadDocumentsDto } from './dto/upload-documents.dto'
import { UpdateShippingConfigDto } from './dto/update-shipping-config.dto'
import { AddSellerLocationDto } from './dto/add-seller-location.dto'
import { EmailService } from '../email/email.service'

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
    @InjectRepository(SellerLocation)
    private locationsRepository: Repository<SellerLocation>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(createSellerDto: CreateSellerDto) {
    // Validar que el titular de la cuenta coincida con el dueño
    if (createSellerDto.bankAccountHolder.toLowerCase() !== createSellerDto.ownerName.toLowerCase()) {
      throw new BadRequestException(
        'El titular de la cuenta bancaria debe coincidir con el nombre del propietario',
      )
    }

    // Validar que NIT solo sea para personas jurídicas
    if (createSellerDto.documentType === DocumentType.NIT && createSellerDto.sellerType !== SellerType.JURIDICA) {
      throw new BadRequestException('El NIT solo es válido para personas jurídicas')
    }

    // Validar que personas jurídicas usen NIT
    if (createSellerDto.sellerType === SellerType.JURIDICA && createSellerDto.documentType !== DocumentType.NIT) {
      throw new BadRequestException('Las personas jurídicas deben usar NIT')
    }

    // Verificar duplicados
    const existingSeller = await this.sellersRepository.findOne({
      where: [
        { email: createSellerDto.email },
        { documentNumber: createSellerDto.documentNumber },
      ],
    })

    if (existingSeller) {
      throw new ConflictException('Ya existe un vendedor con este email o documento')
    }

    const hashedPassword = await bcrypt.hash(createSellerDto.password, 10)

    const seller = this.sellersRepository.create({
      ...createSellerDto,
      passwordHash: hashedPassword,
      commissionRate: createSellerDto.commissionRate || 7.0,
      verificationStatus: VerificationStatus.PENDING,
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

  // Colombian KYC Methods

  async uploadDocuments(sellerId: string, uploadDocumentsDto: UploadDocumentsDto): Promise<Seller> {
    const seller = await this.sellersRepository.findOne({ where: { id: sellerId } })

    if (!seller) {
      throw new NotFoundException('Vendedor no encontrado')
    }

    // Actualizar URLs de documentos
    seller.rutFileUrl = uploadDocumentsDto.rutFileUrl
    seller.comercioFileUrl = uploadDocumentsDto.comercioFileUrl

    if (uploadDocumentsDto.comercioExpirationDate) {
      seller.comercioExpirationDate = new Date(uploadDocumentsDto.comercioExpirationDate)

      // Validar que el certificado no tenga más de 30 días
      const daysDiff = Math.floor(
        (Date.now() - seller.comercioExpirationDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (daysDiff > 30) {
        throw new BadRequestException(
          'El certificado de Cámara de Comercio debe tener máximo 30 días de expedición',
        )
      }
    }

    // Cambiar estado a documents_uploaded
    seller.verificationStatus = VerificationStatus.DOCUMENTS_UPLOADED

    return this.sellersRepository.save(seller)
  }

  async verifySeller(
    sellerId: string,
    adminId: string,
    action: 'approve' | 'reject' | 'needs_update',
    message?: string,
  ): Promise<Seller> {
    const seller = await this.sellersRepository.findOne({ where: { id: sellerId } })

    if (!seller) {
      throw new NotFoundException('Vendedor no encontrado')
    }

    seller.reviewedBy = adminId
    seller.adminMessage = message || null
    seller.adminMessageDate = message ? new Date() : null

    if (action === 'approve') {
      seller.verificationStatus = VerificationStatus.APPROVED
      seller.rutVerified = true
      seller.rutVerificationDate = new Date()
      seller.comercioVerified = !!seller.comercioFileUrl
      seller.verifiedAt = new Date()
      seller.verifiedBy = adminId
      seller.status = 'approved'

      // Enviar email de aprobación
      await this.emailService.sendSellerApprovalEmail(seller.email, seller.businessName)
    } else if (action === 'reject') {
      seller.verificationStatus = VerificationStatus.REJECTED
      seller.verificationNotes = message || 'Documentos rechazados'
      seller.status = 'rejected'

      // Enviar email de rechazo
      await this.emailService.sendSellerRejectionEmail(
        seller.email,
        seller.businessName,
        message || 'No se especificó un motivo',
      )
    } else if (action === 'needs_update') {
      seller.verificationStatus = VerificationStatus.NEEDS_UPDATE
      seller.verificationNotes = message || 'Se requiere actualización de datos'
      seller.status = 'pending'

      // Enviar email solicitando actualización
      await this.emailService.sendSellerUpdateRequestEmail(
        seller.email,
        seller.businessName,
        message || 'Se requiere actualización de algunos datos',
      )
    }

    return this.sellersRepository.save(seller)
  }

  async getPendingVerifications(): Promise<Seller[]> {
    return this.sellersRepository.find({
      where: [
        { verificationStatus: VerificationStatus.PENDING },
        { verificationStatus: VerificationStatus.DOCUMENTS_UPLOADED },
        { verificationStatus: VerificationStatus.UNDER_REVIEW },
        { verificationStatus: VerificationStatus.NEEDS_UPDATE },
      ],
      order: { createdAt: 'ASC' },
    })
  }

  async getAllSellers(): Promise<Seller[]> {
    const sellers = await this.sellersRepository.find({
      order: { createdAt: 'DESC' },
    })
    // Remove passwords from all sellers
    return sellers.map(({ passwordHash, ...seller }) => seller) as any[]
  }

  // NUEVOS MÉTODOS: Shipping Configuration

  async updateShippingConfig(
    sellerId: string,
    updateShippingConfigDto: UpdateShippingConfigDto,
  ): Promise<Seller> {
    const seller = await this.sellersRepository.findOne({
      where: { id: sellerId }
    })

    if (!seller) {
      throw new NotFoundException('Vendedor no encontrado')
    }

    // Actualizar configuración de envío
    seller.shippingLocalPrice = updateShippingConfigDto.shippingLocalPrice
    seller.shippingNationalPrice = updateShippingConfigDto.shippingNationalPrice
    seller.shippingFreeEnabled = updateShippingConfigDto.shippingFreeEnabled
    seller.shippingFreeMinAmount = updateShippingConfigDto.shippingFreeMinAmount

    return this.sellersRepository.save(seller)
  }

  async getShippingConfig(sellerId: string): Promise<{
    shippingLocalPrice: number
    shippingNationalPrice: number
    shippingFreeEnabled: boolean
    shippingFreeMinAmount?: number
    locations: SellerLocation[]
  }> {
    const seller = await this.sellersRepository.findOne({
      where: { id: sellerId },
      relations: ['locations']
    })

    if (!seller) {
      throw new NotFoundException('Vendedor no encontrado')
    }

    return {
      shippingLocalPrice: seller.shippingLocalPrice,
      shippingNationalPrice: seller.shippingNationalPrice,
      shippingFreeEnabled: seller.shippingFreeEnabled,
      shippingFreeMinAmount: seller.shippingFreeMinAmount,
      locations: seller.locations || [],
    }
  }

  // NUEVOS MÉTODOS: Seller Locations

  async addLocation(
    sellerId: string,
    addLocationDto: AddSellerLocationDto,
  ): Promise<SellerLocation> {
    const seller = await this.sellersRepository.findOne({
      where: { id: sellerId },
      relations: ['locations']
    })

    if (!seller) {
      throw new NotFoundException('Vendedor no encontrado')
    }

    // Verificar si ya existe esta ubicación
    const existingLocation = await this.locationsRepository.findOne({
      where: {
        sellerId,
        city: addLocationDto.city,
        state: addLocationDto.state,
      }
    })

    if (existingLocation) {
      throw new BadRequestException('Esta ubicación ya está registrada')
    }

    // Si es la primera ubicación, marcarla como primaria
    const isPrimary = seller.locations.length === 0 || addLocationDto.isPrimary

    const location = this.locationsRepository.create({
      sellerId,
      city: addLocationDto.city,
      state: addLocationDto.state,
      isPrimary,
      address: addLocationDto.address,
    })

    return this.locationsRepository.save(location)
  }

  async removeLocation(sellerId: string, locationId: string): Promise<void> {
    const location = await this.locationsRepository.findOne({
      where: { id: locationId, sellerId }
    })

    if (!location) {
      throw new NotFoundException('Ubicación no encontrada')
    }

    // No permitir eliminar si es la última ubicación
    const count = await this.locationsRepository.count({ where: { sellerId } })
    if (count <= 1) {
      throw new BadRequestException('No puedes eliminar la última ubicación')
    }

    await this.locationsRepository.remove(location)
  }

  async getLocations(sellerId: string): Promise<SellerLocation[]> {
    return this.locationsRepository.find({
      where: { sellerId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' }
    })
  }
}