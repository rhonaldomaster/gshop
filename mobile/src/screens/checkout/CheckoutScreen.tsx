import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import { ordersService, CreateOrderRequest, ShippingAddress, ShippingOption } from '../../services/orders.service';
import { addressesService, Address } from '../../services/addresses.service';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import GSInput from '../../components/ui/GSInput';

// Step indicator component
interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <React.Fragment key={index}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: index < currentStep
                  ? theme.colors.primary
                  : index === currentStep
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
          >
            <GSText
              variant="caption"
              color={index <= currentStep ? 'white' : 'textSecondary'}
              weight="bold"
            >
              {index + 1}
            </GSText>
          </View>
          {index < totalSteps - 1 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor: index < currentStep ? theme.colors.primary : theme.colors.border,
                },
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

// Shipping address form component
interface ShippingFormProps {
  address: ShippingAddress;
  onUpdate: (address: ShippingAddress) => void;
  onNext: () => void;
  isLoading?: boolean;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ address, onUpdate, onNext, isLoading }) => {
  const { theme } = useTheme();
  const hasDefaultAddress = address.address && address.city && address.state;
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);

  const documentTypes = [
    { value: 'CC', label: 'Cédula de Ciudadanía (CC)' },
    { value: 'CE', label: 'Cédula de Extranjería (CE)' },
    { value: 'PA', label: 'Pasaporte (PA)' },
    { value: 'TI', label: 'Tarjeta de Identidad (TI)' },
  ];

  const handleFieldChange = (field: keyof ShippingAddress, value: string) => {
    onUpdate({ ...address, [field]: value });
  };

  const validateForm = (): boolean => {
    const required = ['firstName', 'lastName', 'address', 'city', 'state', 'postalCode', 'phone'];

    for (const field of required) {
      if (!address[field as keyof ShippingAddress]?.trim()) {
        Alert.alert('Missing Information', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <View style={styles.formSection}>
      <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
        Shipping Address
      </GSText>

      {hasDefaultAddress && (
        <View style={[styles.defaultAddressBadge, { backgroundColor: theme.colors.success + '20' }]}>
          <GSText variant="caption" color="success" weight="medium">
            ✓ Using your default address
          </GSText>
        </View>
      )}

      <View style={styles.formRow}>
        <GSInput
          placeholder="First Name"
          value={address.firstName}
          onChangeText={(value) => handleFieldChange('firstName', value)}
          containerStyle={styles.halfInput}
        />
        <GSInput
          placeholder="Last Name"
          value={address.lastName}
          onChangeText={(value) => handleFieldChange('lastName', value)}
          containerStyle={styles.halfInput}
        />
      </View>

      <GSInput
        placeholder="Address"
        value={address.address}
        onChangeText={(value) => handleFieldChange('address', value)}
      />

      <View style={styles.formRow}>
        <GSInput
          placeholder="City"
          value={address.city}
          onChangeText={(value) => handleFieldChange('city', value)}
          containerStyle={styles.halfInput}
        />
        <GSInput
          placeholder="State/Department"
          value={address.state}
          onChangeText={(value) => handleFieldChange('state', value)}
          containerStyle={styles.halfInput}
        />
      </View>

      <View style={styles.formRow}>
        <GSInput
          placeholder="Postal Code"
          value={address.postalCode}
          onChangeText={(value) => handleFieldChange('postalCode', value)}
          containerStyle={styles.halfInput}
          keyboardType="numeric"
        />
        <GSInput
          placeholder="Phone"
          value={address.phone}
          onChangeText={(value) => handleFieldChange('phone', value)}
          containerStyle={styles.halfInput}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formRow}>
        <TouchableOpacity
          style={[styles.halfInput, styles.docTypeSelector, { borderColor: theme.colors.border }]}
          onPress={() => setShowDocTypeModal(true)}
        >
          <GSText variant="body" color={address.documentType ? 'text' : 'textSecondary'}>
            {address.documentType || 'Type'}
          </GSText>
        </TouchableOpacity>
        <GSInput
          placeholder="Document Number"
          value={address.document || ''}
          onChangeText={(value) => handleFieldChange('document', value)}
          containerStyle={styles.halfInput}
          keyboardType="numeric"
        />
      </View>

      <GSButton
        title="Continue to Shipping"
        onPress={handleNext}
        style={styles.nextButton}
        loading={isLoading}
      />

      {/* Document Type Modal */}
      <Modal
        visible={showDocTypeModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <GSText variant="h4" weight="bold">Select Document Type</GSText>
              <TouchableOpacity onPress={() => setShowDocTypeModal(false)}>
                <GSText variant="body" color="primary">✕</GSText>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.docTypeList}>
              {documentTypes.map((docType) => (
                <TouchableOpacity
                  key={docType.value}
                  style={[styles.docTypeOption, { borderBottomColor: theme.colors.border }]}
                  onPress={() => {
                    handleFieldChange('documentType', docType.value);
                    setShowDocTypeModal(false);
                  }}
                >
                  <GSText variant="body">{docType.label}</GSText>
                  {address.documentType === docType.value && (
                    <GSText variant="body" color="primary">✓</GSText>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Shipping options component
interface ShippingOptionsProps {
  options: ShippingOption[];
  selectedOption: ShippingOption | null;
  onSelect: (option: ShippingOption) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const ShippingOptions: React.FC<ShippingOptionsProps> = ({
  options,
  selectedOption,
  onSelect,
  onNext,
  onBack,
  isLoading
}) => {
  const { theme } = useTheme();
  const { formatPrice } = useCart();

  return (
    <View style={styles.formSection}>
      <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
        Shipping Options
      </GSText>

      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.shippingOption,
            {
              borderColor: selectedOption?.id === option.id
                ? theme.colors.primary
                : theme.colors.border,
              backgroundColor: selectedOption?.id === option.id
                ? theme.colors.primary + '10'
                : theme.colors.surface,
            },
          ]}
          onPress={() => onSelect(option)}
        >
          <View style={styles.shippingOptionContent}>
            <View style={styles.shippingOptionHeader}>
              <GSText variant="body" weight="medium">
                {option.carrier} - {option.serviceName}
              </GSText>
              <GSText variant="body" weight="bold" color="primary">
                {option.price === 0 ? 'Free' : formatPrice(option.price)}
              </GSText>
            </View>

            <GSText variant="caption" color="textSecondary">
              Delivery in {option.estimatedDays} business day{option.estimatedDays !== 1 ? 's' : ''}
            </GSText>

            {option.description && (
              <GSText variant="caption" color="textSecondary" style={styles.shippingDescription}>
                {option.description}
              </GSText>
            )}
          </View>

          <View
            style={[
              styles.radioButton,
              {
                borderColor: selectedOption?.id === option.id
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
          >
            {selectedOption?.id === option.id && (
              <View
                style={[
                  styles.radioButtonInner,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            )}
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.navigationButtons}>
        <GSButton
          title="Back"
          onPress={onBack}
          variant="outlined"
          style={styles.backButton}
        />
        <GSButton
          title="Continue to Payment"
          onPress={onNext}
          style={styles.nextButton}
          disabled={!selectedOption}
          loading={isLoading}
        />
      </View>
    </View>
  );
};

// Order summary component
interface OrderSummaryProps {
  onBack: () => void;
  onPlaceOrder: () => void;
  isPlacingOrder?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ onBack, onPlaceOrder, isPlacingOrder }) => {
  const { theme } = useTheme();
  const {
    items,
    formatPrice,
    getCartSummary,
    getShippingEstimate,
    getTaxEstimate,
    getTotalEstimate,
  } = useCart();

  const summary = getCartSummary();
  const shipping = getShippingEstimate();
  const tax = getTaxEstimate();
  const total = getTotalEstimate();

  return (
    <View style={styles.formSection}>
      <GSText variant="h4" weight="bold" style={styles.sectionTitle}>
        Order Summary
      </GSText>

      {/* Cart Items */}
      <View style={styles.orderItems}>
        {items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <View style={styles.orderItemInfo}>
              <GSText variant="body" weight="medium" numberOfLines={1}>
                {item.product.name}
              </GSText>
              <GSText variant="caption" color="textSecondary">
                Qty: {item.quantity} × {formatPrice(item.price)}
              </GSText>
            </View>
            <GSText variant="body" weight="medium">
              {formatPrice(item.subtotal)}
            </GSText>
          </View>
        ))}
      </View>

      {/* Order Totals */}
      <View style={styles.orderTotals}>
        <View style={styles.totalRow}>
          <GSText variant="body">Subtotal ({summary.totalItems} items)</GSText>
          <GSText variant="body">{formatPrice(summary.subtotal)}</GSText>
        </View>

        <View style={styles.totalRow}>
          <GSText variant="body" color="textSecondary">Shipping</GSText>
          <GSText variant="body" color="textSecondary">
            {shipping === 0 ? 'Free' : formatPrice(shipping)}
          </GSText>
        </View>

        <View style={styles.totalRow}>
          <GSText variant="body" color="textSecondary">Tax (estimated)</GSText>
          <GSText variant="body" color="textSecondary">{formatPrice(tax)}</GSText>
        </View>

        <View style={[styles.totalRow, styles.finalTotal]}>
          <GSText variant="h4" weight="bold">Total</GSText>
          <GSText variant="h4" weight="bold" color="primary">
            {formatPrice(total)}
          </GSText>
        </View>
      </View>

      <View style={styles.navigationButtons}>
        <GSButton
          title="Back"
          onPress={onBack}
          variant="outlined"
          style={styles.backButton}
        />
        <GSButton
          title="Place Order"
          onPress={onPlaceOrder}
          style={styles.nextButton}
          loading={isPlacingOrder}
        />
      </View>
    </View>
  );
};

// Main checkout screen component
export default function CheckoutScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { items, clearCart } = useCart();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    document: '',
    documentType: 'CC',
  });
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);

  // API hooks
  const shippingOptionsApi = useApi(ordersService.getShippingOptions);
  const createOrderApi = useApi(ordersService.createOrder);

  // Helper function to map Address to ShippingAddress
  const mapAddressToShipping = (address: Address): ShippingAddress => {
    const [firstName, ...lastNameParts] = address.fullName.split(' ');
    return {
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      address: address.address,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      phone: address.phoneNumber,
      document: '',
      documentType: 'CC',
    };
  };

  // Load default address on mount
  useEffect(() => {
    const loadDefaultAddress = async () => {
      if (!user) {
        setLoadingAddress(false);
        return;
      }

      try {
        setLoadingAddress(true);
        const defaultAddress = await addressesService.getDefaultAddress();

        if (defaultAddress) {
          const shippingAddr = mapAddressToShipping(defaultAddress);
          setShippingAddress(shippingAddr);
        }
      } catch (error) {
        console.error('Failed to load default address:', error);
      } finally {
        setLoadingAddress(false);
      }
    };

    loadDefaultAddress();
  }, [user]);

  // Check if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Your cart is empty. Please add items before checkout.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [items.length, navigation]);

  // Handle shipping address next
  const handleShippingAddressNext = async () => {
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress,
      };

      const options = await shippingOptionsApi.execute(orderData);
      if (options && options.length > 0) {
        setShippingOptions(options);
        setCurrentStep(1);
      } else {
        Alert.alert('Error', 'No shipping options available for this address');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load shipping options');
    }
  };

  // Handle shipping option next
  const handleShippingOptionNext = () => {
    if (selectedShippingOption) {
      setCurrentStep(2);
    }
  };

  // Handle place order
  const handlePlaceOrder = async () => {
    try {
      if (!selectedShippingOption) {
        Alert.alert('Error', 'Please select a shipping option');
        return;
      }

      const orderRequest: CreateOrderRequest = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress,
        isGuestOrder: !user,
        notes: '',
      };

      const order = await createOrderApi.execute(orderRequest);

      if (order) {
        // Clear cart after successful order
        await clearCart(false);

        // Navigate to order confirmation
        Alert.alert(
          'Order Placed!',
          `Your order #${order.orderNumber} has been placed successfully.`,
          [
            {
              text: 'View Order',
              onPress: () => navigation.navigate('OrderDetail' as any, { orderId: order.id }),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Order Failed', error.message || 'Failed to place order. Please try again.');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const steps = ['Shipping', 'Delivery', 'Review'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <GSText variant="body" color="primary">← Back</GSText>
        </TouchableOpacity>
        <GSText variant="h4" weight="bold">Checkout</GSText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Indicator */}
      <View style={styles.stepContainer}>
        <StepIndicator currentStep={currentStep} totalSteps={steps.length} />
        <View style={styles.stepLabels}>
          {steps.map((step, index) => (
            <GSText
              key={step}
              variant="caption"
              color={index <= currentStep ? 'primary' : 'textSecondary'}
              weight={index === currentStep ? 'medium' : 'normal'}
              style={styles.stepLabel}
            >
              {step}
            </GSText>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 0 && (
          loadingAddress ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <GSText variant="body" color="textSecondary" style={styles.loadingText}>
                Loading your address...
              </GSText>
            </View>
          ) : (
            <ShippingForm
              address={shippingAddress}
              onUpdate={setShippingAddress}
              onNext={handleShippingAddressNext}
              isLoading={shippingOptionsApi.isLoading}
            />
          )
        )}

        {currentStep === 1 && (
          <ShippingOptions
            options={shippingOptions}
            selectedOption={selectedShippingOption}
            onSelect={setSelectedShippingOption}
            onNext={handleShippingOptionNext}
            onBack={() => setCurrentStep(0)}
          />
        )}

        {currentStep === 2 && (
          <OrderSummary
            onBack={() => setCurrentStep(1)}
            onPlaceOrder={handlePlaceOrder}
            isPlacingOrder={createOrderApi.isLoading}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    minWidth: 60,
  },
  headerSpacer: {
    minWidth: 60,
  },
  stepContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stepLabel: {
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
  },
  formSection: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 20,
  },
  defaultAddressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  docTypeSelector: {
    height: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    marginTop: 20,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  docTypeList: {
    maxHeight: 300,
  },
  docTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  shippingOptionContent: {
    flex: 1,
  },
  shippingOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shippingDescription: {
    marginTop: 4,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
  },
  orderItems: {
    marginBottom: 20,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderTotals: {
    paddingTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  finalTotal: {
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
});