import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { UpdateGeneralSettingsDto } from './dto/update-general-settings.dto';
import { UpdatePaymentSettingsDto } from './dto/update-payment-settings.dto';
import { UpdateEmailSettingsDto } from './dto/update-email-settings.dto';
import { UpdateSecuritySettingsDto } from './dto/update-security-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  /**
   * Get all settings (creates default if not exists)
   */
  async getSettings(): Promise<Setting> {
    let settings = await this.settingsRepository.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = this.settingsRepository.create({
        siteName: 'GSHOP',
        siteDescription: "Colombia's Leading Social Commerce Platform",
        contactEmail: 'support@gshop.com',
        contactPhone: '+57 1 234 5678',
        address: 'Bogotá, Colombia',
        defaultLanguage: 'es',
        defaultCurrency: 'COP',
        defaultCommissionRate: 7.0,
        minWithdrawalAmount: 100000,
        withdrawalFrequency: 'weekly',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUser: 'noreply@gshop.com',
        fromName: 'GSHOP',
        fromEmail: 'noreply@gshop.com',
        twoFactorEnabled: false,
        sessionTimeout: 60,
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireNumbers: true,
        passwordRequireSymbols: true,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
      });

      settings = await this.settingsRepository.save(settings);
    }

    // Mask sensitive fields
    if (settings.mercadoPagoClientSecret) {
      settings.mercadoPagoClientSecret = '****';
    }
    if (settings.mercadoPagoAccessToken) {
      settings.mercadoPagoAccessToken = '****';
    }
    if (settings.smtpPassword) {
      settings.smtpPassword = '****';
    }

    return settings;
  }

  /**
   * Update general settings
   */
  async updateGeneralSettings(dto: UpdateGeneralSettingsDto): Promise<Setting> {
    const settings = await this.getOrCreateSettings();

    Object.assign(settings, dto);

    return await this.settingsRepository.save(settings);
  }

  /**
   * Update payment settings
   */
  async updatePaymentSettings(dto: UpdatePaymentSettingsDto): Promise<Setting> {
    const settings = await this.getOrCreateSettings();

    // Only update fields that are provided and not masked
    if (dto.mercadoPagoClientId) settings.mercadoPagoClientId = dto.mercadoPagoClientId;
    if (dto.mercadoPagoClientSecret && dto.mercadoPagoClientSecret !== '****') {
      settings.mercadoPagoClientSecret = dto.mercadoPagoClientSecret;
    }
    if (dto.mercadoPagoAccessToken && dto.mercadoPagoAccessToken !== '****') {
      settings.mercadoPagoAccessToken = dto.mercadoPagoAccessToken;
    }
    if (dto.defaultCommissionRate !== undefined) settings.defaultCommissionRate = dto.defaultCommissionRate;
    if (dto.minWithdrawalAmount !== undefined) settings.minWithdrawalAmount = dto.minWithdrawalAmount;
    if (dto.withdrawalFrequency) settings.withdrawalFrequency = dto.withdrawalFrequency;

    return await this.settingsRepository.save(settings);
  }

  /**
   * Update email settings
   */
  async updateEmailSettings(dto: UpdateEmailSettingsDto): Promise<Setting> {
    const settings = await this.getOrCreateSettings();

    if (dto.smtpHost) settings.smtpHost = dto.smtpHost;
    if (dto.smtpPort !== undefined) settings.smtpPort = dto.smtpPort;
    if (dto.smtpUser) settings.smtpUser = dto.smtpUser;
    if (dto.smtpPassword && dto.smtpPassword !== '****') {
      settings.smtpPassword = dto.smtpPassword;
    }
    if (dto.fromName) settings.fromName = dto.fromName;
    if (dto.fromEmail) settings.fromEmail = dto.fromEmail;

    return await this.settingsRepository.save(settings);
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(dto: UpdateSecuritySettingsDto): Promise<Setting> {
    const settings = await this.getOrCreateSettings();

    Object.assign(settings, dto);

    return await this.settingsRepository.save(settings);
  }

  /**
   * Send test email
   */
  async sendTestEmail(toEmail: string): Promise<{ message: string }> {
    const settings = await this.getOrCreateSettings();

    // TODO: Implement actual email sending using nodemailer
    // For now, just simulate it
    console.log('Sending test email to:', toEmail);
    console.log('SMTP Config:', {
      host: settings.smtpHost,
      port: settings.smtpPort,
      user: settings.smtpUser,
    });

    return {
      message: `Test email sent successfully to ${toEmail}`,
    };
  }

  /**
   * Get or create settings (helper method without masking)
   */
  private async getOrCreateSettings(): Promise<Setting> {
    let settings = await this.settingsRepository.findOne({
      where: {},
      order: { createdAt: 'ASC' },
    });

    if (!settings) {
      settings = this.settingsRepository.create({});
      settings = await this.settingsRepository.save(settings);
    }

    return settings;
  }
}
