import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { addressesService, Address, DocumentType } from '../../services/addresses.service';

// Simple Input Component
interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
}

const GSInput: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
  maxLength,
}) => {
  const { theme } = useTheme();

  return (
    <View>
      <GSText variant="body" weight="semiBold" style={{ marginBottom: 8 }}>
        {label}
      </GSText>
      <TextInput
        style={[
          {
            borderWidth: 1,
            borderColor: error ? theme.colors.error : '#E5E7EB',
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
          },
          multiline && { height: 80, textAlignVertical: 'top' },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
      />
      {error && (
        <GSText variant="caption" color="error" style={{ marginTop: 4 }}>
          {error}
        </GSText>
      )}
    </View>
  );
};

type RootStackParamList = {
  AddressBook: undefined;
  Checkout: undefined;
};

type AddressBookScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddressBook'>;
type AddressBookScreenRouteProp = RouteProp<RootStackParamList, 'AddressBook'>;

interface Props {
  navigation: AddressBookScreenNavigationProp;
  route: AddressBookScreenRouteProp;
}

// Document types will be loaded from i18n

const COLOMBIAN_STATES = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada', 'Bogotá D.C.'
];

export const AddressBookScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
    { value: 'CC', label: t('addresses.documentTypes.CC') },
    { value: 'CE', label: t('addresses.documentTypes.CE') },
    { value: 'PA', label: t('addresses.documentTypes.PA') },
    { value: 'TI', label: t('addresses.documentTypes.TI') },
  ];
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    documentType: 'CC' as DocumentType,
    documentNumber: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showStateSelector, setShowStateSelector] = useState(false);
  const [showDocTypeSelector, setShowDocTypeSelector] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const fetchedAddresses = await addressesService.getAddresses();
      // Filter out any addresses without required fields (old format)
      const validAddresses = fetchedAddresses.filter(addr =>
        addr.id && addr.fullName && addr.documentType && addr.documentNumber
      );
      setAddresses(validAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert(t('common.error'), t('addresses.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = t('addresses.errors.fullNameRequired');
    }

    const phoneRegex = /^(\+57\s?)?(3[0-9]{2}|[1-8][0-9]{2})\s?[0-9]{3}\s?[0-9]{4}$/;
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = t('addresses.errors.phoneRequired');
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = t('addresses.errors.phoneInvalid');
    }

    if (!formData.address.trim()) {
      errors.address = t('addresses.errors.addressRequired');
    }

    if (!formData.city.trim()) {
      errors.city = t('addresses.errors.cityRequired');
    }

    if (!formData.state) {
      errors.state = t('addresses.errors.stateRequired');
    }

    const postalCodeRegex = /^[0-9]{6}$/;
    if (!formData.postalCode.trim()) {
      errors.postalCode = t('addresses.errors.postalCodeRequired');
    } else if (!postalCodeRegex.test(formData.postalCode)) {
      errors.postalCode = t('addresses.errors.postalCodeInvalid');
    }

    if (!formData.documentType) {
      errors.documentType = t('addresses.errors.documentTypeRequired');
    }

    if (!formData.documentNumber.trim()) {
      errors.documentNumber = t('addresses.errors.documentNumberRequired');
    } else if (formData.documentNumber.length < 5 || formData.documentNumber.length > 15) {
      errors.documentNumber = t('addresses.errors.documentNumberInvalid');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      if (editingAddress) {
        // Update existing address
        await addressesService.updateAddress(editingAddress.id, formData);
      } else {
        // Add new address
        await addressesService.createAddress({
          ...formData,
          isDefault: addresses.length === 0,
        });
      }

      // Reload addresses from backend
      await loadAddresses();

      resetForm();
      setShowAddModal(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert(t('common.error'), t('addresses.errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      t('addresses.deleteTitle'),
      t('addresses.deleteConfirm'),
      [
        { text: t('addresses.cancel'), style: 'cancel' },
        {
          text: t('addresses.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await addressesService.deleteAddress(addressId);
              await loadAddresses();
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert(t('common.error'), t('addresses.errors.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await addressesService.setDefaultAddress(addressId);
      await loadAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert(t('common.error'), t('addresses.errors.setDefaultFailed'));
    }
  };

  const handleEditAddress = (address: Address) => {
    setFormData({
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      address: address.address,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      documentType: address.documentType,
      documentNumber: address.documentNumber,
    });
    setEditingAddress(address);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phoneNumber: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      documentType: 'CC',
      documentNumber: '',
    });
    setFormErrors({});
  };

  const handleOpenAddModal = () => {
    resetForm();
    setEditingAddress(null);
    setShowAddModal(true);
  };

  const formatPhoneNumber = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    backButton: {
      marginRight: 15,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    addressCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.gray300,
    },
    defaultBadge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    defaultText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    addressName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    addressDetails: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    addressActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.gray300,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    editButton: {
      backgroundColor: theme.colors.primary + '20',
    },
    deleteButton: {
      backgroundColor: theme.colors.error + '20',
    },
    defaultButton: {
      backgroundColor: theme.colors.success + '20',
    },
    actionText: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight: '500',
    },
    editText: {
      color: theme.colors.primary,
    },
    deleteText: {
      color: theme.colors.error,
    },
    defaultActionText: {
      color: theme.colors.success,
    },
    addButton: {
      margin: 20,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.gray300,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    modalBody: {
      padding: 20,
    },
    inputGroup: {
      marginBottom: 16,
    },
    stateSelector: {
      borderWidth: 1,
      borderColor: theme.colors.gray300,
      borderRadius: 8,
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    stateSelectorText: {
      color: formData.state ? theme.colors.text : theme.colors.textSecondary,
      fontSize: 16,
    },
    stateList: {
      maxHeight: 300,
    },
    stateOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.gray300,
    },
    stateOptionText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    modalActions: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
    },
    saveButton: {
      flex: 1,
    },
  });

  if (loading && addresses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" style={{ marginTop: 12 }}>{t('addresses.loading')}</GSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <GSText style={styles.title}>{t('addresses.title')}</GSText>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="location-outline"
              size={64}
              color={theme.colors.textSecondary}
              style={styles.emptyIcon}
            />
            <GSText style={styles.emptyTitle}>{t('addresses.empty')}</GSText>
            <GSText style={styles.emptySubtitle}>
              {t('addresses.emptyMessage')}
            </GSText>
            <GSButton
              title={t('addresses.addFirst')}
              onPress={handleOpenAddModal}
              style={{ paddingHorizontal: 32 }}
            />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {addresses.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <GSText style={styles.defaultText}>{t('addresses.default')}</GSText>
                  </View>
                )}

                <GSText style={styles.addressName}>{address.fullName}</GSText>
                <GSText style={styles.addressDetails}>{address.phoneNumber}</GSText>
                <GSText style={styles.addressDetails}>
                  {address.documentType} {address.documentNumber}
                </GSText>
                <GSText style={styles.addressDetails}>
                  {address.address}
                </GSText>
                <GSText style={styles.addressDetails}>
                  {address.city}, {address.state} {address.postalCode}
                </GSText>

                <View style={styles.addressActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditAddress(address)}
                  >
                    <Ionicons name="pencil" size={16} color={theme.colors.primary} />
                    <GSText style={[styles.actionText, styles.editText]}>{t('addresses.edit')}</GSText>
                  </TouchableOpacity>

                  {!address.isDefault && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.defaultButton]}
                      onPress={() => handleSetDefault(address.id)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                      <GSText style={[styles.actionText, styles.defaultActionText]}>
                        {t('addresses.setDefault')}
                      </GSText>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteAddress(address.id)}
                  >
                    <Ionicons name="trash" size={16} color={theme.colors.error} />
                    <GSText style={[styles.actionText, styles.deleteText]}>{t('addresses.delete')}</GSText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <GSButton
        title={t('addresses.addNew')}
        onPress={handleOpenAddModal}
        style={styles.addButton}
        leftIcon={<Ionicons name="add" size={20} color="white" />}
      />

      {/* Add/Edit Address Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <GSText style={styles.modalTitle}>
                {editingAddress ? t('addresses.editAddress') : t('addresses.newAddress')}
              </GSText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowAddModal(false);
                  setEditingAddress(null);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <GSInput
                  label={t('addresses.fullName')}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  error={formErrors.fullName}
                  placeholder={t('addresses.fullNamePlaceholder')}
                />
              </View>

              <View style={styles.inputGroup}>
                <GSInput
                  label={t('addresses.phone')}
                  value={formData.phoneNumber}
                  onChangeText={(text) => {
                    const formatted = formatPhoneNumber(text);
                    setFormData({ ...formData, phoneNumber: formatted });
                  }}
                  error={formErrors.phoneNumber}
                  placeholder={t('addresses.phonePlaceholder')}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <GSInput
                  label={t('addresses.address')}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  error={formErrors.address}
                  placeholder={t('addresses.addressPlaceholder')}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.inputGroup}>
                <GSInput
                  label={t('addresses.city')}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  error={formErrors.city}
                  placeholder={t('addresses.cityPlaceholder')}
                />
              </View>

              <View style={styles.inputGroup}>
                <GSText style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: theme.colors.text }}>
                  {t('addresses.state')}
                </GSText>
                <TouchableOpacity
                  style={styles.stateSelector}
                  onPress={() => setShowStateSelector(true)}
                >
                  <GSText style={styles.stateSelectorText}>
                    {formData.state || t('addresses.statePlaceholder')}
                  </GSText>
                </TouchableOpacity>
                {formErrors.state && (
                  <GSText style={{ color: theme.colors.error, fontSize: 14, marginTop: 4 }}>
                    {formErrors.state}
                  </GSText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <GSInput
                  label={t('addresses.postalCode')}
                  value={formData.postalCode}
                  onChangeText={(text) => setFormData({ ...formData, postalCode: text.replace(/\D/g, '').slice(0, 6) })}
                  error={formErrors.postalCode}
                  placeholder={t('addresses.postalCodePlaceholder')}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <GSText style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: theme.colors.text }}>
                  {t('addresses.documentType')}
                </GSText>
                <TouchableOpacity
                  style={styles.stateSelector}
                  onPress={() => setShowDocTypeSelector(true)}
                >
                  <GSText style={styles.stateSelectorText}>
                    {DOCUMENT_TYPES.find(dt => dt.value === formData.documentType)?.label || t('addresses.documentTypePlaceholder')}
                  </GSText>
                </TouchableOpacity>
                {formErrors.documentType && (
                  <GSText style={{ color: theme.colors.error, fontSize: 14, marginTop: 4 }}>
                    {formErrors.documentType}
                  </GSText>
                )}
              </View>

              <View style={styles.inputGroup}>
                <GSInput
                  label={t('addresses.documentNumber')}
                  value={formData.documentNumber}
                  onChangeText={(text) => setFormData({ ...formData, documentNumber: text.replace(/\D/g, '') })}
                  error={formErrors.documentNumber}
                  placeholder={t('addresses.documentNumberPlaceholder')}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <GSButton
                title={t('addresses.cancel')}
                variant="outline"
                onPress={() => {
                  setShowAddModal(false);
                  setEditingAddress(null);
                  resetForm();
                }}
                style={styles.cancelButton}
              />
              <GSButton
                title={editingAddress ? t('addresses.update') : t('addresses.save')}
                onPress={handleSaveAddress}
                style={styles.saveButton}
                loading={loading}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* State Selector Modal */}
      <Modal
        visible={showStateSelector}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <GSText style={styles.modalTitle}>{t('addresses.selectState')}</GSText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowStateSelector(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.stateList} showsVerticalScrollIndicator={false}>
              {COLOMBIAN_STATES.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={styles.stateOption}
                  onPress={() => {
                    setFormData({ ...formData, state });
                    setShowStateSelector(false);
                  }}
                >
                  <GSText style={styles.stateOptionText}>{state}</GSText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Document Type Selector Modal */}
      <Modal
        visible={showDocTypeSelector}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <GSText style={styles.modalTitle}>{t('addresses.selectDocumentType')}</GSText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDocTypeSelector(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.stateList} showsVerticalScrollIndicator={false}>
              {DOCUMENT_TYPES.map((docType) => (
                <TouchableOpacity
                  key={docType.value}
                  style={styles.stateOption}
                  onPress={() => {
                    setFormData({ ...formData, documentType: docType.value });
                    setShowDocTypeSelector(false);
                  }}
                >
                  <GSText style={styles.stateOptionText}>{docType.label}</GSText>
                  {formData.documentType === docType.value && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default AddressBookScreen;