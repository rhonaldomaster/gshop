import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

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
  const navigation = useNavigation();
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateDocumentNumber = (type: string, number: string): boolean => {
    if (!number.trim()) return false;

    switch (type) {
      case 'CC':
      case 'CE':
        // Colombian ID: 6-12 digits
        return /^\d{6,12}$/.test(number);
      case 'TI':
        // ID Card: 6-12 digits
        return /^\d{6,12}$/.test(number);
      case 'PA':
        // Passport: alphanumeric, 6-12 characters
        return /^[A-Z0-9]{6,12}$/i.test(number);
      default:
        return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Customer info validation
    if (!customerInfo.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    if (!customerInfo.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    if (!validateEmail(customerInfo.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!customerInfo.phone.trim() || !/^\+?[\d\s-()]{10,15}$/.test(customerInfo.phone)) {
      newErrors.phone = 'Teléfono inválido (min. 10 dígitos)';
    }

    if (!validateDocumentNumber(customerInfo.document.type, customerInfo.document.number)) {
      newErrors.documentNumber = `Número de ${documentTypes.find(d => d.value === customerInfo.document.type)?.label} inválido`;
    }

    // Shipping address validation
    if (!shippingAddress.address1.trim()) {
      newErrors.address1 = 'La dirección es obligatoria';
    }

    if (!shippingAddress.city.trim()) {
      newErrors.city = 'La ciudad es obligatoria';
    }

    if (!shippingAddress.postalCode.trim() || !/^\d{5,6}$/.test(shippingAddress.postalCode)) {
      newErrors.postalCode = 'Código postal inválido (5-6 dígitos)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToShipping = async () => {
    if (!validateForm()) {
      Alert.alert('Datos incompletos', 'Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      // Create temporary user and order
      const response = await fetch('/api/v1/orders/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerInfo,
          shippingAddress: {
            ...shippingAddress,
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            phone: customerInfo.phone,
          },
        }),
      });

      if (response.ok) {
        const { orderId } = await response.json();

        navigation.navigate('ShippingOptions' as never, {
          orderId,
          shippingAddress: {
            ...shippingAddress,
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            phone: customerInfo.phone,
          },
          packageDimensions: {
            length: 20,
            width: 15,
            height: 10,
            weight: 0.5, // Default weight in kg
          },
        } as never);
      } else {
        Alert.alert('Error', 'No se pudo procesar la información. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error creating guest order:', error);
      Alert.alert('Error', 'Error de conexión. Intenta nuevamente.');
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: any = 'default',
    errorKey?: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label} *</Text>
      <TextInput
        style={[
          styles.input,
          errors[errorKey || ''] && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
      {errors[errorKey || ''] && (
        <Text style={styles.errorText}>{errors[errorKey || '']}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comprar como Invitado</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Customer Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Personal</Text>

            {renderInput(
              'Nombres',
              customerInfo.firstName,
              (text) => setCustomerInfo({ ...customerInfo, firstName: text }),
              'Ingresa tus nombres',
              'default',
              'firstName'
            )}

            {renderInput(
              'Apellidos',
              customerInfo.lastName,
              (text) => setCustomerInfo({ ...customerInfo, lastName: text }),
              'Ingresa tus apellidos',
              'default',
              'lastName'
            )}

            {renderInput(
              'Email',
              customerInfo.email,
              (text) => setCustomerInfo({ ...customerInfo, email: text }),
              'ejemplo@correo.com',
              'email-address',
              'email'
            )}

            {renderInput(
              'Teléfono',
              customerInfo.phone,
              (text) => setCustomerInfo({ ...customerInfo, phone: text }),
              '+57 300 123 4567',
              'phone-pad',
              'phone'
            )}

            {/* Document Type and Number */}
            <View style={styles.documentContainer}>
              <View style={styles.documentTypeContainer}>
                <Text style={styles.inputLabel}>Tipo de Documento *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={customerInfo.document.type}
                    onValueChange={(value) =>
                      setCustomerInfo({
                        ...customerInfo,
                        document: { ...customerInfo.document, type: value },
                      })
                    }
                    style={styles.picker}
                  >
                    {documentTypes.map((doc) => (
                      <Picker.Item key={doc.value} label={doc.label} value={doc.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.documentNumberContainer}>
                {renderInput(
                  'Número de Documento',
                  customerInfo.document.number,
                  (text) => setCustomerInfo({
                    ...customerInfo,
                    document: { ...customerInfo.document, number: text },
                  }),
                  '12345678',
                  'numeric',
                  'documentNumber'
                )}
              </View>
            </View>
          </View>

          {/* Shipping Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dirección de Envío</Text>

            {renderInput(
              'Dirección Principal',
              shippingAddress.address1,
              (text) => setShippingAddress({ ...shippingAddress, address1: text }),
              'Calle 123 #45-67',
              'default',
              'address1'
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Complemento (Opcional)</Text>
              <TextInput
                style={styles.input}
                value={shippingAddress.address2}
                onChangeText={(text) => setShippingAddress({ ...shippingAddress, address2: text })}
                placeholder="Apartamento, oficina, etc."
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={styles.halfWidth}>
                {renderInput(
                  'Ciudad',
                  shippingAddress.city,
                  (text) => setShippingAddress({ ...shippingAddress, city: text }),
                  'Bogotá',
                  'default',
                  'city'
                )}
              </View>

              <View style={styles.halfWidth}>
                {renderInput(
                  'Código Postal',
                  shippingAddress.postalCode,
                  (text) => setShippingAddress({ ...shippingAddress, postalCode: text }),
                  '110111',
                  'numeric',
                  'postalCode'
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Departamento *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={shippingAddress.state}
                  onValueChange={(value) =>
                    setShippingAddress({ ...shippingAddress, state: value })
                  }
                  style={styles.picker}
                >
                  {colombianStates.map((state) => (
                    <Picker.Item key={state} label={state} value={state} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueToShipping}
          >
            <Text style={styles.continueButtonText}>Continuar al Envío</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
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
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFF',
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
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});