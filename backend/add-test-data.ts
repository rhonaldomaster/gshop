import { DataSource } from 'typeorm';
import { Category } from './src/database/entities/category.entity';
import { Product, ProductStatus } from './src/database/entities/product.entity';
import { User } from './src/database/entities/user.entity';
import { Order } from './src/database/entities/order.entity';
import { OrderItem } from './src/database/entities/order-item.entity';
import { Payment } from './src/database/entities/payment.entity';
import { Commission } from './src/database/entities/commission.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'gshop_user',
  password: 'gshop_password',
  database: 'gshop_db',
  entities: [Category, Product, User, Order, OrderItem, Payment, Commission],
  synchronize: false,
});

async function addTestData() {
  await AppDataSource.initialize();
  console.log('✅ Database connected');

  const categoryRepo = AppDataSource.getRepository(Category);
  const productRepo = AppDataSource.getRepository(Product);
  const userRepo = AppDataSource.getRepository(User);

  // Get seller
  const seller = await userRepo.findOne({ where: { email: 'seller@gshop.com' } });
  if (!seller) {
    console.log('❌ Seller not found');
    process.exit(1);
  }

  // Get existing categories
  const electronicsCategory = await categoryRepo.findOne({ where: { slug: 'electronics' }, relations: ['children'] });
  const fashionCategory = await categoryRepo.findOne({ where: { slug: 'fashion' }, relations: ['children'] });
  const homeGardenCategory = await categoryRepo.findOne({ where: { slug: 'home-garden' } });

  if (!electronicsCategory || !fashionCategory || !homeGardenCategory) {
    console.log('❌ Categories not found');
    process.exit(1);
  }

  // Get subcategories
  const smartphonesCategory = electronicsCategory.children.find((c) => c.slug === 'smartphones');
  const laptopsCategory = electronicsCategory.children.find((c) => c.slug === 'laptops');
  const mensClothingCategory = fashionCategory.children.find((c) => c.slug === 'men-clothing');
  const womensClothingCategory = fashionCategory.children.find((c) => c.slug === 'women-clothing');

  // Add new products
  const newProducts = [
    // Electronics - Smartphones
    {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description: 'Latest flagship smartphone with AI features, 200MP camera, and S Pen.',
      shortDescription: 'Flagship smartphone with AI camera',
      price: 1199999.99,
      comparePrice: 1399999.99,
      sku: 'SAMSUNG-S24-ULTRA',
      quantity: 30,
      category: smartphonesCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500'],
      tags: ['samsung', 'smartphone', 'android', '5g'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 450,
      ordersCount: 23,
      rating: 4.8,
    },
    {
      name: 'Google Pixel 8 Pro',
      slug: 'google-pixel-8-pro',
      description: 'Pure Android experience with best-in-class camera and AI features.',
      shortDescription: 'Google flagship with AI magic',
      price: 999999.99,
      comparePrice: 1099999.99,
      sku: 'GOOGLE-PIXEL-8-PRO',
      quantity: 25,
      category: smartphonesCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500'],
      tags: ['google', 'pixel', 'android', 'ai'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 320,
      ordersCount: 18,
      rating: 4.7,
    },
    {
      name: 'OnePlus 12',
      slug: 'oneplus-12',
      description: 'Flagship killer with 120Hz display and ultra-fast charging.',
      shortDescription: 'Fast charging flagship',
      price: 699999.99,
      sku: 'ONEPLUS-12',
      quantity: 40,
      category: smartphonesCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'],
      tags: ['oneplus', 'android', 'fast-charging'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 280,
      ordersCount: 15,
      rating: 4.6,
    },

    // Electronics - Laptops
    {
      name: 'Dell XPS 13',
      slug: 'dell-xps-13',
      description: 'Ultra-portable laptop with stunning InfinityEdge display.',
      shortDescription: 'Premium ultrabook',
      price: 1299999.99,
      comparePrice: 1499999.99,
      sku: 'DELL-XPS-13',
      quantity: 20,
      category: laptopsCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500'],
      tags: ['dell', 'laptop', 'ultrabook', 'windows'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 380,
      ordersCount: 19,
      rating: 4.7,
    },
    {
      name: 'HP Spectre x360',
      slug: 'hp-spectre-x360',
      description: '2-in-1 convertible laptop with touchscreen and premium build.',
      shortDescription: 'Convertible touchscreen laptop',
      price: 1499999.99,
      sku: 'HP-SPECTRE-X360',
      quantity: 15,
      category: laptopsCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500'],
      tags: ['hp', 'laptop', '2-in-1', 'touchscreen'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 290,
      ordersCount: 12,
      rating: 4.6,
    },
    {
      name: 'ASUS ROG Zephyrus G14',
      slug: 'asus-rog-zephyrus-g14',
      description: 'Compact gaming laptop with AMD Ryzen and RTX graphics.',
      shortDescription: 'Compact gaming powerhouse',
      price: 1899999.99,
      sku: 'ASUS-ROG-G14',
      quantity: 18,
      category: laptopsCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500'],
      tags: ['asus', 'gaming', 'laptop', 'rtx'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 420,
      ordersCount: 21,
      rating: 4.9,
    },

    // Fashion - Men's Clothing
    {
      name: 'Classic Denim Jacket',
      slug: 'classic-denim-jacket',
      description: 'Timeless denim jacket in vintage wash. Perfect for layering.',
      shortDescription: 'Vintage wash denim jacket',
      price: 89999.99,
      comparePrice: 119999.99,
      sku: 'DENIM-JKT-001',
      quantity: 50,
      category: mensClothingCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'],
      tags: ['denim', 'jacket', 'casual', 'mens'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 210,
      ordersCount: 28,
      rating: 4.5,
    },
    {
      name: 'Slim Fit Chinos',
      slug: 'slim-fit-chinos',
      description: 'Comfortable stretch chinos in modern slim fit.',
      shortDescription: 'Modern slim fit pants',
      price: 59999.99,
      sku: 'CHINOS-SLIM-001',
      quantity: 80,
      category: mensClothingCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500'],
      tags: ['chinos', 'pants', 'casual', 'mens'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 180,
      ordersCount: 35,
      rating: 4.4,
    },
    {
      name: 'Oxford Button-Down Shirt',
      slug: 'oxford-button-down-shirt',
      description: 'Classic oxford shirt perfect for office or casual wear.',
      shortDescription: 'Versatile oxford shirt',
      price: 49999.99,
      sku: 'OXFORD-SHIRT-001',
      quantity: 70,
      category: mensClothingCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500'],
      tags: ['shirt', 'oxford', 'formal', 'mens'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 195,
      ordersCount: 32,
      rating: 4.6,
    },

    // Fashion - Women's Clothing
    {
      name: 'Floral Summer Dress',
      slug: 'floral-summer-dress',
      description: 'Light and breezy summer dress with beautiful floral print.',
      shortDescription: 'Floral print summer dress',
      price: 79999.99,
      comparePrice: 99999.99,
      sku: 'FLORAL-DRESS-001',
      quantity: 45,
      category: womensClothingCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=500'],
      tags: ['dress', 'summer', 'floral', 'womens'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 340,
      ordersCount: 42,
      rating: 4.8,
    },
    {
      name: 'High-Waist Skinny Jeans',
      slug: 'high-waist-skinny-jeans',
      description: 'Flattering high-waist jeans in dark wash with stretch.',
      shortDescription: 'Comfortable high-waist jeans',
      price: 69999.99,
      sku: 'JEANS-SKINNY-001',
      quantity: 60,
      category: womensClothingCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500'],
      tags: ['jeans', 'denim', 'skinny', 'womens'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 280,
      ordersCount: 38,
      rating: 4.7,
    },
    {
      name: 'Cozy Knit Sweater',
      slug: 'cozy-knit-sweater',
      description: 'Soft oversized sweater perfect for chilly days.',
      shortDescription: 'Oversized comfort sweater',
      price: 89999.99,
      sku: 'KNIT-SWEATER-001',
      quantity: 55,
      category: womensClothingCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=500'],
      tags: ['sweater', 'knitwear', 'cozy', 'womens'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 260,
      ordersCount: 30,
      rating: 4.9,
    },

    // Home & Garden
    {
      name: 'Modern Table Lamp',
      slug: 'modern-table-lamp',
      description: 'Minimalist LED table lamp with touch control and USB charging.',
      shortDescription: 'LED lamp with USB charging',
      price: 45999.99,
      sku: 'LAMP-TABLE-001',
      quantity: 35,
      category: homeGardenCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
      tags: ['lamp', 'lighting', 'home', 'modern'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 150,
      ordersCount: 20,
      rating: 4.5,
    },
    {
      name: 'Ceramic Plant Pot Set',
      slug: 'ceramic-plant-pot-set',
      description: 'Set of 3 stylish ceramic pots with drainage holes.',
      shortDescription: '3-piece ceramic pot set',
      price: 34999.99,
      sku: 'POT-CERAMIC-SET',
      quantity: 50,
      category: homeGardenCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500'],
      tags: ['pot', 'planter', 'garden', 'ceramic'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 180,
      ordersCount: 25,
      rating: 4.6,
    },
    {
      name: 'Luxury Throw Blanket',
      slug: 'luxury-throw-blanket',
      description: 'Ultra-soft faux fur throw blanket for sofa or bed.',
      shortDescription: 'Soft faux fur blanket',
      price: 54999.99,
      comparePrice: 69999.99,
      sku: 'BLANKET-THROW-001',
      quantity: 40,
      category: homeGardenCategory,
      seller,
      images: ['https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=500'],
      tags: ['blanket', 'throw', 'home', 'cozy'],
      status: ProductStatus.ACTIVE,
      isVisible: true,
      viewsCount: 220,
      ordersCount: 28,
      rating: 4.8,
    },
  ];

  console.log(`📦 Adding ${newProducts.length} products...`);

  for (const productData of newProducts) {
    const existing = await productRepo.findOne({ where: { slug: productData.slug } });
    if (!existing) {
      const product = productRepo.create(productData);
      await productRepo.save(product);
      console.log(`✅ Created: ${product.name}`);
    } else {
      console.log(`⏭️  Skipped: ${productData.name} (already exists)`);
    }
  }

  console.log('🎉 Test data added successfully!');

  // Show summary
  const totalProducts = await productRepo.count();
  const categories = await categoryRepo.find({ relations: ['children'] });

  console.log('\n📊 Database Summary:');
  console.log(`- Total products: ${totalProducts}`);
  console.log(`- Total categories: ${categories.length}`);
  categories.forEach(cat => {
    const childCount = cat.children?.length || 0;
    console.log(`  - ${cat.name}: ${childCount} subcategories`);
  });

  await AppDataSource.destroy();
}

addTestData().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
