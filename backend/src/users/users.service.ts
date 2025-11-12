
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../database/entities/user.entity';
import { Order } from '../database/entities/order.entity';
import { Affiliate } from '../affiliates/entities/affiliate.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Affiliate)
    private affiliateRepository: Repository<Affiliate>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async findAll(role?: UserRole): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.phone',
        'user.role',
        'user.status',
        'user.avatar',
        'user.bio',
        'user.emailVerified',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
      ]);

    if (role) {
      query.where('user.role = :role', { role });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.phone',
        'user.role',
        'user.status',
        'user.avatar',
        'user.bio',
        'user.addresses',
        'user.emailVerified',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUserId?: string, currentUserRole?: UserRole): Promise<User> {
    const user = await this.findOne(id);

    // Check if user can update this profile
    if (currentUserId && currentUserRole !== UserRole.ADMIN && currentUserId !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Only admins can change role and status
    if (currentUserRole !== UserRole.ADMIN) {
      delete updateUserDto.role;
      delete updateUserDto.status;
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string, currentUserRole: UserRole): Promise<void> {
    if (currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    await this.userRepository.update(id, { status });
    return this.findOne(id);
  }

  async getUserStats() {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get counts by role
    const [totalUsers, buyersCount, sellersCount, adminsCount, affiliateCount] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { role: UserRole.BUYER } }),
      this.userRepository.count({ where: { role: UserRole.SELLER } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
      this.affiliateRepository.count(),
    ]);

    // Calculate new users this month
    const newUsersThisMonth = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :start', { start: startOfCurrentMonth })
      .getCount();

    // Calculate last month users
    const lastMonthUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :start', { start: startOfLastMonth })
      .andWhere('user.createdAt <= :end', { end: endOfLastMonth })
      .getCount();

    // Calculate users change percentage
    let usersChange = 0;
    if (lastMonthUsers > 0) {
      usersChange = ((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100;
    } else if (newUsersThisMonth > 0) {
      usersChange = 100; // If there were no users last month but there are this month, it's 100% growth
    }

    // Calculate active users (users who made orders in last 30 days)
    const activeUsersResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(DISTINCT order.userId)', 'count')
      .where('order.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getRawOne();

    const activeUsers = parseInt(activeUsersResult.count) || 0;

    return {
      totalUsers,
      usersChange: Math.round(usersChange * 100) / 100,
      activeUsers,
      newUsersThisMonth,
      sellerCount: sellersCount,
      affiliateCount,
      buyersCount,
      adminsCount,
    };
  }
}
