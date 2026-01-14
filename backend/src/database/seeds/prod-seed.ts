
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { dataSourceConfig } from '../typeorm.config';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Commission, CommissionType } from '../entities/commission.entity';

/**
 * Production-safe seeding script
 * Only creates essential data if it doesn't exist
 * NO TRUNCATE - safe to run multiple times
 */
async function prodSeed() {
  const configService = new ConfigService();
  const dataSource = new DataSource(dataSourceConfig(configService));

  try {
    await dataSource.initialize();
    console.log('🌱 Starting production seeding...');

    // Check if already seeded
    const userRepository = dataSource.getRepository(User);
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@gshop.com' }
    });

    // Create only essential admin user if not exists
    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'changeme123', 10);
      const adminUser = userRepository.create({
        email: 'admin@gshop.com',
        password: hashedAdminPassword,
        firstName: 'Admin',
        lastName: 'GSHOP',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        bio: 'Platform Administrator',
      });
      await userRepository.save(adminUser);
      console.log('✅ Admin user created: admin@gshop.com');
    } else {
      console.log('ℹ️  Admin user already exists, skipping...');
    }

    // Seed essential categories
    const categoryRepository = dataSource.getTreeRepository(Category);

    // Check and create Electronics category
    const existingElectronics = await categoryRepository.findOne({
      where: { slug: 'electronics' }
    });
    if (!existingElectronics) {
      const electronics = categoryRepository.create({
        name: 'Electronics',
        slug: 'electronics',
        description: 'All electronic devices and gadgets',
        isActive: true,
        sortOrder: 1,
      });
      await categoryRepository.save(electronics);
      console.log('✅ Electronics category created');
    } else {
      console.log('ℹ️  Electronics category already exists');
    }

    // Check and create Fashion category
    const existingFashion = await categoryRepository.findOne({
      where: { slug: 'fashion' }
    });
    if (!existingFashion) {
      const fashion = categoryRepository.create({
        name: 'Fashion',
        slug: 'fashion',
        description: 'Clothing, shoes, and accessories',
        isActive: true,
        sortOrder: 2,
      });
      await categoryRepository.save(fashion);
      console.log('✅ Fashion category created');
    } else {
      console.log('ℹ️  Fashion category already exists');
    }

    // Check and create Home & Garden category
    const existingHome = await categoryRepository.findOne({
      where: { slug: 'home-garden' }
    });
    if (!existingHome) {
      const home = categoryRepository.create({
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home decor, furniture, and garden supplies',
        isActive: true,
        sortOrder: 3,
      });
      await categoryRepository.save(home);
      console.log('✅ Home & Garden category created');
    } else {
      console.log('ℹ️  Home & Garden category already exists');
    }

    // Seed essential commissions
    const commissionRepository = dataSource.getRepository(Commission);

    // Check and create Platform commission
    const existingPlatformCommission = await commissionRepository.findOne({
      where: { type: CommissionType.PLATFORM }
    });
    if (!existingPlatformCommission) {
      const platformCommission = commissionRepository.create({
        name: 'Platform Fee',
        type: CommissionType.PLATFORM,
        rate: 7.0, // 7%
        isActive: true,
        description: 'Standard platform commission for all transactions',
      });
      await commissionRepository.save(platformCommission);
      console.log('✅ Platform commission created');
    } else {
      console.log('ℹ️  Platform commission already exists');
    }

    console.log(`
🎉 Production seeding completed successfully!

Admin Account Created:
📧 Email: admin@gshop.com
🔑 Password: ${process.env.ADMIN_PASSWORD || 'changeme123'}

⚠️  IMPORTANT: Change the admin password immediately!
    `);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

prodSeed();
