import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch, Put, UseInterceptors, UploadedFiles, BadRequestException, Query, Res, ParseIntPipe, DefaultValuePipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { SellersService } from './sellers.service'
import { SellersUploadService } from './sellers-upload.service'
import { CreateSellerDto } from './dto/create-seller.dto'
import { SellerLoginDto } from './dto/seller-login.dto'
import { UpdateShippingConfigDto } from './dto/update-shipping-config.dto'
import { AddSellerLocationDto } from './dto/add-seller-location.dto'
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ApproveAffiliateProductDto, UpdateCommissionDto, UpdateStatusDto } from './dto/update-affiliate-product.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../database/entities/user.entity'

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(
    private readonly sellersService: SellersService,
    private readonly uploadService: SellersUploadService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new seller' })
  async register(@Body() createSellerDto: CreateSellerDto) {
    return this.sellersService.register(createSellerDto)
  }

  @Post('login')
  @ApiOperation({ summary: 'Seller login' })
  async login(@Body() sellerLoginDto: SellerLoginDto) {
    return this.sellersService.login(sellerLoginDto)
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller profile' })
  async getProfile(@Request() req) {
    return this.sellersService.findOne(req.user.sellerId)
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update seller profile' })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateSellerProfileDto) {
    return this.sellersService.updateProfile(req.user.sellerId, updateProfileDto)
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change seller password' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.sellersService.changePassword(req.user.sellerId, changePasswordDto)
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active and verified sellers for affiliate live streams' })
  async getActiveSellers() {
    return this.sellersService.getActiveSellers()
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller statistics' })
  async getStats(@Request() req) {
    return this.sellersService.getSellerStats(req.user.sellerId)
  }

  @Post('withdrawal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request withdrawal' })
  async requestWithdrawal(@Request() req, @Body() body: { amount: number }) {
    return this.sellersService.requestWithdrawal(req.user.sellerId, body.amount)
  }

  @Get('my-withdrawals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller own withdrawal history' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results (default: 20)' })
  async getMyWithdrawals(
    @Request() req,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20
    return this.sellersService.getSellerWithdrawals(req.user.sellerId, status, limitNum)
  }

  @Get('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all withdrawal requests (Admin only)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (pending, approved, rejected, completed)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by seller name or email' })
  async getAllWithdrawals(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.sellersService.getAllWithdrawals(status, search)
  }

  @Post('withdrawals/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve withdrawal request (Admin only)' })
  async approveWithdrawal(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { notes?: string },
  ) {
    return this.sellersService.approveWithdrawal(id, req.user.id, body.notes)
  }

  @Post('withdrawals/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject withdrawal request (Admin only)' })
  async rejectWithdrawal(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { notes: string },
  ) {
    return this.sellersService.rejectWithdrawal(id, req.user.id, body.notes)
  }

  @Get('search')
  @ApiOperation({ summary: 'Search sellers by name' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async searchSellers(
    @Query('q') query: string = '',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.sellersService.searchSellers(query, page || 1, limit || 20)
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular sellers' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of sellers to return' })
  async getPopularSellers(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.sellersService.getPopularSellers(limit || 10)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seller by ID' })
  async findOne(@Param('id') id: string) {
    return this.sellersService.findOne(id)
  }

  // Colombian KYC Endpoints

  @Post(':id/documents')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'rut', maxCount: 1 },
    { name: 'comercio', maxCount: 1 },
  ], {}))
  @ApiOperation({ summary: 'Upload seller documents (RUT and Cámara de Comercio) - Public endpoint for registration flow' })
  async uploadDocuments(
    @Param('id') sellerId: string,
    @UploadedFiles() files: { rut?: Express.Multer.File[]; comercio?: Express.Multer.File[] },
    @Body('comercioExpirationDate') comercioExpirationDate?: string,
  ) {
    const rutFile = files.rut?.[0]
    const comercioFile = files.comercio?.[0]

    if (!rutFile) {
      throw new BadRequestException('El archivo RUT es obligatorio')
    }

    const rutFileUrl = this.uploadService.getFileUrl(rutFile.filename)
    const comercioFileUrl = comercioFile ? this.uploadService.getFileUrl(comercioFile.filename) : null

    const seller = await this.sellersService.uploadDocuments(sellerId, {
      rutFileUrl,
      comercioFileUrl,
      comercioExpirationDate,
    })

    return {
      message: 'Documentos subidos exitosamente. Pendiente de verificación por el administrador.',
      seller,
    }
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all sellers (Admin only)' })
  async getAllSellers() {
    return this.sellersService.getAllSellers()
  }

  @Get('admin/pending-verifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pending seller verifications (Admin only)' })
  async getPendingVerifications() {
    return this.sellersService.getPendingVerifications()
  }

  @Put(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review seller application - approve, reject, or request update (Admin only)' })
  async reviewSeller(
    @Param('id') sellerId: string,
    @Body('action') action: 'approve' | 'reject' | 'needs_update',
    @Body('message') message: string,
    @Request() req,
  ) {
    const adminId = req.user.id || req.user.sellerId
    const seller = await this.sellersService.verifySeller(sellerId, adminId, action, message)

    const messages = {
      approve: 'Vendedor aprobado exitosamente',
      reject: 'Vendedor rechazado',
      needs_update: 'Solicitud de actualización enviada al vendedor',
    }

    return {
      message: messages[action],
      seller,
    }
  }

  // Keep old endpoint for backward compatibility
  @Put(':id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify or reject seller (Admin only) - DEPRECATED, use /review instead' })
  async verifySeller(
    @Param('id') sellerId: string,
    @Body('approved') approved: boolean,
    @Body('notes') notes: string,
    @Request() req,
  ) {
    const adminId = req.user.id || req.user.sellerId
    const action = approved ? 'approve' : 'reject'
    const seller = await this.sellersService.verifySeller(sellerId, adminId, action, notes)

    return {
      message: approved ? 'Vendedor aprobado exitosamente' : 'Vendedor rechazado',
      seller,
    }
  }

  // Shipping Configuration Endpoints

  @Put(':id/shipping-config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update seller shipping configuration' })
  async updateShippingConfig(
    @Param('id') sellerId: string,
    @Body() updateShippingConfigDto: UpdateShippingConfigDto,
  ) {
    const seller = await this.sellersService.updateShippingConfig(sellerId, updateShippingConfigDto)
    return {
      message: 'Configuración de envío actualizada exitosamente',
      seller,
    }
  }

  @Get(':id/shipping-config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller shipping configuration' })
  async getShippingConfig(@Param('id') sellerId: string) {
    return this.sellersService.getShippingConfig(sellerId)
  }

  // Seller Locations Endpoints

  @Get(':id/locations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all seller locations' })
  async getLocations(@Param('id') sellerId: string) {
    return this.sellersService.getLocations(sellerId)
  }

  @Post(':id/locations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add new seller location' })
  async addLocation(
    @Param('id') sellerId: string,
    @Body() addLocationDto: AddSellerLocationDto,
  ) {
    const location = await this.sellersService.addLocation(sellerId, addLocationDto)
    return {
      message: 'Ubicación agregada exitosamente',
      location,
    }
  }

  @Patch(':id/locations/:locationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove seller location' })
  async removeLocation(
    @Param('id') sellerId: string,
    @Param('locationId') locationId: string,
  ) {
    await this.sellersService.removeLocation(sellerId, locationId)
    return {
      message: 'Ubicación eliminada exitosamente',
    }
  }

  // Commission Management Endpoints

  @Get(':id/commissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller commissions by month and year' })
  async getSellerCommissions(
    @Param('id') sellerId: string,
    @Query('month') month: number,
    @Query('year') year: number,
    @Request() req,
  ) {
    // Ensure seller can only access their own data
    if (req.user.sellerId !== sellerId && !req.user.isAdmin) {
      throw new BadRequestException('No autorizado para ver estas comisiones')
    }

    return this.sellersService.getSellerCommissions(sellerId, Number(month), Number(year))
  }

  @Get(':id/commissions/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download seller commission report as PDF' })
  async downloadCommissionReport(
    @Param('id') sellerId: string,
    @Query('month') month: number,
    @Query('year') year: number,
    @Request() req,
    @Res() res: Response,
  ) {
    // Ensure seller can only access their own data
    if (req.user.sellerId !== sellerId && !req.user.isAdmin) {
      throw new BadRequestException('No autorizado para descargar este reporte')
    }

    const pdf = await this.sellersService.generateCommissionReportPDF(
      sellerId,
      Number(month),
      Number(year),
    )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=comisiones_${year}_${month}.pdf`,
    )
    return res.send(pdf)
  }

  // AFFILIATE MANAGEMENT ENDPOINTS

  @Get(':id/affiliates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller affiliates' })
  async getSellerAffiliates(@Param('id') sellerId: string, @Request() req) {
    // Validar que req.user.sellerId === sellerId
    if (req.user.sellerId !== sellerId && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('No autorizado para ver estos afiliados')
    }

    return this.sellersService.getSellerAffiliates(sellerId)
  }

  @Get(':id/affiliate-products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get seller products with affiliates' })
  async getSellerProductsWithAffiliates(@Param('id') sellerId: string, @Request() req) {
    // Validar que req.user.sellerId === sellerId
    if (req.user.sellerId !== sellerId && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('No autorizado para ver estos productos')
    }

    return this.sellersService.getSellerProductsWithAffiliates(sellerId)
  }

  @Put(':sellerId/affiliate-products/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve/reject affiliate for product' })
  async approveAffiliateProduct(
    @Param('sellerId') sellerId: string,
    @Param('id') affiliateProductId: string,
    @Body() dto: ApproveAffiliateProductDto,
    @Request() req,
  ) {
    // Validar que req.user.sellerId === sellerId
    if (req.user.sellerId !== sellerId && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('No autorizado para aprobar afiliados')
    }

    return this.sellersService.approveAffiliateProduct(sellerId, affiliateProductId, dto)
  }

  @Put(':sellerId/affiliate-products/:id/commission')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update affiliate custom commission rate' })
  async updateCommission(
    @Param('sellerId') sellerId: string,
    @Param('id') affiliateProductId: string,
    @Body() dto: UpdateCommissionDto,
    @Request() req,
  ) {
    // Validar que req.user.sellerId === sellerId
    if (req.user.sellerId !== sellerId && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('No autorizado para modificar comisiones')
    }

    return this.sellersService.updateAffiliateProductCommission(sellerId, affiliateProductId, dto.rate)
  }

  @Put(':sellerId/affiliate-products/:id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pause/activate affiliate' })
  async updateStatus(
    @Param('sellerId') sellerId: string,
    @Param('id') affiliateProductId: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    // Validar que req.user.sellerId === sellerId
    if (req.user.sellerId !== sellerId && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('No autorizado para cambiar estado de afiliados')
    }

    return this.sellersService.updateAffiliateProductStatus(sellerId, affiliateProductId, dto.status)
  }

  @Get(':sellerId/affiliates/:affiliateId/details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get affiliate details for seller' })
  async getAffiliateDetails(
    @Param('sellerId') sellerId: string,
    @Param('affiliateId') affiliateId: string,
    @Request() req,
  ) {
    // Validar que req.user.sellerId === sellerId
    if (req.user.sellerId !== sellerId && req.user.role !== UserRole.ADMIN) {
      throw new BadRequestException('No autorizado para ver detalles de afiliados')
    }

    return this.sellersService.getAffiliateDetails(sellerId, affiliateId)
  }
}