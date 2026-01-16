import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type StreamMethod = 'native' | 'obs';

interface StreamMethodSelectorProps {
  onSelect: (method: StreamMethod) => void;
  selectedMethod?: StreamMethod;
}

interface MethodOptionProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  features: string[];
  isSelected: boolean;
  isRecommended?: boolean;
  onPress: () => void;
}

function MethodOption({
  icon,
  title,
  description,
  features,
  isSelected,
  isRecommended,
  onPress,
}: MethodOptionProps) {
  return (
    <TouchableOpacity
      style={[
        styles.optionCard,
        isSelected && styles.optionCardSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Recomendado</Text>
        </View>
      )}

      <View style={styles.optionHeader}>
        <View style={[
          styles.iconContainer,
          isSelected && styles.iconContainerSelected,
        ]}>
          <MaterialIcons
            name={icon}
            size={32}
            color={isSelected ? 'white' : '#8b5cf6'}
          />
        </View>

        {isSelected && (
          <View style={styles.checkmark}>
            <MaterialIcons name="check-circle" size={24} color="#10b981" />
          </View>
        )}
      </View>

      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
        {title}
      </Text>
      <Text style={styles.optionDescription}>{description}</Text>

      <View style={styles.featuresList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <MaterialIcons name="check" size={16} color="#10b981" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

export function StreamMethodSelector({ onSelect, selectedMethod }: StreamMethodSelectorProps) {
  const { t } = useTranslation('translation');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="live-tv" size={40} color="#8b5cf6" />
        <Text style={styles.title}>{t('live.selectStreamMethod')}</Text>
        <Text style={styles.subtitle}>{t('live.selectStreamMethodDescription')}</Text>
      </View>

      <View style={styles.optionsContainer}>
        <MethodOption
          icon="smartphone"
          title={t('live.streamFromPhone')}
          description={t('live.streamFromPhoneDescription')}
          features={[
            t('live.featureQuickSetup'),
            t('live.featureNoExtraEquipment'),
            t('live.featureFrontBackCamera'),
            t('live.featureBuiltInControls'),
          ]}
          isSelected={selectedMethod === 'native'}
          isRecommended={true}
          onPress={() => onSelect('native')}
        />

        <MethodOption
          icon="computer"
          title={t('live.streamWithOBS')}
          description={t('live.streamWithOBSDescription')}
          features={[
            t('live.featureProfessionalQuality'),
            t('live.featureScreenShare'),
            t('live.featureMultipleSources'),
            t('live.featureAdvancedSettings'),
          ]}
          isSelected={selectedMethod === 'obs'}
          onPress={() => onSelect('obs')}
        />
      </View>

      <View style={styles.helpContainer}>
        <MaterialIcons name="help-outline" size={20} color="#6b7280" />
        <Text style={styles.helpText}>{t('live.notSureWhichMethod')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#faf5ff',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSelected: {
    backgroundColor: '#8b5cf6',
  },
  checkmark: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#7c3aed',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
