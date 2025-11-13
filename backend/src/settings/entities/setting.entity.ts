import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // General Settings
  @Column({ name: 'site_name', default: 'GSHOP' })
  siteName: string;

  @Column({ name: 'site_description', type: 'text', nullable: true })
  siteDescription: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'default_language', default: 'es' })
  defaultLanguage: string;

  @Column({ name: 'default_currency', default: 'COP' })
  defaultCurrency: string;

  // Payment Settings
  @Column({ name: 'mercadopago_client_id', type: 'text', nullable: true })
  mercadoPagoClientId: string;

  @Column({ name: 'mercadopago_client_secret', type: 'text', nullable: true })
  mercadoPagoClientSecret: string;

  @Column({ name: 'mercadopago_access_token', type: 'text', nullable: true })
  mercadoPagoAccessToken: string;

  @Column({ name: 'default_commission_rate', type: 'decimal', precision: 5, scale: 2, default: 7.0 })
  defaultCommissionRate: number;

  @Column({ name: 'min_withdrawal_amount', type: 'decimal', precision: 10, scale: 2, default: 100000 })
  minWithdrawalAmount: number;

  @Column({ name: 'withdrawal_frequency', default: 'weekly' })
  withdrawalFrequency: string;

  // Email Settings
  @Column({ name: 'smtp_host', nullable: true })
  smtpHost: string;

  @Column({ name: 'smtp_port', type: 'int', nullable: true })
  smtpPort: number;

  @Column({ name: 'smtp_user', nullable: true })
  smtpUser: string;

  @Column({ name: 'smtp_password', type: 'text', nullable: true })
  smtpPassword: string;

  @Column({ name: 'from_name', nullable: true })
  fromName: string;

  @Column({ name: 'from_email', nullable: true })
  fromEmail: string;

  // Security Settings
  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'session_timeout', type: 'int', default: 60 })
  sessionTimeout: number;

  @Column({ name: 'password_min_length', type: 'int', default: 8 })
  passwordMinLength: number;

  @Column({ name: 'password_require_uppercase', default: true })
  passwordRequireUppercase: boolean;

  @Column({ name: 'password_require_numbers', default: true })
  passwordRequireNumbers: boolean;

  @Column({ name: 'password_require_symbols', default: true })
  passwordRequireSymbols: boolean;

  @Column({ name: 'max_login_attempts', type: 'int', default: 5 })
  maxLoginAttempts: number;

  @Column({ name: 'lockout_duration', type: 'int', default: 30 })
  lockoutDuration: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
