import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { normalizeImageUrl } from '../../config/api.config';

interface ProductCardProps {
  product: {
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      images: string[];
    };
    specialPrice?: number;
    isActive: boolean;
  };
  onPress: () => void;
  onQuickBuy?: () => void;
  showSpecialPrice?: boolean;
  liveMode?: boolean;
}

export function ProductCard({
  product,
  onPress,
  onQuickBuy,
  showSpecialPrice = false,
  liveMode = false
}: ProductCardProps) {
  const hasDiscount = product.specialPrice && product.specialPrice < product.product.price;
  const displayPrice = product.specialPrice || product.product.price;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: normalizeImageUrl(product.product.images[0]) || 'https://via.placeholder.com/150x150'
          }}
          style={styles.productImage}
        />
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(((product.product.price - displayPrice) / product.product.price) * 100)}% OFF
            </Text>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.product.name}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>${displayPrice.toFixed(2)}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>${product.product.price.toFixed(2)}</Text>
          )}
        </View>

        {liveMode && onQuickBuy ? (
          <View style={styles.liveButtonContainer}>
            <TouchableOpacity style={styles.quickBuyButton} onPress={onQuickBuy}>
              <MaterialIcons name="flash-on" size={16} color="white" />
              <Text style={styles.quickBuyText}>Quick Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewDetailsButton} onPress={onPress}>
              <MaterialIcons name="visibility" size={16} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addToCartButton} onPress={onPress}>
            <MaterialIcons name="add-shopping-cart" size={16} color="white" />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addToCartText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  liveButtonContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  quickBuyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  quickBuyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  viewDetailsButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});