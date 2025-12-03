
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { User, UserRole } from '../database/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('auth.login.invalid_credentials', { lang: I18nContext.current()?.lang || 'es' })
      );
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user,
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: '7d',
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(
        this.i18n.t('auth.register.email_exists', { lang: I18nContext.current()?.lang || 'es' })
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      ...registerDto,
      email: registerDto.email.toLowerCase(),
      password: hashedPassword,
      role: registerDto.role || UserRole.BUYER,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...userWithoutPassword } = savedUser;

    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };

    return {
      user: userWithoutPassword,
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: '7d',
    };
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async refreshToken(userId: string) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('auth.profile.not_found', { lang: I18nContext.current()?.lang || 'es' })
      );
    }

    const { password, ...userWithoutPassword } = user;
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user: userWithoutPassword,
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      expires_in: '7d',
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException(
        this.i18n.t('auth.profile.not_found', { lang: I18nContext.current()?.lang || 'es' })
      );
    }

    // If email is being updated, check if it's already in use
    if (updateProfileDto.email && updateProfileDto.email.toLowerCase() !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException(
          this.i18n.t('auth.profile.email_in_use', { lang: I18nContext.current()?.lang || 'es' })
        );
      }
    }

    // Update user fields
    const updatedData: Partial<User> = {};
    if (updateProfileDto.firstName) updatedData.firstName = updateProfileDto.firstName;
    if (updateProfileDto.lastName) updatedData.lastName = updateProfileDto.lastName;
    if (updateProfileDto.email) updatedData.email = updateProfileDto.email.toLowerCase();
    if (updateProfileDto.phone !== undefined) updatedData.phone = updateProfileDto.phone;
    if (updateProfileDto.avatar !== undefined) updatedData.avatar = updateProfileDto.avatar;
    if (updateProfileDto.bio !== undefined) updatedData.bio = updateProfileDto.bio;

    // Only update if there are changes
    if (Object.keys(updatedData).length > 0) {
      await this.userRepository.update(userId, updatedData);
    }

    // Fetch and return updated user
    const updatedUser = await this.findUserById(userId);
    const { password, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
  }
}
