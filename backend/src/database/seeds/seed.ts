
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { dataSourceConfig } from '../typeorm.config';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { Commission, CommissionType } from '../entities/commission.entity';
import { Seller, SellerType, DocumentType, VerificationStatus } from '../../sellers/entities/seller.entity';

async function seed() {
  const configService = new ConfigService();
  const dataSource = new DataSource(dataSourceConfig(configService));

  try {
    await dataSource.initialize();
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await dataSource.query('TRUNCATE TABLE "commissions" CASCADE');
    await dataSource.query('TRUNCATE TABLE "products" CASCADE');
    await dataSource.query('TRUNCATE TABLE "categories" CASCADE');
    await dataSource.query('TRUNCATE TABLE "categories_closure" CASCADE');
    await dataSource.query('TRUNCATE TABLE "sellers" CASCADE');
    await dataSource.query('TRUNCATE TABLE "users" CASCADE');
    console.log('✅ Data cleared');

    // Seed Users
    const userRepository = dataSource.getRepository(User);
    
    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('johndoe123', 10);
    const adminUser = userRepository.create({
      email: 'john@doe.com',
      password: hashedAdminPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      bio: 'Platform Administrator',
    });
    await userRepository.save(adminUser);

    // Create seller user
    const hashedSellerPassword = await bcrypt.hash('seller123', 10);
    const sellerUser = userRepository.create({
      email: 'seller@gshop.com',
      password: hashedSellerPassword,
      firstName: 'Maria',
      lastName: 'Rodriguez',
      phone: '+541123456789',
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      bio: 'Electronics store owner',
      addresses: [{
        type: 'business',
        address1: 'Av. Corrientes 1234',
        city: 'Buenos Aires',
        state: 'CABA',
        postalCode: '1043',
        country: 'AR'
      }]
    });
    await userRepository.save(sellerUser);

    // Create buyer user
    const hashedBuyerPassword = await bcrypt.hash('buyer123', 10);
    const buyerUser = userRepository.create({
      email: 'buyer@gshop.com',
      password: hashedBuyerPassword,
      firstName: 'Carlos',
      lastName: 'Martinez',
      phone: '+541198765432',
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      bio: 'Tech enthusiast and regular shopper',
      addresses: [{
        type: 'home',
        address1: 'San Martín 567',
        city: 'Córdoba',
        state: 'Córdoba',
        postalCode: '5000',
        country: 'AR'
      }]
    });
    await userRepository.save(buyerUser);

    console.log('✅ Users seeded successfully');

    // Seed Seller in sellers table
    const sellerRepository = dataSource.getRepository(Seller);
    const seller = sellerRepository.create({
      email: 'seller@gshop.com',
      passwordHash: hashedSellerPassword,
      businessName: 'GSHOP Electronics',
      ownerName: 'Maria Rodriguez',
      documentType: DocumentType.CC,
      documentNumber: '1234567890',
      phone: '+573001234567',
      address: 'Calle 123 #45-67',
      city: 'Bogotá',
      country: 'CO',
      businessCategory: 'Electronics',
      sellerType: SellerType.NATURAL,
      verificationStatus: VerificationStatus.APPROVED,
      status: 'approved',
      commissionRate: 7.0,
      totalEarnings: 0,
      availableBalance: 0,
      pendingBalance: 0,
      isActive: true,
      shippingLocalPrice: 15000,
      shippingNationalPrice: 25000,
      shippingFreeEnabled: true,
      shippingFreeMinAmount: 100000,
    });
    await sellerRepository.save(seller);

    console.log('✅ Seller seeded successfully');

    // Seed Categories
    const categoryRepository = dataSource.getTreeRepository(Category);

    // Root categories
    const electronics = categoryRepository.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'All electronic devices and gadgets',
      isActive: true,
      sortOrder: 1,
    });
    await categoryRepository.save(electronics);

    const fashion = categoryRepository.create({
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, shoes, and accessories',
      isActive: true,
      sortOrder: 2,
    });
    await categoryRepository.save(fashion);

    const home = categoryRepository.create({
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home decor, furniture, and garden supplies',
      isActive: true,
      sortOrder: 3,
    });
    await categoryRepository.save(home);

    // Electronics subcategories
    const smartphones = categoryRepository.create({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and accessories',
      parent: electronics,
      isActive: true,
      sortOrder: 1,
    });
    await categoryRepository.save(smartphones);

    const laptops = categoryRepository.create({
      name: 'Laptops',
      slug: 'laptops',
      description: 'Laptops and computer accessories',
      parent: electronics,
      isActive: true,
      sortOrder: 2,
    });
    await categoryRepository.save(laptops);

    // Fashion subcategories
    const menClothing = categoryRepository.create({
      name: "Men's Clothing",
      slug: 'men-clothing',
      description: 'Clothing for men',
      parent: fashion,
      isActive: true,
      sortOrder: 1,
    });
    await categoryRepository.save(menClothing);

    const womenClothing = categoryRepository.create({
      name: "Women's Clothing",
      slug: 'women-clothing',
      description: 'Clothing for women',
      parent: fashion,
      isActive: true,
      sortOrder: 2,
    });
    await categoryRepository.save(womenClothing);

    console.log('✅ Categories seeded successfully');

    // Seed Products
    const productRepository = dataSource.getRepository(Product);

    // Sample smartphone
    const iphone = productRepository.create({
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro-max',
      description: 'The ultimate iPhone experience with titanium design, A17 Pro chip, and advanced camera system. Features 6.7" Super Retina XDR display, Action Button, and USB-C.',
      shortDescription: 'Premium smartphone with cutting-edge technology and stunning design.',
      price: 1299999.99, // ARS
      comparePrice: 1399999.99,
      costPerItem: 800000.00,
      sku: 'IPH15PM-256-TIT',
      quantity: 25,
      trackQuantity: true,
      weight: 0.221,
      images: [
        'https://i.ytimg.com/vi/3byr5Pm1pIM/hqdefault.jpg',
        'https://i.ytimg.com/vi/oL4bD_MT5iM/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDAiAMqOWcFTXzNfH7j5yvdZSnOtg'
      ],
      variants: [
        {
          name: 'Color',
          options: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
          required: true
        },
        {
          name: 'Storage',
          options: ['256GB', '512GB', '1TB'],
          required: true
        }
      ],
      tags: ['smartphone', 'iphone', 'apple', 'premium', 'titanium'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      seoData: {
        title: 'iPhone 15 Pro Max - Buy Online | GSHOP',
        description: 'Get the latest iPhone 15 Pro Max with titanium design and A17 Pro chip. Free shipping and warranty included.',
        keywords: ['iphone 15', 'pro max', 'smartphone', 'apple', 'titanium']
      },
      sellerId: sellerUser.id,
      categoryId: smartphones.id,
    });
    await productRepository.save(iphone);

    // Sample laptop
    const macbook = productRepository.create({
      name: 'MacBook Air 15" M3',
      slug: 'macbook-air-15-m3',
      description: 'The incredibly thin and light MacBook Air is now more powerful than ever. With the M3 chip and 15.3" Liquid Retina display, it delivers exceptional performance and battery life.',
      shortDescription: 'Powerful, thin, and light laptop with M3 chip and 15" display.',
      price: 1749999.99, // ARS
      comparePrice: 1849999.99,
      costPerItem: 1200000.00,
      sku: 'MBA15M3-512-MID',
      quantity: 15,
      trackQuantity: true,
      weight: 1.51,
      images: [
        'https://i.ytimg.com/vi/OVwHJbj7Ij8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDwQ3qafOsoDGcyRv-icqyzpdKKTw',
        'https://i.ytimg.com/vi/I80RHCBAhkg/sddefault.jpg'
      ],
      variants: [
        {
          name: 'Color',
          options: ['Midnight', 'Starlight', 'Silver', 'Space Gray'],
          required: true
        },
        {
          name: 'Memory',
          options: ['8GB', '16GB', '24GB'],
          required: true
        },
        {
          name: 'Storage',
          options: ['256GB', '512GB', '1TB', '2TB'],
          required: true
        }
      ],
      tags: ['laptop', 'macbook', 'apple', 'm3', 'ultrabook'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      seoData: {
        title: 'MacBook Air 15" M3 - Powerful Laptop | GSHOP',
        description: 'Experience the power of M3 chip in the new MacBook Air 15". Perfect for work and creativity.',
        keywords: ['macbook air', '15 inch', 'm3', 'laptop', 'apple']
      },
      sellerId: sellerUser.id,
      categoryId: laptops.id,
    });
    await productRepository.save(macbook);

    // Sample clothing item
    const tshirt = productRepository.create({
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-cotton-t-shirt',
      description: 'High-quality 100% organic cotton t-shirt with a comfortable fit. Perfect for casual wear, made with sustainable materials and ethical manufacturing.',
      shortDescription: 'Comfortable 100% organic cotton t-shirt for everyday wear.',
      price: 15999.99, // ARS
      comparePrice: 19999.99,
      costPerItem: 8000.00,
      sku: 'TSHIRT-ORG-BLK-L',
      quantity: 100,
      trackQuantity: true,
      weight: 0.18,
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500'
      ],
      variants: [
        {
          name: 'Size',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          required: true
        },
        {
          name: 'Color',
          options: ['Black', 'White', 'Gray', 'Navy', 'Red'],
          required: true
        }
      ],
      tags: ['t-shirt', 'cotton', 'organic', 'casual', 'sustainable'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      seoData: {
        title: 'Premium Organic Cotton T-Shirt | GSHOP',
        description: 'Comfortable and sustainable organic cotton t-shirt. Available in multiple sizes and colors.',
        keywords: ['t-shirt', 'organic cotton', 'sustainable', 'casual wear']
      },
      sellerId: sellerUser.id,
      categoryId: menClothing.id,
    });
    await productRepository.save(tshirt);

    console.log('✅ Products seeded successfully');

    // Seed Commissions
    const commissionRepository = dataSource.getRepository(Commission);

    // Platform commission
    const platformCommission = commissionRepository.create({
      name: 'Platform Fee',
      type: CommissionType.PLATFORM,
      rate: 7.0, // 7%
      isActive: true,
      description: 'Standard platform commission for all transactions',
    });
    await commissionRepository.save(platformCommission);

    // Seller commission
    const sellerCommission = commissionRepository.create({
      name: 'Seller Premium',
      type: CommissionType.SELLER,
      rate: 2.0, // 2% additional for premium sellers
      isActive: true,
      minAmount: 10000, // Min $100 ARS
      description: 'Additional commission for premium seller benefits',
    });
    await commissionRepository.save(sellerCommission);

    // Referral commission
    const referralCommission = commissionRepository.create({
      name: 'Referral Bonus',
      type: CommissionType.REFERRAL,
      rate: 1.0, // 1%
      isActive: true,
      maxAmount: 5000, // Max $50 ARS
      description: 'Commission for successful referrals',
    });
    await commissionRepository.save(referralCommission);

    console.log('✅ Commissions seeded successfully');

    console.log(`
🎉 Database seeding completed successfully!

Test Accounts:
📧 Admin: john@doe.com / johndoe123
📧 Seller: seller@gshop.com / seller123
📧 Buyer: buyer@gshop.com / buyer123

Categories: ${await categoryRepository.count()}
Products: ${await productRepository.count()}
Commissions: ${await commissionRepository.count()}
    `);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await dataSource.destroy();
  }
}

seed();
