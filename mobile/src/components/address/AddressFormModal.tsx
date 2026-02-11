import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import GSText from '../ui/GSText';
import GSButton from '../ui/GSButton';
import { addressesService, Address, DocumentType } from '../../services/addresses.service';

// --- Shared constants ---

const COLOMBIAN_STATES = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlantico', 'Bolivar', 'Boyaca',
  'Caldas', 'Caqueta', 'Casanare', 'Cauca', 'Cesar', 'Choco', 'Cordoba',
  'Cundinamarca', 'Guainia', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Narino', 'Norte de Santander', 'Putumayo', 'Quindio', 'Risaralda',
  'San Andres y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupes', 'Vichada', 'Bogota D.C.'
];

// --- Local GSInput (same pattern as AddressBookScreen) ---

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

const FormInput: React.FC<InputProps> = ({
  label, value, onChangeText, error, placeholder,
  keyboardType, multiline, numberOfLines, maxLength,
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

// --- Component props ---

interface AddressFormModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressCreated: (address: Address) => void;
  setAsDefault?: boolean;
}

export default function AddressFormModal({
  visible,
  onClose,
  onAddressCreated,
  setAsDefault = true,
}: AddressFormModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
    { value: 'CC', label: t('addresses.documentTypes.CC') },
    { value: 'CE', label: t('addresses.documentTypes.CE') },
    { value: 'PA', label: t('addresses.documentTypes.PA') },
    { value: 'TI', label: t('addresses.documentTypes.TI') },
  ];

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
  const [saving, setSaving] = useState(false);
  const [showStateSelector, setShowStateSelector] = useState(false);
  const [showDocTypeSelector, setShowDocTypeSelector] = useState(false);

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

  const formatPhoneNumber = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
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

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const created = await addressesService.createAddress({
        ...formData,
        isDefault: setAsDefault,
      });
      resetForm();
      onAddressCreated(created);
    } catch (error) {
      console.error('Error creating address:', error);
      Alert.alert(t('common.error'), t('addresses.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const styles = StyleSheet.create({
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
    actionButton: {
      flex: 1,
    },
  });

  return (
    <>
      {/* Main Form Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <GSText style={styles.modalTitle}>
                {t('addresses.newAddress')}
              </GSText>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <FormInput
                  label={t('addresses.fullName')}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  error={formErrors.fullName}
                  placeholder={t('addresses.fullNamePlaceholder')}
                />
              </View>

              <View style={styles.inputGroup}>
                <FormInput
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
                <FormInput
                  label={t('addresses.address')}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  error={formErrors.address}
                  placeholder={t('addresses.addressPlaceholder')}
                  multiline={true}
                  numberOfLines={2}
                />
              </View>

              <View style={styles.inputGroup}>
                <FormInput
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
                <FormInput
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
                <FormInput
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
                onPress={handleClose}
                style={styles.actionButton}
              />
              <GSButton
                title={t('addresses.save')}
                onPress={handleSave}
                style={styles.actionButton}
                loading={saving}
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
    </>
  );
}
