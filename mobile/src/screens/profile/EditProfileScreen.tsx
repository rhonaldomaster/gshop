import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';
import { authService } from '../../services/auth.service';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar || null);

  // Form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = t('profile.firstNameRequired');
    }

    if (!lastName.trim()) {
      newErrors.lastName = t('profile.lastNameRequired');
    }

    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (phone && !/^\+?[\d\s-()]+$/.test(phone)) {
      newErrors.phone = t('addresses.errors.phoneInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          t('profile.permissionRequired'),
          t('profile.cameraRollPermission')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert(t('common.error'), t('profile.failedToPickImage'));
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status} = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(t('profile.permissionRequired'), t('profile.cameraPermission'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert(t('common.error'), t('profile.failedToTakePhoto'));
    }
  };

  const showAvatarOptions = () => {
    Alert.alert(t('profile.changeAvatar'), t('profile.chooseOption'), [
      {
        text: t('profile.takePhoto'),
        onPress: handleTakePhoto,
      },
      {
        text: t('profile.chooseFromLibrary'),
        onPress: handlePickImage,
      },
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
    ]);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert(t('profile.validationError'), t('profile.fixErrorsBeforeSaving'));
      return;
    }

    try {
      setLoading(true);

      let avatarUrl = avatarUri;

      // Check if avatar is a local file URI that needs to be uploaded
      if (avatarUri && avatarUri.startsWith('file://')) {
        try {
          // Upload the image first and get the URL back
          avatarUrl = await authService.uploadAvatar(avatarUri);
        } catch (uploadError) {
          console.error('Failed to upload avatar:', uploadError);
          Alert.alert(
            t('common.error'),
            t('profile.failedToUploadImage') || 'Failed to upload avatar image'
          );
          return;
        }
      }

      // Update profile via context (calls authService.updateProfile internally)
      await updateProfile({
        firstName,
        lastName,
        email,
        phone,
        bio,
        avatar: avatarUrl || undefined,
      });

      Alert.alert(t('common.success'), t('profile.profileUpdatedSuccessfully'), [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert(t('common.error'), t('profile.failedToUpdateProfile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={showAvatarOptions} activeOpacity={0.7}>
              <View style={styles.avatarContainer}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                    <GSText variant="h1" color="white">
                      {firstName.charAt(0).toUpperCase() || 'U'}
                    </GSText>
                  </View>
                )}

                <View style={[styles.avatarEditBadge, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="camera" size={20} color="white" />
                </View>
              </View>
            </TouchableOpacity>

            <GSText variant="body" color="textSecondary" style={styles.avatarHint}>
              {t('profile.tapToChangePhoto')}
            </GSText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.formGroup}>
              <GSText variant="body" weight="semiBold" style={styles.label}>
                {t('auth.firstName')} *
              </GSText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: errors.firstName ? theme.colors.error : '#E5E7EB',
                  },
                ]}
                placeholder={t('profile.firstNamePlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errors.firstName) {
                    setErrors({ ...errors, firstName: '' });
                  }
                }}
              />
              {errors.firstName && (
                <GSText variant="caption" color="error" style={styles.errorText}>
                  {errors.firstName}
                </GSText>
              )}
            </View>

            {/* Last Name */}
            <View style={styles.formGroup}>
              <GSText variant="body" weight="semiBold" style={styles.label}>
                {t('auth.lastName')} *
              </GSText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: errors.lastName ? theme.colors.error : '#E5E7EB',
                  },
                ]}
                placeholder={t('profile.lastNamePlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (errors.lastName) {
                    setErrors({ ...errors, lastName: '' });
                  }
                }}
              />
              {errors.lastName && (
                <GSText variant="caption" color="error" style={styles.errorText}>
                  {errors.lastName}
                </GSText>
              )}
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <GSText variant="body" weight="semiBold" style={styles.label}>
                  {t('auth.email')} *
                </GSText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: errors.email ? theme.colors.error : '#E5E7EB',
                  },
                ]}
                placeholder={t('profile.emailPlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({ ...errors, email: '' });
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && (
                <GSText variant="caption" color="error" style={styles.errorText}>
                  {errors.email}
                </GSText>
              )}
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <GSText variant="body" weight="semiBold" style={styles.label}>
                {t('profile.phoneOptional')}
              </GSText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: errors.phone ? theme.colors.error : '#E5E7EB',
                  },
                ]}
                placeholder={t('profile.phonePlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (errors.phone) {
                    setErrors({ ...errors, phone: '' });
                  }
                }}
                keyboardType="phone-pad"
              />
              {errors.phone && (
                <GSText variant="caption" color="error" style={styles.errorText}>
                  {errors.phone}
                </GSText>
              )}
            </View>

            {/* Bio */}
            <View style={styles.formGroup}>
              <GSText variant="body" weight="semiBold" style={styles.label}>
                {t('profile.bioOptional')}
              </GSText>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: '#E5E7EB',
                  },
                ]}
                placeholder={t('profile.bioPlaceholder')}
                placeholderTextColor={theme.colors.textSecondary}
                value={bio}
                onChangeText={setBio}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: '#E5E7EB' }]}>
          <GSButton
            title={t('profile.saveChanges')}
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
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
  scrollContent: {
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarHint: {
    marginTop: 12,
  },
  form: {
    paddingHorizontal: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
  },
  errorText: {
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  saveButton: {
    width: '100%',
  },
});
