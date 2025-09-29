import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { GSText } from '../../components/common/GSText';
import { GSButton } from '../../components/common/GSButton';
import { GSInput } from '../../components/common/GSInput';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';

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

interface Address {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

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
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showStateSelector, setShowStateSelector] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockAddresses: Address[] = [
        {
          id: '1',
          fullName: 'Juan Pérez',
          phoneNumber: '+57 300 123 4567',
          address: 'Carrera 15 #93-45, Apto 501',
          city: 'Bogotá',
          state: 'Bogotá D.C.',
          postalCode: '110221',
          isDefault: true,
        },
        {
          id: '2',
          fullName: 'María González',
          phoneNumber: '+57 310 987 6543',
          address: 'Calle 10 #5-25',
          city: 'Medellín',
          state: 'Antioquia',
          postalCode: '050001',
          isDefault: false,
        },
      ];
      setAddresses(mockAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      Alert.alert('Error', 'No se pudieron cargar las direcciones');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'El nombre completo es requerido';
    }

    const phoneRegex = /^(\+57\s?)?(3[0-9]{2}|[1-8][0-9]{2})\s?[0-9]{3}\s?[0-9]{4}$/;
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'El teléfono es requerido';
    } else if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = 'Formato de teléfono inválido';
    }

    if (!formData.address.trim()) {
      errors.address = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      errors.city = 'La ciudad es requerida';
    }

    if (!formData.state) {
      errors.state = 'El departamento es requerido';
    }

    const postalCodeRegex = /^[0-9]{6}$/;
    if (!formData.postalCode.trim()) {
      errors.postalCode = 'El código postal es requerido';
    } else if (!postalCodeRegex.test(formData.postalCode)) {
      errors.postalCode = 'Código postal debe tener 6 dígitos';
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
        const updatedAddresses = addresses.map(addr =>
          addr.id === editingAddress.id
            ? { ...addr, ...formData }
            : addr
        );
        setAddresses(updatedAddresses);
      } else {
        // Add new address
        const newAddress: Address = {
          id: Date.now().toString(),
          ...formData,
          isDefault: addresses.length === 0, // First address is default
        };
        setAddresses([...addresses, newAddress]);
      }

      resetForm();
      setShowAddModal(false);
      setEditingAddress(null);
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'No se pudo guardar la dirección');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Eliminar Dirección',
      '¿Estás seguro de que quieres eliminar esta dirección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const filteredAddresses = addresses.filter(addr => addr.id !== addressId);

            // If we deleted the default address, make the first remaining address default
            if (filteredAddresses.length > 0) {
              const deletedAddress = addresses.find(addr => addr.id === addressId);
              if (deletedAddress?.isDefault) {
                filteredAddresses[0].isDefault = true;
              }
            }

            setAddresses(filteredAddresses);
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
      }));
      setAddresses(updatedAddresses);
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'No se pudo establecer como dirección predeterminada');
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
      borderColor: theme.colors.border,
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
      borderTopColor: theme.colors.border,
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
      borderBottomColor: theme.colors.border,
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
      borderColor: theme.colors.border,
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
      borderBottomColor: theme.colors.border,
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
    return <LoadingOverlay />;
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
          <GSText style={styles.title}>Mis Direcciones</GSText>
        </View>

        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="location-outline"
              size={64}
              color={theme.colors.textSecondary}
              style={styles.emptyIcon}
            />
            <GSText style={styles.emptyTitle}>No tienes direcciones guardadas</GSText>
            <GSText style={styles.emptySubtitle}>
              Agrega una dirección para hacer tus compras más rápidas
            </GSText>
            <GSButton
              title="Agregar Primera Dirección"
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
                    <GSText style={styles.defaultText}>PREDETERMINADA</GSText>
                  </View>
                )}

                <GSText style={styles.addressName}>{address.fullName}</GSText>
                <GSText style={styles.addressDetails}>{address.phoneNumber}</GSText>
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
                    <GSText style={[styles.actionText, styles.editText]}>Editar</GSText>
                  </TouchableOpacity>

                  {!address.isDefault && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.defaultButton]}
                      onPress={() => handleSetDefault(address.id)}
                    >
                      <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                      <GSText style={[styles.actionText, styles.defaultActionText]}>
                        Predeterminada
                      </GSText>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteAddress(address.id)}
                  >
                    <Ionicons name="trash" size={16} color={theme.colors.error} />
                    <GSText style={[styles.actionText, styles.deleteText]}>Eliminar</GSText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <GSButton
        title="Agregar Nueva Dirección"
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
                {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
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
                  label="Nombre Completo"
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  error={formErrors.fullName}
                  placeholder="Ej: Juan Pérez"
                />
              </View>

              <View style={styles.inputGroup}>
                <GSInput
                  label="Teléfono"
                  value={formData.phoneNumber}
                  onChangeText={(text) => {
                    const formatted = formatPhoneNumber(text);
                    setFormData({ ...formData, phoneNumber: formatted });
                  }}
                  error={formErrors.phoneNumber}
                  placeholder="Ej: 300 123 4567"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <GSInput
                  label="Dirección"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  error={formErrors.address}
                  placeholder="Ej: Carrera 15 #93-45, Apto 501"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.inputGroup}>
                <GSInput
                  label="Ciudad"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  error={formErrors.city}
                  placeholder="Ej: Bogotá"
                />
              </View>

              <View style={styles.inputGroup}>
                <GSText style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: theme.colors.text }}>
                  Departamento
                </GSText>
                <TouchableOpacity
                  style={styles.stateSelector}
                  onPress={() => setShowStateSelector(true)}
                >
                  <GSText style={styles.stateSelectorText}>
                    {formData.state || 'Seleccionar departamento'}
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
                  label="Código Postal"
                  value={formData.postalCode}
                  onChangeText={(text) => setFormData({ ...formData, postalCode: text.replace(/\D/g, '').slice(0, 6) })}
                  error={formErrors.postalCode}
                  placeholder="Ej: 110221"
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <GSButton
                title="Cancelar"
                variant="outline"
                onPress={() => {
                  setShowAddModal(false);
                  setEditingAddress(null);
                  resetForm();
                }}
                style={styles.cancelButton}
              />
              <GSButton
                title={editingAddress ? 'Actualizar' : 'Guardar'}
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
              <GSText style={styles.modalTitle}>Seleccionar Departamento</GSText>
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

      {loading && <LoadingOverlay />}
    </SafeAreaView>
  );
};