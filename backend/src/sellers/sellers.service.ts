import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import * as PDFDocument from 'pdfkit'
import { Seller, SellerType, DocumentType, VerificationStatus } from './entities/seller.entity'
import { SellerLocation } from './entities/seller-location.entity'
import { Withdrawal, WithdrawalStatus } from './entities/withdrawal.entity'
import { Order, OrderStatus } from '../database/entities/order.entity'
import { User, UserRole, UserStatus } from '../database/entities/user.entity'
import { Affiliate } from '../affiliates/entities/affiliate.entity'
import { AffiliateProduct, AffiliateProductStatus } from '../affiliates/entities/affiliate-product.entity'
import { Product } from '../products/product.entity'
import { CreateSellerDto } from './dto/create-seller.dto'
import { SellerLoginDto } from './dto/seller-login.dto'
import { UploadDocumentsDto } from './dto/upload-documents.dto'
import { UpdateShippingConfigDto } from './dto/update-shipping-config.dto'
import { AddSellerLocationDto } from './dto/add-seller-location.dto'
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ApproveAffiliateProductDto, UpdateCommissionDto, UpdateStatusDto } from './dto/update-affiliate-product.dto'
import { EmailService } from '../email/email.service'

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller)
    private sellersRepository: Repository<Seller>,
    @InjectRepository(SellerLocation)
    private locationsRepository: Repository<SellerLocation>,
    @InjectRepository(Withdrawal)
    private withdrawalsRepository: Repository<Withdrawal>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Affiliate)
    private affiliatesRepository: Repository<Affiliate>,
    @InjectRepository(AffiliateProduct)
    private affiliateProductsRepository: Repository<AffiliateProduct>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
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

    // Verificar duplicados en sellers
    const existingSeller = await this.sellersRepository.findOne({
      where: [
        { email: createSellerDto.email },
        { documentNumber: createSellerDto.documentNumber },
      ],
    })

    if (existingSeller) {
      throw new ConflictException('Ya existe un vendedor con este email o documento')
    }

    // Verificar duplicados en users
    const existingUser = await this.userRepository.findOne({
      where: { email: createSellerDto.email },
    })

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email')
    }

    const hashedPassword = await bcrypt.hash(createSellerDto.password, 10)
    const now = new Date()
    const termsVersion = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Create user entry first (for foreign key constraints in products, orders, etc.)
    const user = this.userRepository.create({
      email: createSellerDto.email,
      password: hashedPassword,
      firstName: createSellerDto.ownerName.split(' ')[0] || 'Seller',
      lastName: createSellerDto.ownerName.split(' ').slice(1).join(' ') || 'Account',
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      businessName: createSellerDto.businessName,
      phone: createSellerDto.phone,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      acceptedTermsVersion: termsVersion,
    })

    const savedUser = await this.userRepository.save(user)

    // Create seller entry with same ID as user
    const seller = this.sellersRepository.create({
      ...createSellerDto,
      id: savedUser.id, // Use same ID as user for consistency
      passwordHash: hashedPassword,
      commissionRate: createSellerDto.commissionRate || 7.0,
      verificationStatus: VerificationStatus.PENDING,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      acceptedTermsVersion: termsVersion,
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

    // Try to find corresponding user in users table (for legacy sellers with products)
    const user = await this.userRepository.findOne({
      where: { email: seller.email }
    })

    const payload = {
      sellerId: seller.id,
      userId: user?.id, // Include userId if exists (for legacy compatibility with products)
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

  /**
   * Get all active and verified sellers for affiliate live streams
   */
  async getActiveSellers() {
    const sellers = await this.sellersRepository
      .createQueryBuilder('seller')
      .leftJoin('seller.products', 'product')
      .where('seller.isActive = :isActive', { isActive: true })
      .andWhere('seller.verificationStatus = :status', { status: VerificationStatus.APPROVED })
      .select([
        'seller.id',
        'seller.businessName',
        'seller.ownerName',
        'seller.businessCategory',
        'seller.city',
        'seller.state',
      ])
      .addSelect('COUNT(product.id)', 'productCount')
      .groupBy('seller.id')
      .orderBy('seller.businessName', 'ASC')
      .getRawMany()

    return sellers.map(seller => ({
      id: seller.seller_id,
      businessName: seller.seller_businessName,
      storeName: seller.seller_businessName,
      ownerName: seller.seller_ownerName,
      businessCategory: seller.seller_businessCategory,
      city: seller.seller_city,
      state: seller.seller_state,
      productCount: parseInt(seller.productCount, 10) || 0,
    }))
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

    // Create withdrawal record
    const withdrawal = this.withdrawalsRepository.create({
      sellerId,
      amount,
      status: WithdrawalStatus.PENDING,
    })

    await this.withdrawalsRepository.save(withdrawal)

    return {
      message: 'Withdrawal request submitted',
      withdrawalId: withdrawal.id,
      amount,
      remainingBalance: seller.availableBalance
    }
  }

  /**
   * Get seller own withdrawal history
   */
  async getSellerWithdrawals(sellerId: string, status?: string, limit: number = 20) {
    const queryBuilder = this.withdrawalsRepository
      .createQueryBuilder('withdrawal')
      .where('withdrawal.sellerId = :sellerId', { sellerId })
      .orderBy('withdrawal.createdAt', 'DESC')
      .limit(limit)

    if (status && status !== 'all') {
      queryBuilder.andWhere('withdrawal.status = :status', { status })
    }

    const withdrawals = await queryBuilder.getMany()
    const total = await queryBuilder.getCount()

    return {
      withdrawals,
      total,
    }
  }

  /**
   * Get all withdrawal requests (Admin only)
   */
  async getAllWithdrawals(status?: string, search?: string) {
    const queryBuilder = this.withdrawalsRepository
      .createQueryBuilder('withdrawal')
      .leftJoinAndSelect('withdrawal.seller', 'seller')
      .select([
        'withdrawal',
        'seller.id',
        'seller.businessName',
        'seller.email',
      ])

    if (status && status !== 'all') {
      queryBuilder.andWhere('withdrawal.status = :status', { status })
    }

    if (search) {
      queryBuilder.andWhere(
        '(seller.businessName ILIKE :search OR seller.email ILIKE :search)',
        { search: `%${search}%` }
      )
    }

    queryBuilder.orderBy('withdrawal.requestedAt', 'DESC')

    return await queryBuilder.getMany()
  }

  /**
   * Approve withdrawal request (Admin only)
   */
  async approveWithdrawal(withdrawalId: string, adminId: string, notes?: string) {
    const withdrawal = await this.withdrawalsRepository.findOne({
      where: { id: withdrawalId },
      relations: ['seller'],
    })

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found')
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Withdrawal has already been processed')
    }

    const seller = withdrawal.seller

    // Move money from pending to paid
    seller.pendingBalance = Number(seller.pendingBalance) - Number(withdrawal.amount)
    seller.totalEarnings = Number(seller.totalEarnings) + Number(withdrawal.amount)

    await this.sellersRepository.save(seller)

    // Update withdrawal status
    withdrawal.status = WithdrawalStatus.COMPLETED
    withdrawal.processedAt = new Date()
    withdrawal.processedBy = adminId
    withdrawal.notes = notes || null

    await this.withdrawalsRepository.save(withdrawal)

    return {
      message: 'Withdrawal approved successfully',
      withdrawal,
    }
  }

  /**
   * Reject withdrawal request (Admin only)
   */
  async rejectWithdrawal(withdrawalId: string, adminId: string, notes: string) {
    const withdrawal = await this.withdrawalsRepository.findOne({
      where: { id: withdrawalId },
      relations: ['seller'],
    })

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found')
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Withdrawal has already been processed')
    }

    if (!notes) {
      throw new BadRequestException('Rejection reason is required')
    }

    const seller = withdrawal.seller

    // Return money from pending back to available
    seller.pendingBalance = Number(seller.pendingBalance) - Number(withdrawal.amount)
    seller.availableBalance = Number(seller.availableBalance) + Number(withdrawal.amount)

    await this.sellersRepository.save(seller)

    // Update withdrawal status
    withdrawal.status = WithdrawalStatus.REJECTED
    withdrawal.processedAt = new Date()
    withdrawal.processedBy = adminId
    withdrawal.notes = notes

    await this.withdrawalsRepository.save(withdrawal)

    return {
      message: 'Withdrawal rejected',
      withdrawal,
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
    // Remove passwords and add kycStatus mapping for frontend compatibility
    return sellers.map(({ passwordHash, ...seller }) => ({
      ...seller,
      kycStatus: seller.verificationStatus, // Map verificationStatus to kycStatus for frontend
    })) as any[]
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

  // Commission Management Methods

  // TODO: These methods are temporarily disabled until sellerId is added to Order entity
  // The commission system requires Orders to have a direct seller relation
  // For now, admin commission tracking via /admin/commissions works, but seller-specific views don't
  async getSellerCommissions(sellerId: string, month: number, year: number) {
    // Temporary mock response until Order entity has sellerId
    return {
      totalSales: 0,
      totalCommissions: 0,
      netIncome: 0,
      totalOrders: 0,
      commissionRate: '0.00',
      orders: [],
      monthlyTrend: [],
    }

    /* Original implementation - requires Order.sellerId:
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const orders = await this.orderRepository.find({
      where: {
        sellerId,
        status: OrderStatus.DELIVERED,
        deliveredAt: Between(startDate, endDate),
      },
      relations: ['items'],
    })

    const totalSales = orders.reduce((sum, o) => {
      const subtotal = o.items.reduce((s, i) => s + Number(i.totalPrice), 0) - (Number(o.discountAmount) || 0)
      return sum + subtotal
    }, 0)

    const totalCommissions = orders.reduce((sum, o) => sum + (o.sellerCommissionAmount || 0), 0)
    const netIncome = totalSales - totalCommissions
    const avgCommissionRate = orders.length > 0
      ? orders.reduce((sum, o) => sum + (o.sellerCommissionRate || 0), 0) / orders.length
      : 0

    const monthlyTrend = await this.getMonthlyTrend(sellerId, year)

    return {
      totalSales,
      totalCommissions,
      netIncome,
      totalOrders: orders.length,
      commissionRate: avgCommissionRate.toFixed(2),
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        deliveredAt: o.deliveredAt,
        subtotal: o.items.reduce((s, i) => s + Number(i.totalPrice), 0) - (Number(o.discountAmount) || 0),
        commissionRate: o.sellerCommissionRate || 0,
        commissionAmount: o.sellerCommissionAmount || 0,
        netAmount: o.sellerNetAmount || 0,
        commissionStatus: o.commissionStatus,
      })),
      monthlyTrend,
    }
    */
  }

  private async getMonthlyTrend(sellerId: string, year: number) {
    // Temporary mock response
    return []

    /* Original implementation - requires Order.sellerId:
    const trend = []

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)

      const orders = await this.orderRepository.find({
        where: {
          sellerId,
          status: OrderStatus.DELIVERED,
          deliveredAt: Between(startDate, endDate),
        },
        relations: ['items'],
      })

      const sales = orders.reduce((sum, o) => {
        const subtotal = o.items.reduce((s, i) => s + Number(i.totalPrice), 0) - (Number(o.discountAmount) || 0)
        return sum + subtotal
      }, 0)

      const commissions = orders.reduce((sum, o) => sum + (o.sellerCommissionAmount || 0), 0)

      trend.push({
        month: new Date(year, month - 1).toLocaleString('es', { month: 'short' }),
        sales,
        commissions,
        netIncome: sales - commissions,
      })
    }

    return trend
    */
  }

  async generateCommissionReportPDF(sellerId: string, month: number, year: number): Promise<Buffer> {
    const data = await this.getSellerCommissions(sellerId, month, year)
    const seller = await this.findOne(sellerId)

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      doc.fontSize(20).text('Reporte de Comisiones', { align: 'center' })
      doc.moveDown()
      doc.fontSize(12).text(`Vendedor: ${seller.businessName}`, { align: 'center' })
      doc.text(`Período: ${month}/${year}`, { align: 'center' })
      doc.moveDown(2)

      // Summary Section
      doc.fontSize(14).text('Resumen', { underline: true })
      doc.moveDown()
      doc.fontSize(11)
      doc.text(`Ventas Totales: $${data.totalSales.toLocaleString('es-CO')}`)
      doc.text(`Comisiones Cobradas: $${data.totalCommissions.toLocaleString('es-CO')} (${data.commissionRate}%)`)
      doc.text(`Ingresos Netos: $${data.netIncome.toLocaleString('es-CO')}`)
      doc.text(`Total Órdenes: ${data.totalOrders}`)
      doc.moveDown(2)

      // Orders Table
      doc.fontSize(14).text('Detalle de Órdenes', { underline: true })
      doc.moveDown()

      if (data.orders.length === 0) {
        doc.fontSize(10).text('No hay órdenes en este período')
      } else {
        // Table headers
        doc.fontSize(9)
        const tableTop = doc.y
        const colWidths = {
          order: 80,
          date: 70,
          subtotal: 70,
          rate: 50,
          commission: 70,
          net: 70,
        }

        doc.text('Orden', 50, tableTop)
        doc.text('Fecha', 50 + colWidths.order, tableTop)
        doc.text('Subtotal', 50 + colWidths.order + colWidths.date, tableTop)
        doc.text('Tasa', 50 + colWidths.order + colWidths.date + colWidths.subtotal, tableTop)
        doc.text('Comisión', 50 + colWidths.order + colWidths.date + colWidths.subtotal + colWidths.rate, tableTop)
        doc.text('Neto', 50 + colWidths.order + colWidths.date + colWidths.subtotal + colWidths.rate + colWidths.commission, tableTop)

        doc.moveDown()
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
        doc.moveDown()

        // Table rows
        data.orders.forEach((order) => {
          const rowY = doc.y
          doc.text(order.orderNumber, 50, rowY, { width: colWidths.order })
          doc.text(
            new Date(order.deliveredAt).toLocaleDateString('es-CO'),
            50 + colWidths.order,
            rowY,
            { width: colWidths.date }
          )
          doc.text(
            `$${order.subtotal.toLocaleString('es-CO')}`,
            50 + colWidths.order + colWidths.date,
            rowY,
            { width: colWidths.subtotal }
          )
          doc.text(
            `${order.commissionRate}%`,
            50 + colWidths.order + colWidths.date + colWidths.subtotal,
            rowY,
            { width: colWidths.rate }
          )
          doc.text(
            `$${order.commissionAmount.toLocaleString('es-CO')}`,
            50 + colWidths.order + colWidths.date + colWidths.subtotal + colWidths.rate,
            rowY,
            { width: colWidths.commission }
          )
          doc.text(
            `$${order.netAmount.toLocaleString('es-CO')}`,
            50 + colWidths.order + colWidths.date + colWidths.subtotal + colWidths.rate + colWidths.commission,
            rowY,
            { width: colWidths.net }
          )
          doc.moveDown()
        })
      }

      // Footer
      doc.moveDown(2)
      doc.fontSize(8).text(
        `Generado el ${new Date().toLocaleString('es-CO')}`,
        { align: 'center' }
      )

      doc.end()
    })
  }

  async updateProfile(sellerId: string, updateProfileDto: UpdateSellerProfileDto) {
    const seller = await this.sellersRepository.findOne({ where: { id: sellerId } })

    if (!seller) {
      throw new NotFoundException('Vendedor no encontrado')
    }

    // If email is being changed, check it doesn't exist
    if (updateProfileDto.email && updateProfileDto.email !== seller.email) {
      const existingWithEmail = await this.sellersRepository.findOne({
        where: { email: updateProfileDto.email },
      })

      if (existingWithEmail) {
        throw new ConflictException('Ya existe un vendedor con este email')
      }

      // Also update user table
      await this.userRepository.update(
        { id: sellerId },
        { email: updateProfileDto.email }
      )
    }

    // Update seller
    Object.assign(seller, updateProfileDto)
    const updatedSeller = await this.sellersRepository.save(seller)

    // Also update relevant fields in user table
    if (updateProfileDto.businessName || updateProfileDto.phone) {
      await this.userRepository.update(
        { id: sellerId },
        {
          ...(updateProfileDto.businessName && { businessName: updateProfileDto.businessName }),
          ...(updateProfileDto.phone && { phone: updateProfileDto.phone }),
        }
      )
    }

    // Return seller without password
    const { passwordHash, ...sellerWithoutPassword } = updatedSeller
    return sellerWithoutPassword
  }

  async changePassword(sellerId: string, changePasswordDto: ChangePasswordDto) {
    const seller = await this.sellersRepository.findOne({ where: { id: sellerId } })

    if (!seller) {
      throw new NotFoundException('Vendedor no encontrado')
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      seller.passwordHash
    )

    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10)

    // Update password in seller table
    seller.passwordHash = hashedPassword
    await this.sellersRepository.save(seller)

    // Also update password in user table
    await this.userRepository.update(
      { id: sellerId },
      { password: hashedPassword }
    )

    return { message: 'Contraseña actualizada exitosamente' }
  }

  // AFFILIATE MANAGEMENT METHODS

  async getSellerAffiliates(sellerId: string) {
    // Get all affiliate products for this seller with affiliate details
    const affiliateProducts = await this.affiliateProductsRepository
      .createQueryBuilder('ap')
      .leftJoinAndSelect('ap.affiliate', 'affiliate')
      .leftJoinAndSelect('ap.product', 'product')
      .where('ap.sellerId = :sellerId', { sellerId })
      .getMany()

    // Group by affiliate and calculate totals
    const affiliatesMap = new Map()

    for (const ap of affiliateProducts) {
      const affiliateId = ap.affiliateId

      if (!affiliatesMap.has(affiliateId)) {
        affiliatesMap.set(affiliateId, {
          affiliateId,
          affiliate: {
            username: ap.affiliate.username,
            name: ap.affiliate.name,
            email: ap.affiliate.email,
            avatarUrl: ap.affiliate.avatarUrl,
            followersCount: ap.affiliate.followersCount,
            isVerified: ap.affiliate.isVerified || false,
          },
          productsCount: 0,
          totalClicks: 0,
          totalSales: 0,
          totalRevenue: 0,
          totalCommissions: 0,
          pendingApprovals: 0,
          lastSaleAt: null,
        })
      }

      const affiliateData = affiliatesMap.get(affiliateId)
      affiliateData.productsCount++
      affiliateData.totalClicks += ap.totalClicks || 0
      affiliateData.totalSales += ap.totalSales || 0
      affiliateData.totalRevenue += parseFloat(ap.totalRevenue?.toString() || '0')
      affiliateData.totalCommissions += parseFloat(ap.totalCommissions?.toString() || '0')

      if (ap.requiresApproval && !ap.approvedAt) {
        affiliateData.pendingApprovals++
      }
    }

    const affiliates = Array.from(affiliatesMap.values())

    // Calculate stats
    const stats = {
      totalAffiliates: affiliates.length,
      activeAffiliates: affiliates.filter(a => a.productsCount > 0).length,
      pendingApprovals: affiliates.reduce((sum, a) => sum + a.pendingApprovals, 0),
      totalSales: affiliates.reduce((sum, a) => sum + a.totalSales, 0),
      totalCommissions: affiliates.reduce((sum, a) => sum + a.totalCommissions, 0),
    }

    return { affiliates, stats }
  }

  async getSellerProductsWithAffiliates(sellerId: string) {
    // Get seller's products
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.sellerId = :sellerId', { sellerId })
      .getMany()

    // For each product, get affiliate data
    const productsWithAffiliates = await Promise.all(
      products.map(async (product) => {
        const affiliateProducts = await this.affiliateProductsRepository
          .createQueryBuilder('ap')
          .leftJoinAndSelect('ap.affiliate', 'affiliate')
          .where('ap.productId = :productId', { productId: product.id })
          .getMany()

        const totalClicks = affiliateProducts.reduce((sum, ap) => sum + (ap.totalClicks || 0), 0)
        const totalSales = affiliateProducts.reduce((sum, ap) => sum + (ap.totalSales || 0), 0)
        const totalRevenue = affiliateProducts.reduce((sum, ap) => sum + parseFloat(ap.totalRevenue?.toString() || '0'), 0)
        const pendingApprovals = affiliateProducts.filter(
          ap => ap.requiresApproval && !ap.approvedAt
        ).length

        return {
          productId: product.id,
          product: {
            name: product.name,
            price: product.price,
            imageUrl: product.images?.[0] || null,
          },
          affiliatesCount: affiliateProducts.length,
          totalClicks,
          totalSales,
          totalRevenue,
          pendingApprovals,
          affiliateProducts: affiliateProducts.map(ap => ({
            id: ap.id,
            status: ap.status,
            customCommissionRate: ap.customCommissionRate,
            totalSales: ap.totalSales,
            affiliate: {
              id: ap.affiliateId,
              username: ap.affiliate.username,
              name: ap.affiliate.name,
            },
          })),
        }
      })
    )

    return { products: productsWithAffiliates }
  }

  async approveAffiliateProduct(
    sellerId: string,
    affiliateProductId: string,
    dto: ApproveAffiliateProductDto,
  ) {
    const affiliateProduct = await this.affiliateProductsRepository.findOne({
      where: { id: affiliateProductId },
      relations: ['product'],
    })

    if (!affiliateProduct) {
      throw new NotFoundException('Relación afiliado-producto no encontrada')
    }

    // Verify seller owns the product
    if (affiliateProduct.sellerId !== sellerId) {
      throw new BadRequestException('No tienes permiso para aprobar este afiliado')
    }

    // Update status
    if (dto.approved) {
      affiliateProduct.status = AffiliateProductStatus.ACTIVE
      affiliateProduct.approvedAt = new Date()
      affiliateProduct.approvedBy = sellerId
      affiliateProduct.rejectionReason = null
    } else {
      if (!dto.notes) {
        throw new BadRequestException('Debes proporcionar una razón para rechazar')
      }
      affiliateProduct.status = AffiliateProductStatus.REJECTED
      affiliateProduct.rejectionReason = dto.notes
    }

    return this.affiliateProductsRepository.save(affiliateProduct)
  }

  async updateAffiliateProductCommission(
    sellerId: string,
    affiliateProductId: string,
    rate: number,
  ) {
    // Validate rate
    if (rate < 1 || rate > 50) {
      throw new BadRequestException('La comisión debe estar entre 1% y 50%')
    }

    const affiliateProduct = await this.affiliateProductsRepository.findOne({
      where: { id: affiliateProductId },
    })

    if (!affiliateProduct) {
      throw new NotFoundException('Relación afiliado-producto no encontrada')
    }

    // Verify seller owns the product
    if (affiliateProduct.sellerId !== sellerId) {
      throw new BadRequestException('No tienes permiso para modificar este afiliado')
    }

    affiliateProduct.customCommissionRate = rate
    return this.affiliateProductsRepository.save(affiliateProduct)
  }

  async updateAffiliateProductStatus(
    sellerId: string,
    affiliateProductId: string,
    status: 'active' | 'paused',
  ) {
    const affiliateProduct = await this.affiliateProductsRepository.findOne({
      where: { id: affiliateProductId },
    })

    if (!affiliateProduct) {
      throw new NotFoundException('Relación afiliado-producto no encontrada')
    }

    // Verify seller owns the product
    if (affiliateProduct.sellerId !== sellerId) {
      throw new BadRequestException('No tienes permiso para modificar este afiliado')
    }

    // Only allow active <-> paused transitions
    if (status === 'active') {
      affiliateProduct.status = AffiliateProductStatus.ACTIVE
    } else if (status === 'paused') {
      affiliateProduct.status = AffiliateProductStatus.PAUSED
    }

    return this.affiliateProductsRepository.save(affiliateProduct)
  }

  async getAffiliateDetails(sellerId: string, affiliateId: string) {
    // Get affiliate info
    const affiliate = await this.affiliatesRepository.findOne({
      where: { id: affiliateId },
    })

    if (!affiliate) {
      throw new NotFoundException('Afiliado no encontrado')
    }

    // Get all products this affiliate promotes for the seller
    const affiliateProducts = await this.affiliateProductsRepository
      .createQueryBuilder('ap')
      .leftJoinAndSelect('ap.product', 'product')
      .where('ap.affiliateId = :affiliateId', { affiliateId })
      .andWhere('ap.sellerId = :sellerId', { sellerId })
      .getMany()

    const products = affiliateProducts.map(ap => ({
      affiliateProductId: ap.id,
      productId: ap.productId,
      productName: ap.product.name,
      productPrice: ap.product.price,
      productImageUrl: ap.product.images?.[0] || null,
      status: ap.status,
      customCommissionRate: ap.customCommissionRate,
      specialPrice: ap.specialPrice,
      totalClicks: ap.totalClicks,
      totalSales: ap.totalSales,
      totalRevenue: ap.totalRevenue,
      totalCommissions: ap.totalCommissions,
      createdAt: ap.createdAt,
    }))

    return {
      affiliate: {
        id: affiliate.id,
        username: affiliate.username,
        name: affiliate.name,
        email: affiliate.email,
        phone: affiliate.phone,
        avatarUrl: affiliate.avatarUrl,
        bio: affiliate.bio,
        website: affiliate.website,
        socialMedia: affiliate.socialMedia,
        followersCount: affiliate.followersCount,
        followingCount: affiliate.followingCount,
        totalViews: affiliate.totalViews,
        totalSales: affiliate.totalSales,
        videosCount: affiliate.videosCount,
        isVerified: affiliate.isVerified || false,
        commissionRate: affiliate.commissionRate,
      },
      products,
      stats: {
        totalProductsPromoted: products.length,
        totalClicks: products.reduce((sum, p) => sum + (p.totalClicks || 0), 0),
        totalSales: products.reduce((sum, p) => sum + (p.totalSales || 0), 0),
        totalRevenue: products.reduce((sum, p) => sum + parseFloat(p.totalRevenue?.toString() || '0'), 0),
        totalCommissions: products.reduce((sum, p) => sum + parseFloat(p.totalCommissions?.toString() || '0'), 0),
      },
    }
  }

  async searchSellers(
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    sellers: any[]
    total: number
    page: number
    totalPages: number
  }> {
    const offset = (page - 1) * limit
    const searchTerm = `%${query.toLowerCase()}%`

    const queryBuilder = this.sellersRepository
      .createQueryBuilder('seller')
      .where('seller.verificationStatus = :status', { status: VerificationStatus.APPROVED })
      .andWhere('seller.isProfilePublic = :isPublic', { isPublic: true })
      .andWhere('seller.isActive = :isActive', { isActive: true })

    if (query.trim()) {
      queryBuilder.andWhere(
        '(LOWER(seller.businessName) LIKE :search OR LOWER(seller.ownerName) LIKE :search)',
        { search: searchTerm },
      )
    }

    const [sellers, total] = await queryBuilder
      .orderBy('seller.followersCount', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount()

    // Get product counts for each seller
    const sellerIds = sellers.map((s) => s.id)
    let productCounts: Record<string, number> = {}

    if (sellerIds.length > 0) {
      const counts = await this.productsRepository
        .createQueryBuilder('product')
        .select('product.sellerId', 'sellerId')
        .addSelect('COUNT(*)', 'count')
        .where('product.sellerId IN (:...ids)', { ids: sellerIds })
        .andWhere('product.status = :status', { status: 'active' })
        .groupBy('product.sellerId')
        .getRawMany()

      productCounts = counts.reduce((acc, c) => {
        acc[c.sellerId] = parseInt(c.count, 10)
        return acc
      }, {} as Record<string, number>)
    }

    const results = sellers.map((seller) => ({
      id: seller.id,
      businessName: seller.businessName,
      logoUrl: seller.logoUrl,
      profileDescription: seller.profileDescription,
      isVerified: seller.verificationStatus === VerificationStatus.APPROVED,
      followersCount: seller.followersCount,
      productsCount: productCounts[seller.id] || 0,
      city: seller.city,
      state: seller.state,
    }))

    return {
      sellers: results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }
}