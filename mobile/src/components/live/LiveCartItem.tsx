import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { normalizeImageUrl } from '../../config/api.config';

export interface LiveCartItemData {
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock?: number;
  };
  variantId?: string;
  variant?: {
    id: string;
    name: string;
  };
  quantity: number;
  specialPrice?: number;
  addedAt: Date;
}

interface LiveCartItemProps {
  item: LiveCartItemData;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function LiveCartItem({
  item,
  onUpdateQuantity,
  onRemove,
}: LiveCartItemProps) {
  const { t } = useTranslation('translation');
  const price = item.specialPrice ?? item.product.price;
  const hasDiscount = item.specialPrice != null && item.specialPrice < item.product.price;
  const maxStock = item.product.stock ?? 99;

  const formatPrice = (value: number) => {
    return `$${value.toLocaleString('es-CO')}`;
  };

  const handleIncrement = () => {
    if (item.quantity < maxStock) {
      onUpdateQuantity(item.quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.quantity - 1);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: normalizeImageUrl(item.product.images?.[0]) || 'https://via.placeholder.com/80x80',
        }}
        style={styles.image}
      />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.product.name}
        </Text>

        {item.variant && (
          <Text style={styles.variant}>
            {item.variant.name}
          </Text>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(price)}
          </Text>
          {hasDiscount && (
            <>
              <Text style={styles.originalPrice}>
                {formatPrice(item.product.price)}
              </Text>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>{t('live.liveCart.livePrice')}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>{t('live.liveCart.subtotal')}:</Text>
          <Text style={styles.subtotalValue}>
            {formatPrice(price * item.quantity)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
            onPress={handleDecrement}
            disabled={item.quantity <= 1}
          >
            <MaterialIcons name="remove" size={16} color={item.quantity <= 1 ? '#d1d5db' : '#374151'} />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{item.quantity}</Text>

          <TouchableOpacity
            style={[styles.quantityButton, item.quantity >= maxStock && styles.quantityButtonDisabled]}
            onPress={handleIncrement}
            disabled={item.quantity >= maxStock}
          >
            <MaterialIcons name="add" size={16} color={item.quantity >= maxStock ? '#d1d5db' : '#374151'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  variant: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  liveBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#b45309',
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subtotalLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  subtotalValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  actions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
});
