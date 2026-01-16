import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StreamMethodSelector, StreamMethod } from '../../components/live/StreamMethodSelector';

interface GoLiveScreenProps {
  route: {
    params: {
      streamId: string;
      hostType: 'seller' | 'affiliate';
    };
  };
  navigation: any;
}

export default function GoLiveScreen({ route, navigation }: GoLiveScreenProps) {
  const { t } = useTranslation('translation');
  const { streamId, hostType } = route.params;
  const [selectedMethod, setSelectedMethod] = useState<StreamMethod | undefined>(undefined);

  const handleMethodSelect = (method: StreamMethod) => {
    setSelectedMethod(method);
  };

  const handleContinue = () => {
    if (selectedMethod === 'native') {
      navigation.navigate('NativeBroadcast', { streamId, hostType });
    } else if (selectedMethod === 'obs') {
      navigation.navigate('OBSSetup', { streamId, hostType });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('live.goLive')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Method Selector */}
      <StreamMethodSelector
        onSelect={handleMethodSelect}
        selectedMethod={selectedMethod}
      />

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedMethod && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedMethod}
        >
          <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
          <MaterialIcons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
