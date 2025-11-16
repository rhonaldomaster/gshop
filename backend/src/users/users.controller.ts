
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from '../database/entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'role', enum: UserRole, required: false })
  findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    type: UserStatsDto,
  })
  getUserStats(): Promise<UserStatsDto> {
    return this.usersService.getUserStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(id, updateUserDto, req.user.id, req.user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  updateStatus(@Param('id') id: string, @Body() body: { status: UserStatus }) {
    return this.usersService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user.role);
  }

  // Address Management Endpoints

  @Get('me/addresses')
  @ApiOperation({ summary: 'Get current user addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  getMyAddresses(@Request() req) {
    return this.usersService.getUserAddresses(req.user.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Add new address for current user' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  addAddress(@Request() req, @Body() addressDto: any) {
    return this.usersService.addAddress(req.user.id, addressDto);
  }

  @Patch('me/addresses/:addressId')
  @ApiOperation({ summary: 'Update address for current user' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  updateAddress(
    @Request() req,
    @Param('addressId') addressId: string,
    @Body() addressDto: any
  ) {
    return this.usersService.updateAddress(req.user.id, addressId, addressDto);
  }

  @Delete('me/addresses/:addressId')
  @ApiOperation({ summary: 'Delete address for current user' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  deleteAddress(@Request() req, @Param('addressId') addressId: string) {
    return this.usersService.deleteAddress(req.user.id, addressId);
  }

  @Post('me/addresses/:addressId/set-default')
  @ApiOperation({ summary: 'Set address as default for current user' })
  @ApiResponse({ status: 200, description: 'Default address set successfully' })
  setDefaultAddress(@Request() req, @Param('addressId') addressId: string) {
    return this.usersService.setDefaultAddress(req.user.id, addressId);
  }
}
