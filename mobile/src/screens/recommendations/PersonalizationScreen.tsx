import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { recommendationsService, UserPreference } from '../../services/recommendations.service';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';

interface CategoryPreference {
  id: string;
  name: string;
  icon: string;
  description: string;
  strength: number;
  enabled: boolean;
}

interface RecommendationSettings {
  enablePersonalized: boolean;
  enableTrending: boolean;
  enableSimilarProducts: boolean;
  enableCrossSelling: boolean;
  enableNotifications: boolean;
  privacyMode: boolean;
}

export const PersonalizationScreen = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<CategoryPreference[]>([]);
  const [settings, setSettings] = useState<RecommendationSettings>({
    enablePersonalized: true,
    enableTrending: true,
    enableSimilarProducts: true,
    enableCrossSelling: false,
    enableNotifications: true,
    privacyMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default categories with icons
  const defaultCategories: Omit<CategoryPreference, 'strength' | 'enabled'>[] = [
    {
      id: 'electronics',
      name: 'Electronics',
      icon: '📱',
      description: 'Smartphones, laptops, gadgets, and tech accessories',
    },
    {
      id: 'fashion',
      name: 'Fashion',
      icon: '👕',
      description: 'Clothing, shoes, accessories, and style items',
    },
    {
      id: 'home',
      name: 'Home & Garden',
      icon: '🏠',
      description: 'Furniture, decor, kitchen items, and gardening supplies',
    },
    {
      id: 'sports',
      name: 'Sports & Fitness',
      icon: '⚽',
      description: 'Sporting goods, fitness equipment, and activewear',
    },
    {
      id: 'beauty',
      name: 'Beauty & Personal Care',
      icon: '💄',
      description: 'Cosmetics, skincare, haircare, and wellness products',
    },
    {
      id: 'books',
      name: 'Books & Media',
      icon: '📚',
      description: 'Books, e-books, audiobooks, and educational materials',
    },
    {
      id: 'toys',
      name: 'Toys & Games',
      icon: '🧸',
      description: 'Toys, board games, puzzles, and entertainment',
    },
    {
      id: 'automotive',
      name: 'Automotive',
      icon: '🚗',
      description: 'Car accessories, tools, and automotive supplies',
    },
    {
      id: 'food',
      name: 'Food & Beverages',
      icon: '🍕',
      description: 'Groceries, snacks, beverages, and specialty foods',
    },
    {
      id: 'health',
      name: 'Health & Wellness',
      icon: '💊',
      description: 'Supplements, medical supplies, and health products',
    },
  ];

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load user preferences from backend
      const userPreferences = await recommendationsService.getUserPreferences(user.id);

      // Merge with default categories
      const mergedPreferences = defaultCategories.map((category) => {
        const userPref = userPreferences.find((p: UserPreference) => p.category === category.id);
        return {
          ...category,
          strength: userPref?.strength || 0.5,
          enabled: userPref ? userPref.strength > 0 : false,
        };
      });

      setPreferences(mergedPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Initialize with defaults if API fails
      const defaultPrefs = defaultCategories.map(category => ({
        ...category,
        strength: 0.5,
        enabled: false,
      }));
      setPreferences(defaultPrefs);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updatePreference = useCallback(async (categoryId: string, strength: number, enabled: boolean) => {
    if (!user?.id) return;

    try {
      setSaving(true);

      // Update local state
      setPreferences(prev => prev.map(pref =>
        pref.id === categoryId
          ? { ...pref, strength: enabled ? strength : 0, enabled }
          : pref
      ));

      // Update backend
      await recommendationsService.updateUserPreference(
        user.id,
        categoryId,
        enabled ? strength : 0
      );
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update preference. Please try again.');

      // Revert local state on error
      await loadPreferences();
    } finally {
      setSaving(false);
    }
  }, [user?.id, loadPreferences]);

  const handleCategoryToggle = useCallback((categoryId: string, enabled: boolean) => {
    const preference = preferences.find(p => p.id === categoryId);
    if (preference) {
      updatePreference(categoryId, preference.strength, enabled);
    }
  }, [preferences, updatePreference]);

  const handleStrengthChange = useCallback((categoryId: string, strength: number) => {
    updatePreference(categoryId, strength, true);
  }, [updatePreference]);

  const handleSettingToggle = useCallback((setting: keyof RecommendationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));

    // Save to local storage or backend
    // For now, just updating local state
  }, []);

  const clearAllPreferences = useCallback(async () => {
    Alert.alert(
      'Clear All Preferences',
      'This will reset all your preferences. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);

              // Clear all preferences
              for (const pref of preferences) {
                await recommendationsService.updateUserPreference(user!.id, pref.id, 0);
              }

              // Reset local state
              setPreferences(prev => prev.map(pref => ({
                ...pref,
                strength: 0.5,
                enabled: false,
              })));

              Alert.alert('Success', 'All preferences have been cleared.');
            } catch (error) {
              console.error('Error clearing preferences:', error);
              Alert.alert('Error', 'Failed to clear preferences. Please try again.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }, [preferences, user]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Sign in Required"
          description="Please sign in to personalize your recommendations"
          icon="🔐"
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  const renderStrengthSlider = (preference: CategoryPreference) => {
    const strengthLevels = [
      { value: 0.2, label: 'Low', color: '#ffc107' },
      { value: 0.5, label: 'Medium', color: '#28a745' },
      { value: 0.8, label: 'High', color: '#007bff' },
      { value: 1.0, label: 'Max', color: '#dc3545' },
    ];

    return (
      <View style={styles.strengthContainer}>
        <Text style={styles.strengthLabel}>Interest Level:</Text>
        <View style={styles.strengthSlider}>
          {strengthLevels.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.strengthButton,
                {
                  backgroundColor: Math.abs(preference.strength - level.value) < 0.1
                    ? level.color
                    : '#f8f9fa',
                },
              ]}
              onPress={() => handleStrengthChange(preference.id, level.value)}
              disabled={!preference.enabled || saving}
            >
              <Text
                style={[
                  styles.strengthButtonText,
                  {
                    color: Math.abs(preference.strength - level.value) < 0.1
                      ? '#fff'
                      : '#666',
                  },
                ]}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderCategoryPreference = (preference: CategoryPreference) => (
    <View key={preference.id} style={styles.preferenceCard}>
      <View style={styles.preferenceHeader}>
        <View style={styles.preferenceInfo}>
          <Text style={styles.preferenceIcon}>{preference.icon}</Text>
          <View style={styles.preferenceText}>
            <Text style={styles.preferenceName}>{preference.name}</Text>
            <Text style={styles.preferenceDescription}>{preference.description}</Text>
          </View>
        </View>
        <Switch
          value={preference.enabled}
          onValueChange={(value) => handleCategoryToggle(preference.id, value)}
          disabled={saving}
          trackColor={{ false: '#e9ecef', true: '#007bff' }}
          thumbColor={preference.enabled ? '#fff' : '#adb5bd'}
        />
      </View>

      {preference.enabled && renderStrengthSlider(preference)}
    </View>
  );

  const renderSettingsSection = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>Recommendation Settings</Text>

      {Object.entries({
        enablePersonalized: 'Personalized Recommendations',
        enableTrending: 'Show Trending Products',
        enableSimilarProducts: 'Similar Product Suggestions',
        enableCrossSelling: 'Cross-selling Recommendations',
        enableNotifications: 'Recommendation Notifications',
        privacyMode: 'Privacy Mode (Anonymous)',
      }).map(([key, label]) => (
        <View key={key} style={styles.settingItem}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Switch
            value={settings[key as keyof RecommendationSettings]}
            onValueChange={(value) => handleSettingToggle(key as keyof RecommendationSettings, value)}
            trackColor={{ false: '#e9ecef', true: '#007bff' }}
            thumbColor={settings[key as keyof RecommendationSettings] ? '#fff' : '#adb5bd'}
          />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personalization</Text>
        <Text style={styles.headerSubtitle}>Customize your shopping experience</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.preferencesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category Preferences</Text>
            <Text style={styles.sectionSubtitle}>
              Choose categories you're interested in to get better recommendations
            </Text>
          </View>

          {preferences.map(renderCategoryPreference)}
        </View>

        {renderSettingsSection()}

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.clearButton, saving && styles.disabledButton]}
            onPress={clearAllPreferences}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#dc3545" size="small" />
            ) : (
              <Text style={styles.clearButtonText}>Clear All Preferences</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>
            💡 Your preferences help us show you products you'll love. The more you interact with products, the better our recommendations become!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  preferencesSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  preferenceCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  strengthContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  strengthSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  strengthButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  actionsSection: {
    padding: 20,
  },
  clearButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dc3545',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});