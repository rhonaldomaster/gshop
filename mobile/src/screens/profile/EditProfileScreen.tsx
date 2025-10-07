import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import GSText from '../../components/ui/GSText';
import GSButton from '../../components/ui/GSButton';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();
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
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (phone && !/^\+?[\d\s-()]+$/.test(phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera roll permissions to change your avatar.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status} = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera permissions to take a photo.');
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
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showAvatarOptions = () => {
    Alert.alert('Change Avatar', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: handleTakePhoto,
      },
      {
        text: 'Choose from Library',
        onPress: handlePickImage,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    try {
      setLoading(true);

      // TODO: Replace with actual API call
      // await authService.updateProfile({
      //   firstName,
      //   lastName,
      //   email,
      //   phone,
      //   bio,
      //   avatar: avatarUri,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update context
      await updateProfile({
        firstName,
        lastName,
        email,
        phone,
        bio,
        avatar: avatarUri || undefined,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
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
              Tap to change photo
            </GSText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* First Name */}
            <View style={styles.formGroup}>
              <GSText variant="body" weight="semibold" style={styles.label}>
                First Name *
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
                placeholder="John"
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
              <GSText variant="body" weight="semibold" style={styles.label}>
                Last Name *
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
                placeholder="Doe"
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
                <GSText variant="body" weight="semibold" style={styles.label}>
                  Email *
                </GSText>
                {user?.emailVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <GSText variant="caption" style={{ color: '#10B981', marginLeft: 4 }}>
                      Verified
                    </GSText>
                  </View>
                )}
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
                placeholder="john@example.com"
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
              <GSText variant="body" weight="semibold" style={styles.label}>
                Phone (optional)
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
                placeholder="+54 11 1234 5678"
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
              <GSText variant="body" weight="semibold" style={styles.label}>
                Bio (optional)
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
                placeholder="Tell us about yourself..."
                placeholderTextColor={theme.colors.textSecondary}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: '#E5E7EB' }]}>
          <GSButton
            title="Save Changes"
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
