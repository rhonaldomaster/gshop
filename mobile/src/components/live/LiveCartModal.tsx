import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LiveCartItem, LiveCartItemData } from './LiveCartItem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LiveCartModalProps {
  visible: boolean;
  onClose: () => void;
  items: LiveCartItemData[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export function LiveCartModal({
  visible,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: LiveCartModalProps) {
  const { t } = useTranslation('translation');
  const insets = useSafeAreaInsets();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const price = item.specialPrice ?? item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  const originalTotal = items.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);
  const discount = originalTotal - subtotal;

  const formatPrice = (value: number) => {
    return `$${value.toLocaleString('es-CO')}`;
  };

  const handleCheckout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onCheckout();
  };

  const renderItem = ({ item }: { item: LiveCartItemData }) => (
    <LiveCartItem
      item={item}
      onUpdateQuantity={(qty) => onUpdateQuantity(item.productId, qty)}
      onRemove={() => onRemoveItem(item.productId)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="shopping-cart" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>{t('live.liveCart.empty')}</Text>
      <Text style={styles.emptyMessage}>{t('live.liveCart.emptyMessage')}</Text>
      <TouchableOpacity style={styles.continueButton} onPress={onClose}>
        <Text style={styles.continueButtonText}>{t('live.liveCart.continueShopping')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Transparent area - tap to close */}
        <TouchableOpacity
          style={styles.transparentArea}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Cart container */}
        <View style={[styles.cartContainer, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('live.liveCart.cartTitle', { count: totalItems })}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Cart items */}
          {items.length > 0 ? (
            <>
              <FlatList
                data={items}
                keyExtractor={(item) => `${item.productId}-${item.variantId || 'default'}`}
                renderItem={renderItem}
                style={styles.itemsList}
                contentContainerStyle={styles.itemsContent}
                showsVerticalScrollIndicator={false}
              />

              {/* Footer with totals */}
              <View style={styles.footer}>
                <View style={styles.totalsContainer}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t('live.liveCart.subtotal')}</Text>
                    <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
                  </View>

                  {discount > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.discountLabel}>{t('live.liveCart.liveDiscount')}</Text>
                      <Text style={styles.discountValue}>-{formatPrice(discount)}</Text>
                    </View>
                  )}

                  <View style={styles.divider} />

                  <View style={styles.totalRow}>
                    <Text style={styles.grandTotalLabel}>{t('live.liveCart.total')}</Text>
                    <Text style={styles.grandTotalValue}>{formatPrice(subtotal)}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.checkoutButton}
                  onPress={handleCheckout}
                >
                  <MaterialIcons name="shopping-cart-checkout" size={20} color="#fff" />
                  <Text style={styles.checkoutButtonText}>
                    {t('live.liveCart.checkoutItems', { count: totalItems })}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.persistenceHint}>
                  {t('live.liveCart.keepShopping')}
                </Text>
              </View>
            </>
          ) : (
            renderEmptyState()
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  transparentArea: {
    flex: 1,
  },
  cartContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
    minHeight: SCREEN_HEIGHT * 0.4,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  continueButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fafafa',
  },
  totalsContainer: {
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  discountLabel: {
    fontSize: 14,
    color: '#16a34a',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  persistenceHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },
});
