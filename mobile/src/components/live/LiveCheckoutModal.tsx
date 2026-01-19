import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { normalizeImageUrl } from '../../config/api.config';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductVariant {
  id: string;
  name: string;
  type: 'size' | 'color' | 'other';
  options: string[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  specialPrice?: number;
  stock?: number;
  variants?: ProductVariant[];
}

interface SavedAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'mercadopago';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

interface LiveCheckoutModalProps {
  visible: boolean;
  product: Product;
  liveSessionId: string;
  affiliateId?: string;
  onClose: () => void;
  onSuccess: (orderData: { orderId: string; productName: string }) => void;
}

export function LiveCheckoutModal({
  visible,
  product,
  liveSessionId,
  affiliateId,
  onClose,
  onSuccess,
}: LiveCheckoutModalProps) {
  const { t } = useTranslation('translation');
  const [step, setStep] = useState<'variants' | 'checkout' | 'success'>('variants');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selected options
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<SavedPaymentMethod | null>(null);

  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const finalPrice = product.specialPrice || product.price;
  const hasDiscount = product.specialPrice && product.specialPrice < product.price;
  const discount = hasDiscount ? product.price - product.specialPrice! : 0;
  const totalPrice = finalPrice * quantity;

  useEffect(() => {
    if (visible) {
      setStep('variants');
      setQuantity(1);
      setSelectedVariants({});
      fetchUserData();
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setAddresses([
        {
          id: '1',
          name: 'Casa',
          street: 'Calle 123 #45-67',
          city: 'Bogota',
          state: 'Cundinamarca',
          postalCode: '110111',
          isDefault: true,
        },
      ]);
      setSelectedAddress({
        id: '1',
        name: 'Casa',
        street: 'Calle 123 #45-67',
        city: 'Bogota',
        state: 'Cundinamarca',
        postalCode: '110111',
        isDefault: true,
      });

      setPaymentMethods([
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          isDefault: true,
        },
        {
          id: '2',
          type: 'mercadopago',
          isDefault: false,
        },
      ]);
      setSelectedPaymentMethod({
        id: '1',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        isDefault: true,
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVariant = (variantType: string, option: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedVariants(prev => ({
      ...prev,
      [variantType]: option,
    }));
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= (product.stock || 99)) {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      setQuantity(newQty);
    }
  };

  const handleProceedToCheckout = () => {
    // Check if all variants are selected
    if (product.variants && product.variants.length > 0) {
      const missingVariants = product.variants.filter(v => !selectedVariants[v.type]);
      if (missingVariants.length > 0) {
        Alert.alert(
          t('common.error'),
          t('live.selectAllVariants')
        );
        return;
      }
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setStep('checkout');
  };

  const handlePurchase = async () => {
    if (!selectedAddress) {
      Alert.alert(t('common.error'), t('checkout.selectAddress'));
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert(t('common.error'), t('checkout.selectPaymentMethod'));
      return;
    }

    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock success
      const orderId = `ORD-${Date.now()}`;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Trigger success animation
      setStep('success');
      Animated.parallel([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Notify parent after animation
      setTimeout(() => {
        onSuccess({ orderId, productName: product.name });
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert(t('common.error'), t('live.purchaseFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString()}`;
  };

  const renderVariantSelector = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Product header */}
      <View style={styles.productHeader}>
        <Image
          source={{ uri: normalizeImageUrl(product.images[0]) || '' }}
          style={styles.productImage}
        />
        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>{formatPrice(finalPrice)}</Text>
            {hasDiscount && (
              <Text style={styles.originalPrice}>{formatPrice(product.price)}</Text>
            )}
          </View>
          {hasDiscount && (
            <View style={styles.liveDealBadge}>
              <MaterialIcons name="bolt" size={14} color="#fbbf24" />
              <Text style={styles.liveDealText}>{t('live.liveDeal')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Variants */}
      {product.variants?.map((variant) => (
        <View key={variant.type} style={styles.variantSection}>
          <Text style={styles.variantLabel}>
            {variant.name || variant.type}
          </Text>
          <View style={styles.variantOptions}>
            {variant.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.variantOption,
                  selectedVariants[variant.type] === option && styles.variantOptionSelected,
                  variant.type === 'color' && styles.colorOption,
                ]}
                onPress={() => handleSelectVariant(variant.type, option)}
              >
                {variant.type === 'color' ? (
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: option.toLowerCase() },
                      selectedVariants[variant.type] === option && styles.colorSwatchSelected,
                    ]}
                  />
                ) : (
                  <Text
                    style={[
                      styles.variantOptionText,
                      selectedVariants[variant.type] === option && styles.variantOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Quantity selector */}
      <View style={styles.quantitySection}>
        <Text style={styles.variantLabel}>{t('live.quantity')}</Text>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
            onPress={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
          >
            <MaterialIcons name="remove" size={20} color={quantity <= 1 ? '#d1d5db' : '#374151'} />
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.quantityButton, quantity >= (product.stock || 99) && styles.quantityButtonDisabled]}
            onPress={() => handleQuantityChange(1)}
            disabled={quantity >= (product.stock || 99)}
          >
            <MaterialIcons name="add" size={20} color={quantity >= (product.stock || 99) ? '#d1d5db' : '#374151'} />
          </TouchableOpacity>
        </View>
        {product.stock && product.stock <= 10 && (
          <Text style={styles.stockWarning}>
            {t('live.onlyXLeft', { count: product.stock })}
          </Text>
        )}
      </View>

      {/* Order summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('checkout.subtotal')}</Text>
          <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
        </View>
        {hasDiscount && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, styles.discountLabel]}>{t('live.liveDiscount')}</Text>
            <Text style={[styles.summaryValue, styles.discountValue]}>-{formatPrice(discount * quantity)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderCheckout = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Mini product summary */}
      <View style={styles.miniSummary}>
        <Image
          source={{ uri: normalizeImageUrl(product.images[0]) || '' }}
          style={styles.miniProductImage}
        />
        <View style={styles.miniProductInfo}>
          <Text style={styles.miniProductName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.miniProductPrice}>
            {quantity}x {formatPrice(finalPrice)} = {formatPrice(totalPrice)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setStep('variants')}>
          <MaterialIcons name="edit" size={20} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      {/* Shipping address */}
      <View style={styles.checkoutSection}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="location-on" size={20} color="#374151" />
          <Text style={styles.sectionTitle}>{t('checkout.shippingAddress')}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#8b5cf6" />
        ) : addresses.length === 0 ? (
          <TouchableOpacity style={styles.addButton}>
            <MaterialIcons name="add" size={20} color="#8b5cf6" />
            <Text style={styles.addButtonText}>{t('checkout.addAddress')}</Text>
          </TouchableOpacity>
        ) : (
          addresses.map((address) => (
            <TouchableOpacity
              key={address.id}
              style={[
                styles.optionCard,
                selectedAddress?.id === address.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedAddress(address)}
            >
              <MaterialIcons
                name={selectedAddress?.id === address.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={selectedAddress?.id === address.id ? '#8b5cf6' : '#9ca3af'}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{address.name}</Text>
                <Text style={styles.optionSubtitle} numberOfLines={2}>
                  {address.street}, {address.city}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Payment method */}
      <View style={styles.checkoutSection}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="payment" size={20} color="#374151" />
          <Text style={styles.sectionTitle}>{t('checkout.paymentMethod')}</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#8b5cf6" />
        ) : paymentMethods.length === 0 ? (
          <TouchableOpacity style={styles.addButton}>
            <MaterialIcons name="add" size={20} color="#8b5cf6" />
            <Text style={styles.addButtonText}>{t('checkout.addPaymentMethod')}</Text>
          </TouchableOpacity>
        ) : (
          paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.optionCard,
                selectedPaymentMethod?.id === method.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedPaymentMethod(method)}
            >
              <MaterialIcons
                name={selectedPaymentMethod?.id === method.id ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={selectedPaymentMethod?.id === method.id ? '#8b5cf6' : '#9ca3af'}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>
                  {method.type === 'card'
                    ? `${method.brand} •••• ${method.last4}`
                    : 'MercadoPago'}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {method.type === 'card' ? t('payment.creditCard') : t('payment.wallet')}
                </Text>
              </View>
              <MaterialIcons
                name={method.type === 'card' ? 'credit-card' : 'account-balance-wallet'}
                size={24}
                color="#6b7280"
              />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Final total */}
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>{t('checkout.total')}</Text>
        <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
      </View>
    </ScrollView>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <Animated.View
        style={[
          styles.successContent,
          {
            opacity: successAnim,
            transform: [
              {
                scale: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.successIcon}>
          <MaterialIcons name="check-circle" size={80} color="#10b981" />
        </View>
        <Text style={styles.successTitle}>{t('live.purchaseComplete')}</Text>
        <Text style={styles.successMessage}>{t('live.thankYouForPurchase')}</Text>
        <View style={styles.successOrderInfo}>
          <Text style={styles.successProductName}>{product.name}</Text>
          <Text style={styles.successPrice}>{formatPrice(totalPrice)}</Text>
        </View>
      </Animated.View>

      {/* Confetti animation placeholder */}
      <Animated.View
        style={[
          styles.confettiContainer,
          {
            opacity: confettiAnim,
          },
        ]}
      >
        {/* Add confetti elements here or use a library */}
        <Text style={styles.confettiEmoji}>🎉</Text>
        <Text style={[styles.confettiEmoji, { left: '20%' }]}>🛍️</Text>
        <Text style={[styles.confettiEmoji, { right: '20%' }]}>✨</Text>
      </Animated.View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={step !== 'success' ? onClose : undefined}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          {step !== 'success' && (
            <View style={styles.header}>
              <TouchableOpacity
                onPress={step === 'checkout' ? () => setStep('variants') : onClose}
                disabled={submitting}
              >
                <MaterialIcons
                  name={step === 'checkout' ? 'arrow-back' : 'close'}
                  size={24}
                  color="#374151"
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {step === 'variants' ? t('live.selectOptions') : t('live.quickCheckout')}
              </Text>
              <View style={{ width: 24 }} />
            </View>
          )}

          {/* Content based on step */}
          {step === 'variants' && renderVariantSelector()}
          {step === 'checkout' && renderCheckout()}
          {step === 'success' && renderSuccess()}

          {/* Footer actions */}
          {step !== 'success' && (
            <View style={styles.footer}>
              <View style={styles.footerPriceInfo}>
                <Text style={styles.footerLabel}>{t('checkout.total')}</Text>
                <Text style={styles.footerPrice}>{formatPrice(totalPrice)}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  submitting && styles.actionButtonDisabled,
                ]}
                onPress={step === 'variants' ? handleProceedToCheckout : handlePurchase}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <MaterialIcons
                      name={step === 'variants' ? 'arrow-forward' : 'flash-on'}
                      size={20}
                      color="white"
                    />
                    <Text style={styles.actionButtonText}>
                      {step === 'variants' ? t('common.continue') : t('live.buyNow')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productHeader: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  productDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  liveDealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  liveDealText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  },
  variantSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  variantLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  variantOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  variantOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  variantOptionSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  variantOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  variantOptionTextSelected: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  colorOption: {
    padding: 4,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  colorSwatchSelected: {
    borderColor: '#8b5cf6',
    borderWidth: 3,
  },
  quantitySection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: 'white',
  },
  quantityButtonDisabled: {
    backgroundColor: '#f3f4f6',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
  },
  stockWarning: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
  },
  summarySection: {
    paddingVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  discountLabel: {
    color: '#10b981',
  },
  discountValue: {
    color: '#10b981',
  },
  miniSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginVertical: 12,
  },
  miniProductImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  miniProductInfo: {
    flex: 1,
    marginLeft: 12,
  },
  miniProductName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  miniProductPrice: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    marginTop: 2,
  },
  checkoutSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderStyle: 'dashed',
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8b5cf6',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 8,
  },
  optionCardSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: 'white',
  },
  footerPriceInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    minWidth: 150,
  },
  actionButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContent: {
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  successOrderInfo: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  successProductName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  successPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    pointerEvents: 'none',
  },
  confettiEmoji: {
    fontSize: 40,
    position: 'absolute',
    top: 20,
  },
});
