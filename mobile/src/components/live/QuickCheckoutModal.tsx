import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { normalizeImageUrl } from '../../config/api.config';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  specialPrice?: number;
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'mercadopago';
  last4?: string;
  brand?: string;
}

interface QuickCheckoutModalProps {
  visible: boolean;
  product: Product;
  liveSessionId: string;
  affiliateId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickCheckoutModal({
  visible,
  product,
  liveSessionId,
  affiliateId,
  onClose,
  onSuccess,
}: QuickCheckoutModalProps) {
  const { t } = useTranslation('translation');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // User data
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  const finalPrice = product.specialPrice || product.price;
  const discount = product.specialPrice ? product.price - product.specialPrice : 0;

  useEffect(() => {
    if (visible) {
      fetchUserData();
    }
  }, [visible]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch saved addresses
      const addressResponse = await fetch(`${process.env.API_BASE_URL}/users/addresses`, {
        headers: {
          // Add auth token
        },
      });
      if (addressResponse.ok) {
        const addressData = await addressResponse.json();
        setAddresses(addressData);
        if (addressData.length > 0) {
          // Select default address or first one
          setSelectedAddress(addressData.find((a: Address & { isDefault: boolean }) => a.isDefault) || addressData[0]);
        }
      }

      // Fetch saved payment methods
      const paymentResponse = await fetch(`${process.env.API_BASE_URL}/users/payment-methods`, {
        headers: {
          // Add auth token
        },
      });
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setPaymentMethods(paymentData);
        if (paymentData.length > 0) {
          setSelectedPaymentMethod(paymentData[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPurchase = async () => {
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
      const response = await fetch(`${process.env.API_BASE_URL}/orders/quick-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth token
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          addressId: selectedAddress.id,
          paymentMethodId: selectedPaymentMethod.id,
          liveSessionId,
          affiliateId,
          specialPrice: product.specialPrice,
        }),
      });

      if (response.ok) {
        const order = await response.json();
        Alert.alert(
          t('common.success'),
          t('live.purchaseSuccess'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                onSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert(t('common.error'), t('live.purchaseFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  const renderAddress = (address: Address, isSelected: boolean) => (
    <TouchableOpacity
      key={address.id}
      style={[styles.selectionCard, isSelected && styles.selectionCardSelected]}
      onPress={() => setSelectedAddress(address)}
    >
      <MaterialIcons
        name={isSelected ? "radio-button-checked" : "radio-button-unchecked"}
        size={24}
        color={isSelected ? "#8b5cf6" : "#9ca3af"}
      />
      <View style={styles.selectionContent}>
        <Text style={styles.selectionTitle}>{address.street}</Text>
        <Text style={styles.selectionSubtitle}>
          {address.city}, {address.state} {address.postalCode}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPaymentMethod = (method: PaymentMethod, isSelected: boolean) => (
    <TouchableOpacity
      key={method.id}
      style={[styles.selectionCard, isSelected && styles.selectionCardSelected]}
      onPress={() => setSelectedPaymentMethod(method)}
    >
      <MaterialIcons
        name={isSelected ? "radio-button-checked" : "radio-button-unchecked"}
        size={24}
        color={isSelected ? "#8b5cf6" : "#9ca3af"}
      />
      <View style={styles.selectionContent}>
        <Text style={styles.selectionTitle}>
          {method.type === 'card' ? `${method.brand} •••• ${method.last4}` : 'MercadoPago'}
        </Text>
        <Text style={styles.selectionSubtitle}>
          {method.type === 'card' ? t('payment.creditCard') : t('payment.mercadopago')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('live.quickCheckout')}</Text>
          <TouchableOpacity onPress={onClose} disabled={submitting}>
            <MaterialIcons name="close" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Product Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('checkout.productSummary')}</Text>
              <View style={styles.productCard}>
                <Image
                  source={{ uri: normalizeImageUrl(product.images[0]) || '' }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  {discount > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.originalPrice}>{formatCurrency(product.price)}</Text>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                          -{Math.round((discount / product.price) * 100)}%
                        </Text>
                      </View>
                    </View>
                  )}
                  <Text style={styles.productPrice}>{formatCurrency(finalPrice)}</Text>
                </View>
              </View>

              {discount > 0 && (
                <View style={styles.liveBanner}>
                  <MaterialIcons name="bolt" size={20} color="#fbbf24" />
                  <Text style={styles.liveBannerText}>{t('live.exclusiveDiscount')}</Text>
                </View>
              )}
            </View>

            {/* Shipping Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('checkout.shippingAddress')}</Text>
              {addresses.length === 0 ? (
                <TouchableOpacity style={styles.addButton}>
                  <MaterialIcons name="add" size={20} color="#8b5cf6" />
                  <Text style={styles.addButtonText}>{t('checkout.addAddress')}</Text>
                </TouchableOpacity>
              ) : (
                addresses.map(addr => renderAddress(addr, addr.id === selectedAddress?.id))
              )}
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('checkout.paymentMethod')}</Text>
              {paymentMethods.length === 0 ? (
                <TouchableOpacity style={styles.addButton}>
                  <MaterialIcons name="add" size={20} color="#8b5cf6" />
                  <Text style={styles.addButtonText}>{t('checkout.addPaymentMethod')}</Text>
                </TouchableOpacity>
              ) : (
                paymentMethods.map(method => renderPaymentMethod(method, method.id === selectedPaymentMethod?.id))
              )}
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('checkout.orderSummary')}</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('checkout.subtotal')}</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(finalPrice)}</Text>
                </View>
                {discount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, styles.discountLabel]}>
                      {t('live.liveDiscount')}
                    </Text>
                    <Text style={[styles.summaryValue, styles.discountValue]}>
                      -{formatCurrency(discount)}
                    </Text>
                  </View>
                )}
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelBold}>{t('checkout.total')}</Text>
                  <Text style={styles.summaryValueBold}>{formatCurrency(finalPrice)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Bottom Action */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (submitting || !selectedAddress || !selectedPaymentMethod) && styles.purchaseButtonDisabled
            ]}
            onPress={handleQuickPurchase}
            disabled={submitting || !selectedAddress || !selectedPaymentMethod}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="bolt" size={24} color="white" />
                <Text style={styles.purchaseButtonText}>
                  {t('live.buyNow')} {formatCurrency(finalPrice)}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 12,
    color: '#6b7280',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    color: '#78350f',
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  liveBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#78350f',
    fontWeight: '500',
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 8,
  },
  selectionCardSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  selectionContent: {
    flex: 1,
    marginLeft: 12,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  selectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
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
  summaryCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
  },
  discountLabel: {
    color: '#10b981',
  },
  discountValue: {
    color: '#10b981',
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  summaryLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
