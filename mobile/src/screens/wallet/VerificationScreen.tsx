import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import {
  verificationService,
  VerificationResponse,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  SOURCE_OF_FUNDS_OPTIONS,
  MONTHLY_INCOME_OPTIONS,
} from '../../services/verification.service';

type VerificationStep = 'status' | 'level1' | 'level2' | 'success';

// Document type options for picker
const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'CC', label: 'Cedula de Ciudadania' },
  { value: 'CE', label: 'Cedula de Extranjeria' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
];

export default function VerificationScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<VerificationStep>('status');
  const [verification, setVerification] = useState<VerificationResponse | null>(null);

  // Level 1 form state
  const [fullLegalName, setFullLegalName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentFrontUri, setDocumentFrontUri] = useState<string | null>(null);
  const [documentBackUri, setDocumentBackUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  // Level 2 form state
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  // Upload progress
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  // Uploaded URLs
  const [documentFrontUrl, setDocumentFrontUrl] = useState<string | null>(null);
  const [documentBackUrl, setDocumentBackUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  // Load verification status
  useEffect(() => {
    loadVerification();
  }, []);

  const loadVerification = async () => {
    try {
      setLoading(true);
      const data = await verificationService.getMyVerification();
      setVerification(data);

      // Pre-fill form if there's existing data
      if (data) {
        if (data.fullLegalName) setFullLegalName(data.fullLegalName);
        if (data.documentType) setDocumentType(data.documentType);
        if (data.documentNumber) setDocumentNumber(data.documentNumber);
        if (data.documentFrontUrl) {
          setDocumentFrontUrl(data.documentFrontUrl);
          setDocumentFrontUri(data.documentFrontUrl);
        }
        if (data.documentBackUrl) {
          setDocumentBackUrl(data.documentBackUrl);
          setDocumentBackUri(data.documentBackUrl);
        }
        if (data.selfieUrl) {
          setSelfieUrl(data.selfieUrl);
          setSelfieUri(data.selfieUrl);
        }
        if (data.address) setAddress(data.address);
        if (data.city) setCity(data.city);
        if (data.state) setState(data.state);
        if (data.postalCode) setPostalCode(data.postalCode);
        if (data.sourceOfFunds) setSourceOfFunds(data.sourceOfFunds);
        if (data.occupation) setOccupation(data.occupation);
        if (data.monthlyIncome) setMonthlyIncome(data.monthlyIncome);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  // Pick image from library or camera
  const pickImage = async (
    type: 'front' | 'back' | 'selfie',
    useCamera: boolean = false
  ) => {
    try {
      let result;

      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('verification.permissionRequired'),
            t('verification.cameraPermission')
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: type === 'selfie' ? [1, 1] : [4, 3],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('verification.permissionRequired'),
            t('verification.libraryPermission')
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: type === 'selfie' ? [1, 1] : [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;

        // Set local URI for preview
        switch (type) {
          case 'front':
            setDocumentFrontUri(uri);
            break;
          case 'back':
            setDocumentBackUri(uri);
            break;
          case 'selfie':
            setSelfieUri(uri);
            break;
        }

        // Upload to server
        await uploadImage(type, uri);
      }
    } catch (error: any) {
      console.error('Failed to pick image:', error);
      Alert.alert(t('common.error'), t('verification.failedToPickImage'));
    }
  };

  // Upload image to server
  const uploadImage = async (type: 'front' | 'back' | 'selfie', uri: string) => {
    try {
      switch (type) {
        case 'front':
          setUploadingFront(true);
          break;
        case 'back':
          setUploadingBack(true);
          break;
        case 'selfie':
          setUploadingSelfie(true);
          break;
      }

      const url = await verificationService.uploadDocument(uri);

      switch (type) {
        case 'front':
          setDocumentFrontUrl(url);
          break;
        case 'back':
          setDocumentBackUrl(url);
          break;
        case 'selfie':
          setSelfieUrl(url);
          break;
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
      // Clear the preview on failure
      switch (type) {
        case 'front':
          setDocumentFrontUri(null);
          break;
        case 'back':
          setDocumentBackUri(null);
          break;
        case 'selfie':
          setSelfieUri(null);
          break;
      }
    } finally {
      switch (type) {
        case 'front':
          setUploadingFront(false);
          break;
        case 'back':
          setUploadingBack(false);
          break;
        case 'selfie':
          setUploadingSelfie(false);
          break;
      }
    }
  };

  // Show image picker options
  const showImageOptions = (type: 'front' | 'back' | 'selfie') => {
    const titles: Record<string, string> = {
      front: t('verification.documentFront'),
      back: t('verification.documentBack'),
      selfie: t('verification.selfie'),
    };

    Alert.alert(titles[type], t('verification.chooseOption'), [
      {
        text: type === 'selfie' ? t('verification.takeSelfie') : t('verification.takePhoto'),
        onPress: () => pickImage(type, true),
      },
      {
        text: t('verification.chooseFromLibrary'),
        onPress: () => pickImage(type, false),
      },
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
    ]);
  };

  // Submit Level 1 verification
  const handleSubmitLevel1 = async () => {
    // Validate
    if (!fullLegalName.trim()) {
      Alert.alert(t('common.error'), t('verification.nameRequired'));
      return;
    }
    if (!documentNumber.trim()) {
      Alert.alert(t('common.error'), t('verification.documentNumberRequired'));
      return;
    }
    if (!documentFrontUrl) {
      Alert.alert(t('common.error'), t('verification.documentFrontRequired'));
      return;
    }
    if (!selfieUrl) {
      Alert.alert(t('common.error'), t('verification.selfieRequired'));
      return;
    }

    try {
      setSubmitting(true);
      const result = await verificationService.submitLevel1({
        fullLegalName: fullLegalName.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        documentFrontUrl,
        documentBackUrl: documentBackUrl || undefined,
        selfieUrl,
      });

      setVerification(result.verification);
      setCurrentStep('success');
      Alert.alert(t('common.success'), result.message);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Level 2 verification
  const handleSubmitLevel2 = async () => {
    // Validate
    if (!address.trim()) {
      Alert.alert(t('common.error'), t('verification.addressRequired'));
      return;
    }
    if (!city.trim()) {
      Alert.alert(t('common.error'), t('verification.cityRequired'));
      return;
    }
    if (!state.trim()) {
      Alert.alert(t('common.error'), t('verification.stateRequired'));
      return;
    }
    if (!sourceOfFunds) {
      Alert.alert(t('common.error'), t('verification.sourceOfFundsRequired'));
      return;
    }

    try {
      setSubmitting(true);
      const result = await verificationService.submitLevel2({
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim() || undefined,
        country: 'Colombia',
        sourceOfFunds,
        occupation: occupation.trim() || undefined,
        monthlyIncome: monthlyIncome || undefined,
      });

      setVerification(result.verification);
      setCurrentStep('success');
      Alert.alert(t('common.success'), result.message);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Render document type selector
  const renderDocumentTypeSelector = () => (
    <View style={styles.formGroup}>
      <GSText variant="body" weight="semiBold" style={styles.label}>
        {t('verification.documentType')}
      </GSText>
      <View style={styles.documentTypeContainer}>
        {DOCUMENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.documentTypeOption,
              {
                backgroundColor:
                  documentType === type.value
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderColor:
                  documentType === type.value
                    ? theme.colors.primary
                    : theme.colors.gray300,
              },
            ]}
            onPress={() => setDocumentType(type.value)}
          >
            <GSText
              variant="caption"
              weight={documentType === type.value ? 'bold' : 'regular'}
              color={documentType === type.value ? 'white' : 'text'}
            >
              {type.value}
            </GSText>
          </TouchableOpacity>
        ))}
      </View>
      <GSText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
        {DOCUMENT_TYPE_LABELS[documentType]}
      </GSText>
    </View>
  );

  // Render image upload box
  const renderImageUpload = (
    type: 'front' | 'back' | 'selfie',
    uri: string | null,
    uploading: boolean,
    label: string
  ) => (
    <View style={styles.formGroup}>
      <GSText variant="body" weight="semiBold" style={styles.label}>
        {label} {type !== 'back' && '*'}
      </GSText>
      <TouchableOpacity
        style={[
          styles.imageUploadBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: uri ? theme.colors.primary : theme.colors.gray300,
          },
        ]}
        onPress={() => showImageOptions(type)}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : uri ? (
          <Image source={{ uri }} style={styles.uploadedImage} />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Ionicons
              name={type === 'selfie' ? 'person' : 'document'}
              size={40}
              color={theme.colors.textSecondary}
            />
            <GSText variant="caption" color="textSecondary" style={{ marginTop: 8 }}>
              {t('verification.tapToUpload')}
            </GSText>
          </View>
        )}
        {uri && !uploading && (
          <View style={[styles.uploadedBadge, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render source of funds selector
  const renderSourceOfFundsSelector = () => (
    <View style={styles.formGroup}>
      <GSText variant="body" weight="semiBold" style={styles.label}>
        {t('verification.sourceOfFunds')} *
      </GSText>
      <View style={styles.optionsGrid}>
        {SOURCE_OF_FUNDS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              {
                backgroundColor:
                  sourceOfFunds === option.value
                    ? theme.colors.primary
                    : theme.colors.surface,
                borderColor:
                  sourceOfFunds === option.value
                    ? theme.colors.primary
                    : theme.colors.gray300,
              },
            ]}
            onPress={() => setSourceOfFunds(option.value)}
          >
            <GSText
              variant="caption"
              weight={sourceOfFunds === option.value ? 'bold' : 'regular'}
              color={sourceOfFunds === option.value ? 'white' : 'text'}
            >
              {option.label}
            </GSText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render status view
  const renderStatusView = () => {
    const statusInfo = verification
      ? verificationService.getStatusDisplayInfo(verification.verificationStatus)
      : null;

    const currentLevelLimits = verificationService.getLevelLimits(
      verification?.level || 'none'
    );
    const nextLevel = verification?.level === 'none' || !verification ? 'level_1' : 'level_2';
    const nextLevelLimits = verificationService.getLevelLimits(nextLevel);

    const canSubmitLevel1 = verificationService.canSubmitLevel1(verification);
    const canSubmitLevel2 = verificationService.canSubmitLevel2(verification);
    const canUpdate = verificationService.canUpdateVerification(verification);

    return (
      <View style={styles.statusContainer}>
        {/* Current Status Card */}
        <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={statusInfo?.icon as any || 'shield-outline'}
              size={40}
              color={statusInfo?.color || theme.colors.textSecondary}
            />
            <View style={styles.statusInfo}>
              <GSText variant="h3" weight="bold">
                {verificationService.getLevelDisplayName(verification?.level || 'none')}
              </GSText>
              {statusInfo && (
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                  <GSText variant="caption" weight="semiBold" style={{ color: statusInfo.color }}>
                    {statusInfo.label}
                  </GSText>
                </View>
              )}
            </View>
          </View>

          {/* Rejection reason */}
          {verification?.rejectionReason && (
            <View style={[styles.rejectionBox, { backgroundColor: theme.colors.error + '10' }]}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <GSText variant="body" color="error" style={{ flex: 1, marginLeft: 8 }}>
                {verification.rejectionReason}
              </GSText>
            </View>
          )}

          {/* Current limits */}
          <View style={styles.limitsSection}>
            <GSText variant="body" weight="semiBold" style={{ marginBottom: 8 }}>
              {t('verification.currentLimits')}
            </GSText>
            <View style={styles.limitRow}>
              <GSText variant="body" color="textSecondary">{t('verification.dailyLimit')}</GSText>
              <GSText variant="body" weight="semiBold">{currentLevelLimits.dailyLimit}</GSText>
            </View>
            <View style={styles.limitRow}>
              <GSText variant="body" color="textSecondary">{t('verification.monthlyLimit')}</GSText>
              <GSText variant="body" weight="semiBold">{currentLevelLimits.monthlyLimit}</GSText>
            </View>
            <View style={styles.limitRow}>
              <GSText variant="body" color="textSecondary">{t('verification.maxPerTransaction')}</GSText>
              <GSText variant="body" weight="semiBold">{currentLevelLimits.maxPerTransaction}</GSText>
            </View>
          </View>
        </View>

        {/* Upgrade Card */}
        {(canSubmitLevel1 || canSubmitLevel2) && (
          <View style={[styles.upgradeCard, { backgroundColor: theme.colors.primary + '10' }]}>
            <View style={styles.upgradeHeader}>
              <Ionicons name="trending-up" size={24} color={theme.colors.primary} />
              <GSText variant="body" weight="bold" style={{ marginLeft: 8, color: theme.colors.primary }}>
                {canSubmitLevel1 ? t('verification.upgradeToLevel1') : t('verification.upgradeToLevel2')}
              </GSText>
            </View>

            <View style={styles.limitsSection}>
              <GSText variant="caption" color="textSecondary" style={{ marginBottom: 8 }}>
                {t('verification.newLimits')}
              </GSText>
              <View style={styles.limitRow}>
                <GSText variant="caption" color="textSecondary">{t('verification.dailyLimit')}</GSText>
                <GSText variant="caption" weight="semiBold" style={{ color: theme.colors.primary }}>
                  {nextLevelLimits.dailyLimit}
                </GSText>
              </View>
              <View style={styles.limitRow}>
                <GSText variant="caption" color="textSecondary">{t('verification.monthlyLimit')}</GSText>
                <GSText variant="caption" weight="semiBold" style={{ color: theme.colors.primary }}>
                  {nextLevelLimits.monthlyLimit}
                </GSText>
              </View>
            </View>

            <GSButton
              title={t('verification.startVerification')}
              onPress={() => setCurrentStep(canSubmitLevel1 ? 'level1' : 'level2')}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* Update button for rejected */}
        {canUpdate && (
          <GSButton
            title={t('verification.updateAndResubmit')}
            onPress={() => setCurrentStep(verification?.level === 'none' ? 'level1' : 'level2')}
            style={{ marginTop: 16 }}
          />
        )}

        {/* Pending message */}
        {(verification?.verificationStatus === 'pending' ||
          verification?.verificationStatus === 'under_review') && (
          <View style={[styles.pendingBox, { backgroundColor: theme.colors.warning + '10' }]}>
            <Ionicons name="time" size={24} color={theme.colors.warning} />
            <GSText variant="body" style={{ flex: 1, marginLeft: 12 }}>
              {t('verification.pendingMessage')}
            </GSText>
          </View>
        )}

        {/* Already max level */}
        {verification?.level === 'level_2' && verification?.verificationStatus === 'approved' && (
          <View style={[styles.successBox, { backgroundColor: theme.colors.success + '10' }]}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <GSText variant="body" style={{ flex: 1, marginLeft: 12 }}>
              {t('verification.maxLevelReached')}
            </GSText>
          </View>
        )}
      </View>
    );
  };

  // Render Level 1 form
  const renderLevel1Form = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Ionicons name="person-circle" size={40} color={theme.colors.primary} />
        <GSText variant="h3" weight="bold" style={{ marginTop: 12 }}>
          {t('verification.level1Title')}
        </GSText>
        <GSText variant="body" color="textSecondary" style={{ marginTop: 4, textAlign: 'center' }}>
          {t('verification.level1Description')}
        </GSText>
      </View>

      {/* Full Name */}
      <View style={styles.formGroup}>
        <GSText variant="body" weight="semiBold" style={styles.label}>
          {t('verification.fullLegalName')} *
        </GSText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.gray300,
            },
          ]}
          placeholder={t('verification.fullLegalNamePlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={fullLegalName}
          onChangeText={setFullLegalName}
          autoCapitalize="words"
        />
      </View>

      {/* Document Type */}
      {renderDocumentTypeSelector()}

      {/* Document Number */}
      <View style={styles.formGroup}>
        <GSText variant="body" weight="semiBold" style={styles.label}>
          {t('verification.documentNumber')} *
        </GSText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.gray300,
            },
          ]}
          placeholder={t('verification.documentNumberPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={documentNumber}
          onChangeText={setDocumentNumber}
          autoCapitalize="characters"
        />
      </View>

      {/* Document Front */}
      {renderImageUpload(
        'front',
        documentFrontUri,
        uploadingFront,
        t('verification.documentFront')
      )}

      {/* Document Back (optional for passports) */}
      {renderImageUpload(
        'back',
        documentBackUri,
        uploadingBack,
        t('verification.documentBack')
      )}

      {/* Selfie */}
      {renderImageUpload(
        'selfie',
        selfieUri,
        uploadingSelfie,
        t('verification.selfie')
      )}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
        <GSText variant="caption" color="textSecondary" style={{ flex: 1, marginLeft: 8 }}>
          {t('verification.selfieInstructions')}
        </GSText>
      </View>

      <GSButton
        title={t('verification.submitLevel1')}
        onPress={handleSubmitLevel1}
        loading={submitting}
        disabled={submitting || uploadingFront || uploadingBack || uploadingSelfie}
        style={{ marginTop: 24 }}
      />
    </View>
  );

  // Render Level 2 form
  const renderLevel2Form = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <Ionicons name="home" size={40} color={theme.colors.primary} />
        <GSText variant="h3" weight="bold" style={{ marginTop: 12 }}>
          {t('verification.level2Title')}
        </GSText>
        <GSText variant="body" color="textSecondary" style={{ marginTop: 4, textAlign: 'center' }}>
          {t('verification.level2Description')}
        </GSText>
      </View>

      {/* Address */}
      <View style={styles.formGroup}>
        <GSText variant="body" weight="semiBold" style={styles.label}>
          {t('verification.address')} *
        </GSText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.gray300,
            },
          ]}
          placeholder={t('verification.addressPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={address}
          onChangeText={setAddress}
        />
      </View>

      {/* City and State */}
      <View style={styles.rowInputs}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <GSText variant="body" weight="semiBold" style={styles.label}>
            {t('verification.city')} *
          </GSText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.gray300,
              },
            ]}
            placeholder={t('verification.cityPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={city}
            onChangeText={setCity}
          />
        </View>

        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <GSText variant="body" weight="semiBold" style={styles.label}>
            {t('verification.state')} *
          </GSText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderColor: theme.colors.gray300,
              },
            ]}
            placeholder={t('verification.statePlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={state}
            onChangeText={setState}
          />
        </View>
      </View>

      {/* Postal Code */}
      <View style={styles.formGroup}>
        <GSText variant="body" weight="semiBold" style={styles.label}>
          {t('verification.postalCode')}
        </GSText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.gray300,
            },
          ]}
          placeholder={t('verification.postalCodePlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={postalCode}
          onChangeText={setPostalCode}
          keyboardType="numeric"
        />
      </View>

      {/* Source of Funds */}
      {renderSourceOfFundsSelector()}

      {/* Occupation */}
      <View style={styles.formGroup}>
        <GSText variant="body" weight="semiBold" style={styles.label}>
          {t('verification.occupation')}
        </GSText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.gray300,
            },
          ]}
          placeholder={t('verification.occupationPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          value={occupation}
          onChangeText={setOccupation}
        />
      </View>

      {/* Monthly Income */}
      <View style={styles.formGroup}>
        <GSText variant="body" weight="semiBold" style={styles.label}>
          {t('verification.monthlyIncome')}
        </GSText>
        <View style={styles.optionsGrid}>
          {MONTHLY_INCOME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    monthlyIncome === option.value
                      ? theme.colors.primary
                      : theme.colors.surface,
                  borderColor:
                    monthlyIncome === option.value
                      ? theme.colors.primary
                      : theme.colors.gray300,
                },
              ]}
              onPress={() => setMonthlyIncome(option.value)}
            >
              <GSText
                variant="caption"
                weight={monthlyIncome === option.value ? 'bold' : 'regular'}
                color={monthlyIncome === option.value ? 'white' : 'text'}
              >
                {option.label}
              </GSText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <GSButton
        title={t('verification.submitLevel2')}
        onPress={handleSubmitLevel2}
        loading={submitting}
        disabled={submitting}
        style={{ marginTop: 24 }}
      />
    </View>
  );

  // Render success view
  const renderSuccessView = () => (
    <View style={styles.successContainer}>
      <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
        <Ionicons name="checkmark-circle" size={80} color={theme.colors.success} />
      </View>
      <GSText variant="h2" weight="bold" style={{ marginTop: 24, textAlign: 'center' }}>
        {t('verification.submittedTitle')}
      </GSText>
      <GSText variant="body" color="textSecondary" style={{ marginTop: 12, textAlign: 'center' }}>
        {t('verification.submittedMessage')}
      </GSText>

      <GSButton
        title={t('verification.backToWallet')}
        onPress={() => navigation.goBack()}
        style={{ marginTop: 32 }}
      />
    </View>
  );

  // Render content based on step
  const renderContent = () => {
    switch (currentStep) {
      case 'status':
        return renderStatusView();
      case 'level1':
        return renderLevel1Form();
      case 'level2':
        return renderLevel2Form();
      case 'success':
        return renderSuccessView();
      default:
        return null;
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (currentStep === 'status' || currentStep === 'success') {
      navigation.goBack();
    } else {
      setCurrentStep('status');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" color="textSecondary" style={{ marginTop: 16 }}>
            {t('common.loading')}
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <GSText variant="h3" weight="bold">
          {t('verification.title')}
        </GSText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flex: 1,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    marginLeft: 16,
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  limitsSection: {
    marginTop: 8,
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  upgradeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  formContainer: {
    flex: 1,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  documentTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  documentTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  imageUploadBox: {
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    marginTop: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
