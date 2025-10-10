
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../../contexts/ThemeContext';
import { useProducts } from '../../hooks/useProducts';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { Product } from '../../services/products.service';
import { wishlistService } from '../../services/wishlist.service';
import { MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Navigation types
type ProductStackParamList = {
  ProductDetail: { productId: string };
};

type ProductDetailScreenRouteProp = RouteProp<ProductStackParamList, 'ProductDetail'>;
type ProductDetailScreenNavigationProp = StackNavigationProp<ProductStackParamList, 'ProductDetail'>;

interface Props {
  route: ProductDetailScreenRouteProp;
  navigation: ProductDetailScreenNavigationProp;
}

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const { getProductDetails, formatPrice, isInStock, getDiscountPercentage } = useProducts();
  const { addToCart, isInCart, getItemQuantity } = useCart();

  // Local state
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  // Load product details
  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const loadProductDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getProductDetails(productId);

      if (result?.product) {
        setProduct(result.product);
        setRelatedProducts(result.relatedProducts || []);

        // Check if product is in wishlist (only if authenticated)
        if (isAuthenticated) {
          checkWishlistStatus();
        }
      } else {
        setError('Product not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const inWishlist = await wishlistService.isInWishlist(productId);
      setIsInWishlist(inWishlist);
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to add items to your wishlist',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Auth' as any) },
        ]
      );
      return;
    }

    try {
      setIsTogglingWishlist(true);

      if (isInWishlist) {
        await wishlistService.removeFromWishlist(productId);
        setIsInWishlist(false);
        Alert.alert('Removed', 'Product removed from wishlist');
      } else {
        await wishlistService.addToWishlist(productId);
        setIsInWishlist(true);
        Alert.alert('Added', 'Product added to wishlist');
      }
    } catch (error: any) {
      console.error('Toggle wishlist failed:', error);
      Alert.alert('Error', error.message || 'Failed to update wishlist');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setIsAddingToCart(true);

      if (!isAuthenticated) {
        Alert.alert(
          'Login Required',
          'Please login to add items to your cart',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Auth' as any) },
          ]
        );
        return;
      }

      const success = await addToCart(product, quantity);

      if (success) {
        // Update quantity to show current cart amount
        const newCartQuantity = getItemQuantity(product.id);
        if (newCartQuantity > 0) {
          setQuantity(1); // Reset to 1 for next addition
        }
      }
    } catch (error) {
      console.error('Add to cart failed:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle buy now
  const handleBuyNow = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to make a purchase',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Auth' as any) },
        ]
      );
      return;
    }

    // Add to cart and navigate to checkout
    const success = await addToCart(product, quantity, false);
    if (success) {
      navigation.navigate('Cart' as any);
    }
  };

  // Increase quantity
  const increaseQuantity = () => {
    if (product) {
      const stockQuantity = product.quantity ?? product.stock ?? 0;
      if (quantity < stockQuantity) {
        setQuantity(prev => prev + 1);
      }
    }
  };

  // Decrease quantity
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" style={styles.loadingText}>Loading product...</GSText>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <GSText variant="h3" weight="bold" color="error" style={styles.errorTitle}>
            {error || 'Product not found'}
          </GSText>
          <GSButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const productImages = product.images || [];
  const currentImage = productImages[selectedImageIndex] || productImages[0];
  const discountPercentage = getDiscountPercentage(product);
  const inStock = isInStock(product);
  const cartQuantity = getItemQuantity(product.id);
  const stockQuantity = product.quantity ?? product.stock ?? 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.imageContainer}>
          {currentImage ? (
            <Image
              source={{ uri: currentImage }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <GSText variant="body" color="textSecondary">No Image</GSText>
            </View>
          )}

          {/* Wishlist Button */}
          <TouchableOpacity
            style={[styles.wishlistButton, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}
            onPress={toggleWishlist}
            disabled={isTogglingWishlist}
          >
            <MaterialIcons
              name={isInWishlist ? 'favorite' : 'favorite-border'}
              size={24}
              color={isInWishlist ? '#ef4444' : '#6b7280'}
            />
          </TouchableOpacity>

          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: theme.colors.error }]}>
              <GSText variant="caption" color="white" weight="bold">
                -{discountPercentage}%
              </GSText>
            </View>
          )}

          {/* Image Indicators */}
          {productImages.length > 1 && (
            <View style={styles.imageIndicators}>
              {productImages.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: index === selectedImageIndex
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => setSelectedImageIndex(index)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <GSText variant="h2" weight="bold" style={styles.productName}>
            {product.name}
          </GSText>

          {/* Price */}
          <View style={styles.priceContainer}>
            <GSText variant="h3" weight="bold" color="primary">
              {formatPrice(product.price)}
            </GSText>
            {product.originalPrice && product.originalPrice > product.price && (
              <GSText
                variant="body"
                color="textSecondary"
                style={styles.originalPrice}
              >
                {formatPrice(product.originalPrice)}
              </GSText>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <View
              style={[
                styles.stockIndicator,
                { backgroundColor: inStock ? theme.colors.success : theme.colors.error },
              ]}
            />
            <GSText
              variant="body"
              color={inStock ? 'success' : 'error'}
              weight="medium"
            >
              {inStock ? `In Stock (${stockQuantity} available)` : 'Out of Stock'}
            </GSText>
          </View>

          {/* Description */}
          <GSText variant="body" color="textSecondary" style={styles.description}>
            {product.description}
          </GSText>

          {/* Quantity Selector */}
          {inStock && (
            <View style={styles.quantityContainer}>
              <GSText variant="body" weight="medium" style={styles.quantityLabel}>
                Quantity:
              </GSText>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={[styles.quantityButton, { borderColor: theme.colors.border }]}
                  onPress={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <GSText variant="body" weight="bold">-</GSText>
                </TouchableOpacity>
                <GSText variant="body" weight="medium" style={styles.quantityText}>
                  {quantity}
                </GSText>
                <TouchableOpacity
                  style={[styles.quantityButton, { borderColor: theme.colors.border }]}
                  onPress={increaseQuantity}
                  disabled={quantity >= stockQuantity}
                >
                  <GSText variant="body" weight="bold">+</GSText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Cart Status */}
          {cartQuantity > 0 && (
            <View style={styles.cartStatus}>
              <GSText variant="body" color="primary" weight="medium">
                {cartQuantity} item{cartQuantity > 1 ? 's' : ''} in cart
              </GSText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {inStock && (
        <View style={[styles.bottomActions, { backgroundColor: theme.colors.background }]}>
          <GSButton
            title="Add to Cart"
            onPress={handleAddToCart}
            loading={isAddingToCart}
            style={[styles.actionButton, styles.addToCartButton]}
            variant="outlined"
          />
          <GSButton
            title="Buy Now"
            onPress={handleBuyNow}
            style={[styles.actionButton, styles.buyNowButton]}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    minWidth: 120,
  },
  imageContainer: {
    position: 'relative',
    height: SCREEN_WIDTH,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  wishlistButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  description: {
    lineHeight: 24,
    marginBottom: 24,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  quantityLabel: {
    flex: 1,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    minWidth: 30,
    textAlign: 'center',
  },
  cartStatus: {
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 16,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    flex: 1,
  },
  addToCartButton: {
    // Additional styles for add to cart button
  },
  buyNowButton: {
    // Additional styles for buy now button
  },
});
