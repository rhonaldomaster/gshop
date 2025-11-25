import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../hooks/useCart';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';
import { ordersService, CreateOrderRequest } from '../../services/orders.service';
import { api } from '../../services/api';

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document: {
    type: string;
    number: string;
  };
}

interface ShippingAddress {
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const documentTypes = [
  { label: 'Cédula de Ciudadanía', value: 'CC' },
  { label: 'Cédula de Extranjería', value: 'CE' },
  { label: 'Pasaporte', value: 'PA' },
  { label: 'Tarjeta de Identidad', value: 'TI' },
];

const colombianStates = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar',
  'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca',
  'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía',
  'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta',
  'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío',
  'Risaralda', 'San Andrés y Providencia', 'Santander',
  'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
];

export default function GuestCheckoutScreen() {
  const { t } = useTranslation('translation');
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { items, clearCart } = useCart();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    document: {
      type: 'CC',
      number: '',
    },
  });

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    address1: '',
    address2: '',
    city: '',
    state: 'Cundinamarca',
    postalCode: '',
    country: 'CO',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<{
    shippingType: 'local' | 'national';
    shippingCost: number;
    isFree: boolean;
    message: string;
  } | null>(null);

  // Enhanced validation functions
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
  }, []);

  const validatePhone = useCallback((phone: string): boolean => {
    // Colombian phone formats: +57 300 123 4567, 300 123 4567, 3001234567
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+57)?[1-9]\d{9}$/;
    return phoneRegex.test(cleanPhone);
  }, []);

  const validateDocumentNumber = useCallback((type: string, number: string): boolean => {
    const cleanNumber = number.trim().toUpperCase();
    if (!cleanNumber) return false;

    switch (type) {
      case 'CC':
      case 'CE':
        // Colombian ID: 6-12 digits, no special characters
        return /^\d{6,12}$/.test(cleanNumber) && parseInt(cleanNumber) > 0;
      case 'TI':
        // ID Card: 6-12 digits
        return /^\d{6,12}$/.test(cleanNumber) && parseInt(cleanNumber) > 0;
      case 'PA':
        // Passport: alphanumeric, 6-12 characters, must contain at least one letter
        return /^[A-Z0-9]{6,12}$/.test(cleanNumber) && /[A-Z]/.test(cleanNumber);
      default:
        return false;
    }
  }, []);

  const validatePostalCode = useCallback((postalCode: string): boolean => {
    // Colombian postal codes: 5-6 digits
    const cleanCode = postalCode.trim();
    return /^\d{5,6}$/.test(cleanCode) && parseInt(cleanCode) > 0;
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Customer info validation
    const firstName = customerInfo.firstName.trim();
    const lastName = customerInfo.lastName.trim();

    if (!firstName) {
      newErrors.firstName = t('checkout.guestCheckout.validation.firstNameRequired');
    } else if (firstName.length < 2) {
      newErrors.firstName = t('checkout.guestCheckout.validation.firstNameMinLength');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(firstName)) {
      newErrors.firstName = t('checkout.guestCheckout.validation.firstNameLettersOnly');
    }

    if (!lastName) {
      newErrors.lastName = t('checkout.guestCheckout.validation.lastNameRequired');
    } else if (lastName.length < 2) {
      newErrors.lastName = t('checkout.guestCheckout.validation.lastNameMinLength');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(lastName)) {
      newErrors.lastName = t('checkout.guestCheckout.validation.lastNameLettersOnly');
    }

    if (!customerInfo.email.trim()) {
      newErrors.email = t('checkout.guestCheckout.validation.emailRequired');
    } else if (!validateEmail(customerInfo.email)) {
      newErrors.email = t('checkout.guestCheckout.validation.emailInvalid');
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = t('checkout.guestCheckout.validation.phoneRequired');
    } else if (!validatePhone(customerInfo.phone)) {
      newErrors.phone = t('checkout.guestCheckout.validation.phoneInvalid');
    }

    if (!customerInfo.document.number.trim()) {
      newErrors.documentNumber = t('checkout.guestCheckout.validation.documentRequired');
    } else if (!validateDocumentNumber(customerInfo.document.type, customerInfo.document.number)) {
      const docTypeName = documentTypes.find(d => d.value === customerInfo.document.type)?.label;
      newErrors.documentNumber = t('checkout.guestCheckout.validation.documentInvalid', { docType: docTypeName });
    }

    // Shipping address validation
    const address1 = shippingAddress.address1.trim();
    const city = shippingAddress.city.trim();

    if (!address1) {
      newErrors.address1 = t('checkout.guestCheckout.validation.addressRequired');
    } else if (address1.length < 10) {
      newErrors.address1 = t('checkout.guestCheckout.validation.addressTooShort');
    }

    if (!city) {
      newErrors.city = t('checkout.guestCheckout.validation.cityRequired');
    } else if (city.length < 2) {
      newErrors.city = t('checkout.guestCheckout.validation.cityMinLength');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(city)) {
      newErrors.city = t('checkout.guestCheckout.validation.cityLettersOnly');
    }

    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = t('checkout.guestCheckout.validation.postalCodeRequired');
    } else if (!validatePostalCode(shippingAddress.postalCode)) {
      newErrors.postalCode = t('checkout.guestCheckout.validation.postalCodeInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [customerInfo, shippingAddress, validateEmail, validatePhone, validateDocumentNumber, validatePostalCode]);

  const handleContinueToShipping = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert(
        t('checkout.guestCheckout.validation.incompleteData'),
        t('checkout.guestCheckout.validation.pleaseReviewErrors'),
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Check if cart has items
      if (!items || items.length === 0) {
        Alert.alert(t('common.error'), t('checkout.alerts.emptyCartMessage'));
        return;
      }

      // Get seller ID from first cart item
      const sellerId = items[0]?.product?.sellerId;
      if (!sellerId) {
        Alert.alert(t('common.error'), t('checkout.errors.sellerNotFound'));
        return;
      }

      // Calculate order total (VAT already included in prices)
      const orderTotal = items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);

      // Calculate shipping cost
      const shippingResponse = await api.post<{
        shippingType: 'local' | 'national';
        shippingCost: number;
        isFree: boolean;
        message: string;
      }>('/orders/calculate-shipping', {
        sellerId,
        buyerCity: shippingAddress.city.trim(),
        buyerState: shippingAddress.state,
        orderTotal,
      });

      if (!shippingResponse.success || !shippingResponse.data) {
        Alert.alert(t('common.error'), t('checkout.errors.shippingCalculationFailed'));
        return;
      }

      // Save shipping info for later use
      setShippingInfo(shippingResponse.data);

      // Sanitize and prepare data
      const sanitizedCustomerInfo = {
        firstName: customerInfo.firstName.trim(),
        lastName: customerInfo.lastName.trim(),
        email: customerInfo.email.trim().toLowerCase(),
        phone: customerInfo.phone.replace(/[\s\-\(\)]/g, ''),
        document: {
          type: customerInfo.document.type,
          number: customerInfo.document.number.trim().toUpperCase(),
        },
      };

      // Prepare shipping address with mobile format (address not address1)
      const sanitizedShippingAddress = {
        firstName: sanitizedCustomerInfo.firstName,
        lastName: sanitizedCustomerInfo.lastName,
        address: shippingAddress.address1.trim(), // Mobile uses 'address'
        city: shippingAddress.city.trim(),
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode.trim(),
        phone: sanitizedCustomerInfo.phone,
        document: sanitizedCustomerInfo.document.number,
        documentType: sanitizedCustomerInfo.document.type as 'CC' | 'CE' | 'PA' | 'TI',
      };

      // Create order request using the correct format
      const orderRequest: CreateOrderRequest = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: sanitizedShippingAddress,
        shippingAmount: shippingResponse.data.shippingCost,
        isGuestOrder: true,
        notes: shippingAddress.address2.trim() || '', // Use address2 as notes
      };

      // Create the order (it will be mapped automatically by the service)
      const order = await ordersService.createOrder(orderRequest);

      if (order) {
        // Clear cart after successful order
        await clearCart(false);

        // Navigate directly to order detail
        (navigation as any).navigate('OrderDetail', { orderId: order.id });
      }
    } catch (error: any) {
      console.error('Error creating guest order:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('checkout.guestCheckout.errorProcessing'),
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [customerInfo, shippingAddress, validateForm, navigation, t, items]);

  // Clean input handlers
  const handlePhoneChange = useCallback((text: string) => {
    // Auto-format phone number as user types
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.length >= 10
      ? `+57 ${cleaned.slice(-10).replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}`
      : cleaned;
    setCustomerInfo({ ...customerInfo, phone: formatted });
  }, [customerInfo]);

  const handleDocumentNumberChange = useCallback((text: string) => {
    // Remove non-alphanumeric characters for document number
    const cleaned = customerInfo.document.type === 'PA'
      ? text.toUpperCase().replace(/[^A-Z0-9]/g, '')
      : text.replace(/\D/g, '');
    setCustomerInfo({
      ...customerInfo,
      document: { ...customerInfo.document, number: cleaned },
    });
  }, [customerInfo]);

  const handlePostalCodeChange = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setShippingAddress({ ...shippingAddress, postalCode: cleaned });
  }, [shippingAddress]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          {t('checkout.guestCheckout.title')}
        </GSText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Customer Information Section */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
              {t('checkout.guestCheckout.personalInfo')}
            </GSText>

            <GSInput
              label={t('checkout.guestCheckout.firstName')}
              value={customerInfo.firstName}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, firstName: text })}
              placeholder={t('checkout.guestCheckout.firstNamePlaceholder')}
              autoCapitalize="words"
              error={errors.firstName}
              style={styles.input}
            />

            <GSInput
              label={t('checkout.guestCheckout.lastName')}
              value={customerInfo.lastName}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, lastName: text })}
              placeholder={t('checkout.guestCheckout.lastNamePlaceholder')}
              autoCapitalize="words"
              error={errors.lastName}
              style={styles.input}
            />

            <GSInput
              label={t('auth.email')}
              value={customerInfo.email}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, email: text })}
              placeholder={t('checkout.guestCheckout.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              style={styles.input}
            />

            <GSInput
              label={t('checkout.guestCheckout.phone')}
              value={customerInfo.phone}
              onChangeText={handlePhoneChange}
              placeholder={t('checkout.guestCheckout.phonePlaceholder')}
              keyboardType="phone-pad"
              error={errors.phone}
              style={styles.input}
            />

            {/* Document Type and Number */}
            <View style={styles.documentContainer}>
              <View style={styles.documentTypeContainer}>
                <GSText variant="body" weight="semiBold" style={styles.inputLabel}>
                  {t('checkout.documentType')}
                </GSText>
                <View style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.colors.background, borderColor: theme.colors.gray300 }
                ]}>
                  <Picker
                    selectedValue={customerInfo.document.type}
                    onValueChange={(value) =>
                      setCustomerInfo({
                        ...customerInfo,
                        document: { ...customerInfo.document, type: value },
                      })
                    }
                    style={[styles.picker, { color: theme.colors.text }]}
                  >
                    {documentTypes.map((doc) => (
                      <Picker.Item key={doc.value} label={doc.label} value={doc.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.documentNumberContainer}>
                <GSInput
                  label={t('checkout.documentNumber')}
                  value={customerInfo.document.number}
                  onChangeText={handleDocumentNumberChange}
                  placeholder={t('checkout.guestCheckout.documentNumberPlaceholder')}
                  keyboardType={customerInfo.document.type === 'PA' ? 'default' : 'numeric'}
                  autoCapitalize={customerInfo.document.type === 'PA' ? 'characters' : 'none'}
                  error={errors.documentNumber}
                  style={styles.input}
                  maxLength={customerInfo.document.type === 'PA' ? 12 : 12}
                />
              </View>
            </View>
          </View>

          {/* Shipping Address Section */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
              {t('checkout.shippingAddress')}
            </GSText>

            <GSInput
              label={t('checkout.guestCheckout.mainAddress')}
              value={shippingAddress.address1}
              onChangeText={(text) => setShippingAddress({ ...shippingAddress, address1: text })}
              placeholder={t('checkout.guestCheckout.mainAddressPlaceholder')}
              error={errors.address1}
              style={styles.input}
            />

            <GSInput
              label={t('checkout.guestCheckout.addressComplement')}
              value={shippingAddress.address2}
              onChangeText={(text) => setShippingAddress({ ...shippingAddress, address2: text })}
              placeholder={t('checkout.guestCheckout.addressComplementPlaceholder')}
              style={styles.input}
            />

            <View style={styles.rowContainer}>
              <GSInput
                label={t('checkout.city')}
                value={shippingAddress.city}
                onChangeText={(text) => setShippingAddress({ ...shippingAddress, city: text })}
                placeholder={t('checkout.guestCheckout.cityPlaceholder')}
                error={errors.city}
                containerStyle={styles.halfWidth}
                style={styles.input}
              />

              <GSInput
                label={t('checkout.zipCode')}
                value={shippingAddress.postalCode}
                onChangeText={handlePostalCodeChange}
                placeholder={t('checkout.guestCheckout.postalCodePlaceholder')}
                keyboardType="numeric"
                error={errors.postalCode}
                containerStyle={styles.halfWidth}
                style={styles.input}
              />
            </View>

            <View style={styles.documentContainer}>
              <View style={styles.documentTypeContainer}>
                <GSText variant="body" weight="bold" style={styles.inputLabel}>
                  {t('checkout.state')}
                </GSText>
                <View style={[
                  styles.pickerContainer,
                  { backgroundColor: theme.colors.background, borderColor: '#E5E7EB' }
                ]}>
                  <Picker
                    selectedValue={shippingAddress.state}
                    onValueChange={(value) =>
                      setShippingAddress({ ...shippingAddress, state: value })
                    }
                    style={[styles.picker, { color: theme.colors.text }]}
                  >
                    {colombianStates.map((state) => (
                      <Picker.Item key={state} label={state} value={state} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
          <GSButton
            title={t('checkout.guestCheckout.continueToShipping')}
            onPress={handleContinueToShipping}
            loading={loading}
            disabled={loading}
            style={styles.continueButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  documentContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  documentTypeContainer: {
    flex: 1,
  },
  documentNumberContainer: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  continueButton: {
    marginBottom: 0,
  },
});