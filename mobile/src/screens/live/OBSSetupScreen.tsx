import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { liveService, OBSSetupInfo } from '../../services/live.service';

interface OBSSetupScreenProps {
  route: {
    params: {
      streamId: string;
      hostType: 'seller' | 'affiliate';
    };
  };
  navigation: any;
}

export default function OBSSetupScreen({ route, navigation }: OBSSetupScreenProps) {
  const { t } = useTranslation('translation');
  const { streamId, hostType } = route.params;

  const [loading, setLoading] = useState(true);
  const [obsInfo, setObsInfo] = useState<OBSSetupInfo | null>(null);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchOBSInfo();
  }, []);

  const fetchOBSInfo = async () => {
    try {
      setLoading(true);
      const info = hostType === 'seller'
        ? await liveService.getOBSSetupInfo(streamId)
        : await liveService.getAffiliateOBSSetupInfo(streamId);
      setObsInfo(info);
    } catch (error) {
      console.error('Failed to fetch OBS info:', error);
      Alert.alert(t('common.error'), t('live.failedToFetchOBSInfo'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const shareCredentials = async () => {
    if (!obsInfo) return;

    const message = `${t('live.obsCredentialsShare')}

${t('live.rtmpUrl')}: ${obsInfo.rtmpUrl}
${t('live.streamKey')}: ${obsInfo.streamKey}

${t('live.recommendedSettingsShare')}:
- ${t('live.resolution')}: ${obsInfo.recommendedSettings.resolution}
- ${t('live.bitrate')}: ${obsInfo.recommendedSettings.bitrate}
- Keyframe: ${obsInfo.recommendedSettings.keyframeInterval}s`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const regenerateStreamKey = async () => {
    Alert.alert(
      t('live.regenerateKeyTitle'),
      t('live.regenerateKeyWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('live.regenerate'),
          style: 'destructive',
          onPress: async () => {
            try {
              setRegenerating(true);
              const newKey = hostType === 'seller'
                ? await liveService.regenerateStreamKey(streamId)
                : await liveService.regenerateAffiliateStreamKey(streamId);
              setObsInfo(prev => prev ? { ...prev, streamKey: newKey.streamKey } : null);
              Alert.alert(t('common.success'), t('live.keyRegenerated'));
            } catch (error) {
              console.error('Error regenerating key:', error);
              Alert.alert(t('common.error'), t('live.failedToRegenerateKey'));
            } finally {
              setRegenerating(false);
            }
          },
        },
      ]
    );
  };

  const openOBSDownload = () => {
    Linking.openURL('https://obsproject.com/download');
  };

  const openStreamlabs = () => {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/app/streamlabs-live-streaming/id1294578643'
      : 'https://play.google.com/store/apps/details?id=com.streamlabs';
    Linking.openURL(url);
  };

  const getQRData = useCallback(() => {
    if (!obsInfo) return '';
    return JSON.stringify({
      rtmpUrl: obsInfo.rtmpUrl,
      streamKey: obsInfo.streamKey,
    });
  }, [obsInfo]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{t('live.loadingOBSInfo')}</Text>
      </SafeAreaView>
    );
  }

  if (!obsInfo) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{t('live.failedToFetchOBSInfo')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchOBSInfo}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('live.obsSetup')}</Text>
          <TouchableOpacity style={styles.shareButton} onPress={shareCredentials}>
            <MaterialIcons name="share" size={24} color="#8b5cf6" />
          </TouchableOpacity>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>{t('live.scanFromPC')}</Text>
          <Text style={styles.sectionSubtitle}>{t('live.scanQRDescription')}</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={getQRData()}
              size={180}
              color="#111827"
              backgroundColor="white"
            />
          </View>
        </View>

        {/* Credentials Section */}
        <View style={styles.credentialsSection}>
          <Text style={styles.sectionTitle}>{t('live.streamCredentials')}</Text>

          {/* RTMP URL */}
          <View style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <MaterialIcons name="link" size={20} color="#6b7280" />
              <Text style={styles.credentialLabel}>{t('live.rtmpUrl')}</Text>
            </View>
            <View style={styles.credentialValue}>
              <Text style={styles.credentialText} numberOfLines={2}>
                {obsInfo.rtmpUrl}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(obsInfo.rtmpUrl, 'rtmpUrl')}
              >
                <MaterialIcons
                  name={copiedField === 'rtmpUrl' ? 'check' : 'content-copy'}
                  size={20}
                  color={copiedField === 'rtmpUrl' ? '#10b981' : '#8b5cf6'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stream Key */}
          <View style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <MaterialIcons name="vpn-key" size={20} color="#6b7280" />
              <Text style={styles.credentialLabel}>{t('live.streamKey')}</Text>
              <TouchableOpacity
                style={styles.toggleVisibility}
                onPress={() => setShowStreamKey(!showStreamKey)}
              >
                <MaterialIcons
                  name={showStreamKey ? 'visibility-off' : 'visibility'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.credentialValue}>
              <Text style={styles.credentialText} numberOfLines={1}>
                {showStreamKey ? obsInfo.streamKey : '••••••••••••••••••••'}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => copyToClipboard(obsInfo.streamKey, 'streamKey')}
              >
                <MaterialIcons
                  name={copiedField === 'streamKey' ? 'check' : 'content-copy'}
                  size={20}
                  color={copiedField === 'streamKey' ? '#10b981' : '#8b5cf6'}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={regenerateStreamKey}
              disabled={regenerating}
            >
              {regenerating ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <>
                  <MaterialIcons name="refresh" size={16} color="#ef4444" />
                  <Text style={styles.regenerateText}>{t('live.regenerateKey')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Recommended Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{t('live.recommendedSettings')}</Text>

          <View style={styles.settingsGrid}>
            <View style={styles.settingItem}>
              <MaterialIcons name="aspect-ratio" size={24} color="#8b5cf6" />
              <Text style={styles.settingLabel}>{t('live.resolution')}</Text>
              <Text style={styles.settingValue}>{obsInfo.recommendedSettings.resolution}</Text>
            </View>

            <View style={styles.settingItem}>
              <MaterialIcons name="speed" size={24} color="#8b5cf6" />
              <Text style={styles.settingLabel}>{t('live.bitrate')}</Text>
              <Text style={styles.settingValue}>{obsInfo.recommendedSettings.bitrate}</Text>
            </View>

            <View style={styles.settingItem}>
              <MaterialIcons name="timer" size={24} color="#8b5cf6" />
              <Text style={styles.settingLabel}>Keyframe</Text>
              <Text style={styles.settingValue}>{obsInfo.recommendedSettings.keyframeInterval}s</Text>
            </View>

            <View style={styles.settingItem}>
              <MaterialIcons name="movie" size={24} color="#8b5cf6" />
              <Text style={styles.settingLabel}>Codec</Text>
              <Text style={styles.settingValue}>{obsInfo.recommendedSettings.encoder}</Text>
            </View>
          </View>
        </View>

        {/* Setup Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>{t('live.howToSetupOBS')}</Text>

          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>1</Text>
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>{t('live.obsStep1Title')}</Text>
                <Text style={styles.instructionText}>{t('live.obsStep1Description')}</Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>2</Text>
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>{t('live.obsStep2Title')}</Text>
                <Text style={styles.instructionText}>{t('live.obsStep2Description')}</Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>3</Text>
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>{t('live.obsStep3Title')}</Text>
                <Text style={styles.instructionText}>{t('live.obsStep3Description')}</Text>
              </View>
            </View>

            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>4</Text>
              </View>
              <View style={styles.instructionContent}>
                <Text style={styles.instructionTitle}>{t('live.obsStep4Title')}</Text>
                <Text style={styles.instructionText}>{t('live.obsStep4Description')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Download Links */}
        <View style={styles.downloadSection}>
          <Text style={styles.sectionTitle}>{t('live.downloadSoftware')}</Text>

          <TouchableOpacity style={styles.downloadCard} onPress={openOBSDownload}>
            <View style={styles.downloadIcon}>
              <MaterialIcons name="computer" size={32} color="#8b5cf6" />
            </View>
            <View style={styles.downloadInfo}>
              <Text style={styles.downloadTitle}>OBS Studio</Text>
              <Text style={styles.downloadDescription}>{t('live.obsDescription')}</Text>
            </View>
            <MaterialIcons name="open-in-new" size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.downloadCard} onPress={openStreamlabs}>
            <View style={styles.downloadIcon}>
              <MaterialIcons name="smartphone" size={32} color="#10b981" />
            </View>
            <View style={styles.downloadInfo}>
              <Text style={styles.downloadTitle}>Streamlabs Mobile</Text>
              <Text style={styles.downloadDescription}>{t('live.streamlabsDescription')}</Text>
            </View>
            <MaterialIcons name="open-in-new" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Connection Status */}
        <View style={styles.statusSection}>
          <View style={[styles.statusIndicator, obsInfo.isConnected ? styles.statusConnected : styles.statusDisconnected]}>
            <MaterialIcons
              name={obsInfo.isConnected ? 'check-circle' : 'radio-button-unchecked'}
              size={20}
              color={obsInfo.isConnected ? '#10b981' : '#6b7280'}
            />
            <Text style={[styles.statusText, obsInfo.isConnected && styles.statusTextConnected]}>
              {obsInfo.isConnected ? t('live.streamConnected') : t('live.waitingForConnection')}
            </Text>
          </View>
        </View>

        {/* Start Streaming Button */}
        <TouchableOpacity
          style={[styles.startButton, !obsInfo.isConnected && styles.startButtonDisabled]}
          onPress={() => navigation.navigate('NativeBroadcast', { streamId, hostType, useOBS: true })}
          disabled={!obsInfo.isConnected}
        >
          <MaterialIcons name="live-tv" size={24} color="white" />
          <Text style={styles.startButtonText}>{t('live.goLive')}</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
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
  shareButton: {
    padding: 8,
  },
  qrSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  credentialsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  credentialCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  credentialLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  toggleVisibility: {
    padding: 4,
  },
  credentialValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  credentialText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    padding: 8,
    marginLeft: 8,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    padding: 8,
  },
  regenerateText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  settingsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  settingItem: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  instructionsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  instructionsList: {
    marginTop: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  downloadSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  downloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  downloadIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  downloadInfo: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  downloadDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  statusConnected: {
    backgroundColor: '#d1fae5',
  },
  statusDisconnected: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusTextConnected: {
    color: '#10b981',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ef4444',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 32,
  },
});
