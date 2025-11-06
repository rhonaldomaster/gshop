import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch, Put, UseInterceptors, UploadedFiles, BadRequestException, Query, Res } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { SellersService } from './sellers.service'
import { SellersUploadService } from './sellers-upload.service'
import { CreateSellerDto } from './dto/create-seller.dto'
import { SellerLoginDto } from './dto/seller-login.dto'
import { UpdateShippingConfigDto } from './dto/update-shipping-config.dto'
import { AddSellerLocationDto } from './dto/add-seller-location.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

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

  @Get(':id')
  @ApiOperation({ summary: 'Get seller by ID' })
  async findOne(@Param('id') id: string) {
    return this.sellersService.findOne(id)
  }

  // Colombian KYC Endpoints

  @Post(':id/documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'rut', maxCount: 1 },
    { name: 'comercio', maxCount: 1 },
  ]))
  @ApiOperation({ summary: 'Upload seller documents (RUT and Cámara de Comercio)' })
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
}