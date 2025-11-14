import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../database/entities/cart.entity';
import { CartItem } from '../database/entities/cart-item.entity';
import { Product } from '../database/entities/product.entity';
import { User } from '../database/entities/user.entity';
import { CouponsService } from '../coupons/coupons.service';

interface AddToCartDto {
  productId: string;
  quantity: number;
  variantId?: string;
}

interface UpdateQuantityDto {
  quantity: number;
}

interface ApplyCouponDto {
  code: string;
}

interface SyncCartDto {
  items: {
    productId: string;
    quantity: number;
    variantId?: string;
  }[];
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly couponsService: CouponsService,
  ) {}

  /**
   * Get or create user's cart
   */
  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      // Validate user exists before creating cart
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      cart = this.cartRepository.create({
        userId,
        items: [],
        subtotal: 0,
        shippingCost: 0,
        total: 0,
        itemCount: 0,
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  /**
   * Get user's cart
   */
  async getCart(userId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    await this.recalculateCart(cart);
    // Reload cart to get updated totals from DB
    return this.getOrCreateCart(userId);
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, dto: AddToCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    // Validate product exists and is available
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== 'active') {
      throw new BadRequestException('Product is not available');
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) =>
        item.productId === dto.productId &&
        item.variantId === dto.variantId &&
        !item.savedForLater,
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + dto.quantity;

      if (product.stock < newQuantity) {
        throw new BadRequestException('Insufficient stock available');
      }

      existingItem.quantity = newQuantity;
      existingItem.subtotal = Number(existingItem.price) * newQuantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      // Create new cart item
      const price = Number(product.price);
      const cartItem = this.cartItemRepository.create({
        cart: cart,
        product: product,
        variantId: dto.variantId,
        quantity: dto.quantity,
        price: price,
        subtotal: price * dto.quantity,
        savedForLater: false,
      });
      await this.cartItemRepository.save(cartItem);
    }

    // Recalculate cart totals
    await this.recalculateCart(cart);

    return this.getCart(userId);
  }

  /**
   * Update item quantity
   */
  async updateQuantity(
    userId: string,
    itemId: string,
    dto: UpdateQuantityDto,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);

    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await this.cartItemRepository.remove(cartItem);
    } else {
      // Validate stock
      const product = await this.productRepository.findOne({
        where: { id: cartItem.productId },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock available');
      }

      cartItem.quantity = dto.quantity;
      cartItem.subtotal = Number(cartItem.price) * dto.quantity;
      await this.cartItemRepository.save(cartItem);
    }

    await this.recalculateCart(cart);

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(cartItem);
    await this.recalculateCart(cart);

    return this.getCart(userId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    // Remove all items
    if (cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    cart.couponCode = null;
    cart.couponDiscount = 0;

    await this.recalculateCart(cart);

    return this.getCart(userId);
  }

  /**
   * Sync local cart with server
   */
  async syncCart(userId: string, dto: SyncCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    // Clear existing items
    if (cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    // Add all items from sync
    for (const item of dto.items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product || product.status !== 'active') {
        continue; // Skip unavailable products
      }

      const quantity = Math.min(item.quantity, product.stock);
      const price = Number(product.price);

      const cartItem = this.cartItemRepository.create({
        cart: cart,
        product: product,
        variantId: item.variantId,
        quantity,
        price: price,
        subtotal: price * quantity,
        savedForLater: false,
      });

      await this.cartItemRepository.save(cartItem);
    }

    await this.recalculateCart(cart);

    return this.getCart(userId);
  }

  /**
   * Apply coupon code
   */
  async applyCoupon(userId: string, dto: ApplyCouponDto): Promise<Cart> {
    const cart = await this.getCart(userId);

    // Validate coupon with coupons service
    const validation = await this.couponsService.validateCoupon(
      dto.code,
      cart.subtotal,
    );

    if (!validation.valid) {
      throw new BadRequestException(
        validation.message || 'Invalid coupon code',
      );
    }

    cart.couponCode = dto.code.toUpperCase();
    cart.couponDiscount = validation.discount;

    await this.recalculateCart(cart);

    // Increment coupon usage
    if (validation.coupon) {
      await this.couponsService.incrementUsage(validation.coupon.id);
    }

    return this.getCart(userId);
  }

  /**
   * Remove coupon
   */
  async removeCoupon(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    cart.couponCode = null;
    cart.couponDiscount = 0;

    await this.recalculateCart(cart);

    return this.getCart(userId);
  }

  /**
   * Validate cart stock before checkout
   */
  async validateStock(userId: string): Promise<{
    valid: boolean;
    updates: Array<{
      itemId: string;
      productId: string;
      oldQuantity: number;
      newQuantity: number;
      productName: string;
    }>;
  }> {
    const cart = await this.getCart(userId);
    const updates = [];
    let valid = true;

    for (const item of cart.items) {
      if (item.savedForLater) continue;

      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product || product.status !== 'active') {
        // Product no longer available
        updates.push({
          itemId: item.id,
          productId: item.productId,
          oldQuantity: item.quantity,
          newQuantity: 0,
          productName: item.product.name,
        });
        valid = false;
      } else if (product.stock < item.quantity) {
        // Insufficient stock
        updates.push({
          itemId: item.id,
          productId: item.productId,
          oldQuantity: item.quantity,
          newQuantity: product.stock,
          productName: product.name,
        });
        valid = false;
      }
    }

    return { valid, updates };
  }

  /**
   * Save item for later
   */
  async saveForLater(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    cartItem.savedForLater = true;
    await this.cartItemRepository.save(cartItem);

    await this.recalculateCart(cart);

    return this.getCart(userId);
  }

  /**
   * Move item back to cart
   */
  async moveToCart(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Validate stock
    const product = await this.productRepository.findOne({
      where: { id: cartItem.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== 'active') {
      throw new BadRequestException('Product is not available');
    }

    if (product.stock < cartItem.quantity) {
      throw new BadRequestException('Insufficient stock available');
    }

    cartItem.savedForLater = false;
    await this.cartItemRepository.save(cartItem);

    await this.recalculateCart(cart);

    return this.getCart(userId);
  }

  /**
   * Get saved items
   */
  async getSavedItems(userId: string): Promise<CartItem[]> {
    const cart = await this.getCart(userId);
    return cart.items.filter((item) => item.savedForLater);
  }

  /**
   * Recalculate cart totals
   */
  private async recalculateCart(cart: Cart): Promise<void> {
    // Reload cart without items to avoid cascade issues
    const cartToUpdate = await this.cartRepository.findOne({
      where: { id: cart.id },
    });

    if (!cartToUpdate) {
      return;
    }

    const activeItems = cart.items.filter((item) => !item.savedForLater);

    const subtotal = activeItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const itemCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate shipping (simple logic for now)
    const shippingCost = subtotal > 100 ? 0 : subtotal > 0 ? 10 : 0;

    // Apply coupon discount
    const discount = Number(cart.couponDiscount) || 0;

    // Calculate total (prices already include VAT)
    const total = Math.max(0, subtotal + shippingCost - discount);

    cartToUpdate.subtotal = subtotal;
    cartToUpdate.shippingCost = shippingCost;
    cartToUpdate.total = total;
    cartToUpdate.itemCount = itemCount;
    cartToUpdate.couponCode = cart.couponCode;
    cartToUpdate.couponDiscount = cart.couponDiscount;

    await this.cartRepository.save(cartToUpdate);
  }
}
