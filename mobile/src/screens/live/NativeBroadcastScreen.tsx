import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  IVSBroadcastCameraView,
  BroadcastState,
  StateStatusUnion,
  type IIVSBroadcastCameraView,
  type TransmissionStatistics,
  type IBroadcastSessionError,
} from 'amazon-ivs-react-native-broadcast';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import io, { Socket } from 'socket.io-client';
import * as Haptics from 'expo-haptics';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { API_CONFIG } from '../../config/api.config';
import { liveService, NativeStreamCredentials, StreamProduct, StreamStats } from '../../services/live.service';
import { ProductOverlayTikTok } from '../../components/live/ProductOverlayTikTok';
import { PurchaseNotification, PurchaseCelebration, usePurchaseNotifications } from '../../components/live/PurchaseNotification';

interface Message {
  id: string;
  username: string;
  message: string;
  sentAt: string;
}

const { width, height } = Dimensions.get('window');

export default function NativeBroadcastScreen({ route, navigation }: any) {
  const { t } = useTranslation('translation');
  const { streamId, hostType = 'affiliate' } = route.params;

  // Broadcast ref
  const broadcastRef = useRef<IIVSBroadcastCameraView>(null);

  // Permissions
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Stream credentials
  const [credentials, setCredentials] = useState<NativeStreamCredentials | null>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  // Broadcast state
  const [broadcastState, setBroadcastState] = useState<StateStatusUnion>('DISCONNECTED');
  const [isBroadcastReady, setIsBroadcastReady] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);

  // Camera settings
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const [isMuted, setIsMuted] = useState(false);

  // Transmission stats
  const [transmissionStats, setTransmissionStats] = useState<TransmissionStatistics | null>(null);

  // Products
  const [products, setProducts] = useState<StreamProduct[]>([]);
  const [showProductsPanel, setShowProductsPanel] = useState(false);

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChatOverlay, setShowChatOverlay] = useState(true);

  // Analytics
  const [stats, setStats] = useState<StreamStats>({
    currentViewers: 0,
    peakViewers: 0,
    messagesCount: 0,
    productsClicked: 0,
    purchaseCount: 0,
    revenue: 0,
  });
  const [showAnalytics, setShowAnalytics] = useState(false);

  // TikTok Shop style states
  const [pinnedProductId, setPinnedProductId] = useState<string | null>(null);
  const [purchaseStats, setPurchaseStats] = useState<Record<string, number>>({});
  const [timerEndTime, setTimerEndTime] = useState<Date | null>(null);

  // Purchase notification hook
  const { triggerNotification, currentPurchase, dismissCelebration } = usePurchaseNotifications();

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  // Fetch credentials after permissions are granted
  useEffect(() => {
    if (hasPermissions) {
      fetchCredentials();
      fetchStreamProducts();
    }

    return () => {
      cleanup();
    };
  }, [hasPermissions]);

  const requestPermissions = async () => {
    try {
      // Request camera permission
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        setPermissionError(t('live.cameraPermissionRequired'));
        setHasPermissions(false);
        return;
      }

      // Request microphone permission
      const audioStatus = await Audio.requestPermissionsAsync();
      if (audioStatus.status !== 'granted') {
        setPermissionError(t('live.microphonePermissionRequired'));
        setHasPermissions(false);
        return;
      }

      setHasPermissions(true);
      setPermissionError(null);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setPermissionError(t('live.permissionError'));
      setHasPermissions(false);
    }
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
    }
  };

  const fetchCredentials = async () => {
    try {
      setLoadingCredentials(true);
      console.log('[NativeBroadcast] ========== FETCHING CREDENTIALS ==========');
      console.log('[NativeBroadcast] streamId:', streamId);
      console.log('[NativeBroadcast] hostType:', hostType);
      const creds = hostType === 'seller'
        ? await liveService.getNativeCredentials(streamId)
        : await liveService.getAffiliateNativeCredentials(streamId);
      console.log('[NativeBroadcast] ========== CREDENTIALS RECEIVED ==========');
      console.log('[NativeBroadcast] ingestEndpoint:', creds.ingestEndpoint);
      console.log('[NativeBroadcast] streamKey:', creds.streamKey?.substring(0, 20) + '...');
      console.log('[NativeBroadcast] channelArn:', creds.channelArn);
      console.log('[NativeBroadcast] playbackUrl:', creds.playbackUrl);
      setCredentials(creds);
    } catch (error: any) {
      console.error('[NativeBroadcast] ========== FAILED TO FETCH CREDENTIALS ==========');
      console.error('[NativeBroadcast] Error:', error?.message || error);
      Alert.alert(
        t('common.error'),
        t('live.failedToFetchCredentials'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } finally {
      console.log('[NativeBroadcast] Setting loadingCredentials to false');
      setLoadingCredentials(false);
    }
  };

  const fetchStreamProducts = async () => {
    try {
      const prods = await liveService.getStreamProducts(streamId);
      setProducts(prods);
    } catch (error) {
      console.error('Failed to fetch stream products:', error);
    }
  };

  const initializeSocket = useCallback(() => {
    const wsUrl = API_CONFIG.BASE_URL.replace('/api/v1', '');
    socketRef.current = io(`${wsUrl}/live`, {
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current?.emit('hostJoinStream', { streamId, hostId: route.params.hostId });
    });

    // Listen for recent messages when joining
    socketRef.current.on('recentMessages', (recentMessages: Message[]) => {
      setMessages(recentMessages);
    });

    socketRef.current.on('viewerCountUpdate', (data: { count: number }) => {
      setViewerCount(data.count);
      setStats(prev => ({
        ...prev,
        currentViewers: data.count,
        peakViewers: Math.max(prev.peakViewers, data.count),
      }));
    });

    socketRef.current.on('newMessage', (message: Message) => {
      setMessages(prev => [...prev.slice(-50), message]);
      setStats(prev => ({ ...prev, messagesCount: prev.messagesCount + 1 }));
    });

    socketRef.current.on('productClick', () => {
      setStats(prev => ({ ...prev, productsClicked: prev.productsClicked + 1 }));
    });

    socketRef.current.on('streamPurchase', (data: { amount: number }) => {
      setStats(prev => ({
        ...prev,
        purchaseCount: prev.purchaseCount + 1,
        revenue: prev.revenue + data.amount,
      }));
    });

    // TikTok Shop style events
    socketRef.current.on('productPinned', (data: { productId: string; timerEndTime?: string }) => {
      setPinnedProductId(data.productId);
      if (data.timerEndTime) {
        setTimerEndTime(new Date(data.timerEndTime));
      }
    });

    socketRef.current.on('productUnpinned', () => {
      setPinnedProductId(null);
      setTimerEndTime(null);
    });

    socketRef.current.on('newPurchase', (data: {
      productId: string;
      productName: string;
      buyerName: string;
      quantity: number;
      purchaseCount: number;
    }) => {
      // Update purchase stats
      setPurchaseStats(prev => ({
        ...prev,
        [data.productId]: data.purchaseCount,
      }));

      // Trigger notification
      triggerNotification({
        productName: data.productName,
        buyerName: data.buyerName,
        quantity: data.quantity || 1,
        timestamp: new Date(),
      });

      // Haptic feedback for host
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });

    socketRef.current.on('flashSaleStarted', (data: {
      productId: string;
      discountPercent: number;
      endTime: string;
    }) => {
      setPinnedProductId(data.productId);
      setTimerEndTime(new Date(data.endTime));
    });

    socketRef.current.on('flashSaleEnded', () => {
      setTimerEndTime(null);
    });
  }, [streamId, triggerNotification]);

  const startDurationTimer = () => {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
    }
    streamTimerRef.current = setInterval(() => {
      setStreamDuration(prev => prev + 1);
    }, 1000);
  };

  // Handle broadcast state changes
  const handleBroadcastStateChanged = (state: StateStatusUnion) => {
    console.log('[NativeBroadcast] handleBroadcastStateChanged called with:', state);
    setBroadcastState(state);

    if (state === 'CONNECTED') {
      setIsStreaming(true);
      startDurationTimer();
      initializeSocket();
      // Notify backend that stream started
      liveService.startStream(streamId).catch(console.error);
    } else if (state === 'DISCONNECTED' && isStreaming) {
      handleStreamEnded();
    }
  };

  // Handle broadcast ready state
  const handleIsBroadcastReady = (ready: boolean) => {
    console.log('[NativeBroadcast] handleIsBroadcastReady called with:', ready);
    setIsBroadcastReady(ready);
  };

  // Handle transmission statistics
  const handleTransmissionStatisticsChanged = (stats: TransmissionStatistics) => {
    setTransmissionStats(stats);
  };

  // Handle broadcast errors
  const handleBroadcastError = (error: IBroadcastSessionError) => {
    console.error('[NativeBroadcast] Broadcast error callback:', JSON.stringify(error, null, 2));
    const errorMessage = error?.detail || error?.type || 'Unknown broadcast error';
    const errorType = error?.type || '';

    // Ignore non-fatal state errors (like "already streaming")
    if (!error?.isFatal && (
      errorType === 'ERROR_INVALID_STATE' ||
      errorMessage.toLowerCase().includes('already streaming') ||
      errorMessage.toLowerCase().includes('initialization') ||
      errorMessage.toLowerCase().includes('network test')
    )) {
      console.log('[NativeBroadcast] Ignoring non-fatal error:', errorType);
      return;
    }

    // Show alert for fatal errors
    if (error?.isFatal) {
      Alert.alert(t('common.error'), errorMessage);
    }
  };

  // Start broadcasting
  const startBroadcast = async () => {
    console.log('[NativeBroadcast] startBroadcast called');
    console.log('[NativeBroadcast] isBroadcastReady:', isBroadcastReady);
    console.log('[NativeBroadcast] broadcastState:', broadcastState);
    console.log('[NativeBroadcast] isStreaming:', isStreaming);
    console.log('[NativeBroadcast] credentials:', credentials ? {
      ingestEndpoint: credentials.ingestEndpoint,
      streamKey: credentials.streamKey?.substring(0, 20) + '...',
      hasChannelArn: !!credentials.channelArn,
    } : null);
    console.log('[NativeBroadcast] broadcastRef.current:', !!broadcastRef.current);

    // If already streaming or connecting, don't try again
    if (isStreaming || broadcastState === 'CONNECTING' || broadcastState === 'CONNECTED') {
      console.log('[NativeBroadcast] Already streaming or connecting, skipping start');
      return;
    }

    if (!isBroadcastReady) {
      console.log('[NativeBroadcast] Broadcast not ready');
      Alert.alert(t('common.error'), t('live.broadcastNotReady'));
      return;
    }

    if (!credentials) {
      console.log('[NativeBroadcast] No credentials');
      Alert.alert(t('common.error'), t('live.failedToFetchCredentials'));
      return;
    }

    if (!credentials.ingestEndpoint || !credentials.streamKey) {
      console.log('[NativeBroadcast] Invalid credentials - missing ingestEndpoint or streamKey');
      Alert.alert(t('common.error'), 'Invalid streaming credentials');
      return;
    }

    if (!broadcastRef.current) {
      console.log('[NativeBroadcast] No broadcast ref');
      Alert.alert(t('common.error'), 'Broadcast view not initialized');
      return;
    }

    try {
      console.log('[NativeBroadcast] Calling broadcastRef.current.start()');
      // The SDK already has the credentials from the component props
      // Just call start() without parameters
      broadcastRef.current.start();
      console.log('[NativeBroadcast] start() called successfully');
    } catch (error: any) {
      console.error('[NativeBroadcast] Error starting broadcast:', error);
      console.error('[NativeBroadcast] Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        t('common.error'),
        error?.message || t('live.failedToStartStream')
      );
    }
  };

  // Stop broadcasting
  const stopBroadcast = () => {
    Alert.alert(
      t('live.endStream'),
      t('live.endStreamConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('live.endNow'),
          style: 'destructive',
          onPress: async () => {
            try {
              broadcastRef.current?.stop();
              await liveService.endStream(streamId);
              handleStreamEnded();
            } catch (error) {
              console.error('Error stopping broadcast:', error);
            }
          },
        },
      ]
    );
  };

  const handleStreamEnded = () => {
    setIsStreaming(false);
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
    }
    socketRef.current?.disconnect();
    navigation.replace('LiveStreamResults', {
      streamId,
      stats,
      duration: streamDuration,
    });
  };

  // Toggle camera position
  const toggleCamera = () => {
    setCameraPosition(prev => prev === 'back' ? 'front' : 'back');
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  // Toggle product highlight
  const toggleProductHighlight = async (productId: string) => {
    try {
      await liveService.toggleProductVisibility(streamId, productId);
      setProducts(prev =>
        prev.map(p =>
          p.product.id === productId
            ? { ...p, isHighlighted: !p.isHighlighted }
            : p
        )
      );
    } catch (error) {
      console.error('Error toggling product:', error);
    }
  };

  // Pin product (TikTok style)
  const handlePinProduct = useCallback((productId: string) => {
    if (!socketRef.current || !isStreaming) return;

    if (pinnedProductId === productId) {
      // Unpin if already pinned
      socketRef.current.emit('unpinProduct', { streamId });
      setPinnedProductId(null);
      setTimerEndTime(null);
    } else {
      // Pin new product
      socketRef.current.emit('pinProduct', {
        streamId,
        productId,
        duration: 60, // 60 seconds by default
      });
      setPinnedProductId(productId);
    }

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [streamId, pinnedProductId, isStreaming]);

  // Start flash sale
  const startFlashSale = useCallback((productId: string, discountPercent: number, durationMinutes: number) => {
    if (!socketRef.current || !isStreaming) return;

    socketRef.current.emit('startFlashSale', {
      streamId,
      productId,
      discountPercent,
      durationMinutes,
    });

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [streamId, isStreaming]);

  // Get purchase count for pinned product
  const getPinnedProductPurchaseCount = useCallback(() => {
    if (!pinnedProductId) return 0;
    return purchaseStats[pinnedProductId] || 0;
  }, [pinnedProductId, purchaseStats]);

  // Handle product quick buy from overlay (as host, this shows product detail)
  const handleOverlayProductPress = useCallback((productId: string) => {
    // Find the product in the products list
    const product = products.find(p => p.product.id === productId || p.id === productId);
    if (product) {
      // For host, we just highlight or pin the product
      handlePinProduct(product.product.id);
    }
  }, [products, handlePinProduct]);

  // Format helpers
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-CO')}`;
  };

  const formatBitrate = (bps: number) => {
    return `${(bps / 1000).toFixed(0)} kbps`;
  };

  // Permission check state
  if (hasPermissions === null) {
    console.log('[NativeBroadcast] RENDER: Checking permissions...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{t('live.checkingPermissions')}</Text>
      </View>
    );
  }

  // Permission denied state
  if (hasPermissions === false) {
    console.log('[NativeBroadcast] RENDER: Permissions denied');
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="videocam-off" size={64} color="#ef4444" />
        <Text style={styles.errorText}>
          {permissionError || t('live.permissionsRequired')}
        </Text>
        <Text style={styles.permissionHint}>
          {t('live.permissionsHint')}
        </Text>
        <View style={styles.permissionButtons}>
          <TouchableOpacity style={styles.retryButton} onPress={requestPermissions}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={openAppSettings}>
            <Text style={styles.settingsButtonText}>{t('live.openSettings')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (loadingCredentials) {
    console.log('[NativeBroadcast] RENDER: Loading credentials...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{t('live.loadingCredentials')}</Text>
      </View>
    );
  }

  if (!credentials) {
    console.log('[NativeBroadcast] RENDER: No credentials available');
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="error-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{t('live.failedToFetchCredentials')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCredentials}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Log when about to render IVSBroadcastCameraView
  console.log('[NativeBroadcast] Rendering IVSBroadcastCameraView with:', {
    rtmpsUrl: credentials.ingestEndpoint,
    streamKey: credentials.streamKey?.substring(0, 20) + '...',
    cameraPosition,
    isMuted,
    isBroadcastReady,
    broadcastState,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* IVS Broadcast Camera View */}
      <IVSBroadcastCameraView
        ref={broadcastRef}
        style={styles.broadcastView}
        rtmpsUrl={credentials.ingestEndpoint}
        streamKey={credentials.streamKey}
        cameraPosition={cameraPosition}
        isMuted={isMuted}
        configurationPreset="standardPortrait"
        onBroadcastStateChanged={handleBroadcastStateChanged}
        onIsBroadcastReady={handleIsBroadcastReady}
        onTransmissionStatisticsChanged={handleTransmissionStatisticsChanged}
        onBroadcastError={handleBroadcastError}
      />

      {/* Top Bar Overlay */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (isStreaming) {
              stopBroadcast();
            } else {
              navigation.goBack();
            }
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={[styles.statusContainer, isStreaming && styles.statusLive]}>
          {isStreaming && <View style={styles.liveDot} />}
          <Text style={styles.statusText}>
            {isStreaming ? 'LIVE' : broadcastState}
          </Text>
        </View>

        {isStreaming && (
          <>
            <View style={styles.durationContainer}>
              <MaterialIcons name="schedule" size={16} color="white" />
              <Text style={styles.durationText}>{formatDuration(streamDuration)}</Text>
            </View>

            <View style={styles.viewerContainer}>
              <MaterialIcons name="visibility" size={16} color="white" />
              <Text style={styles.viewerText}>{viewerCount}</Text>
            </View>
          </>
        )}

        {/* Quality indicator */}
        {transmissionStats && isStreaming && (
          <View style={styles.qualityContainer}>
            <MaterialIcons
              name="signal-cellular-alt"
              size={16}
              color={transmissionStats.networkHealth > 0.7 ? '#10b981' : transmissionStats.networkHealth > 0.4 ? '#f59e0b' : '#ef4444'}
            />
            <Text style={styles.qualityText}>
              {formatBitrate(transmissionStats.broadcastQuality || 0)}
            </Text>
          </View>
        )}
      </View>

      {/* Ready indicator when not streaming */}
      {!isStreaming && (
        <View style={styles.readyIndicator}>
          <MaterialIcons
            name={isBroadcastReady ? "check-circle" : "hourglass-empty"}
            size={24}
            color={isBroadcastReady ? "#10b981" : "#f59e0b"}
          />
          <Text style={[styles.readyText, { color: isBroadcastReady ? '#10b981' : '#f59e0b' }]}>
            {isBroadcastReady ? t('live.readyToStream') : t('live.preparingCamera')}
          </Text>
        </View>
      )}

      {/* TikTok Style Product Overlay (for host) */}
      {isStreaming && products.filter(p => p.isActive).length > 0 && (
        <ProductOverlayTikTok
          products={products
            .filter(p => p.isActive)
            .map(p => ({
              id: p.id,
              productId: p.product.id,
              name: p.product.name,
              price: p.product.price,
              specialPrice: p.specialPrice,
              image: p.product.images?.[0] || '',
              isActive: p.isActive,
            }))}
          pinnedProductId={pinnedProductId}
          purchaseCount={getPinnedProductPurchaseCount()}
          onQuickBuy={handleOverlayProductPress}
          onViewProduct={handleOverlayProductPress}
          onExpandProducts={() => setShowProductsPanel(true)}
          timerEndTime={timerEndTime}
          isHost={true}
          onPinProduct={handlePinProduct}
        />
      )}

      {/* Purchase Notifications */}
      <PurchaseNotification enabled={isStreaming} />

      {/* Purchase Celebration for big purchases */}
      <PurchaseCelebration
        purchase={currentPurchase}
        onDismiss={dismissCelebration}
      />

      {/* Chat Overlay */}
      {showChatOverlay && isStreaming && messages.length > 0 && (
        <View style={styles.chatOverlay}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            ref={(ref) => ref?.scrollToEnd({ animated: true })}
          >
            {messages.slice(-5).map((msg, index) => (
              <View key={`${msg.id}-${index}`} style={styles.chatMessage}>
                <Text style={styles.chatUsername}>{msg.username}:</Text>
                <Text style={styles.chatText}>{msg.message}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {/* Left Controls */}
        <View style={styles.leftControls}>
          {isStreaming && (
            <>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowAnalytics(true)}
              >
                <MaterialIcons name="analytics" size={24} color="white" />
                <Text style={styles.controlLabel}>{t('live.stats')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowProductsPanel(true)}
              >
                <MaterialIcons name="inventory" size={24} color="white" />
                <Text style={styles.controlLabel}>{t('live.products')}</Text>
                {products.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{products.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowChatOverlay(!showChatOverlay)}
              >
                <MaterialIcons
                  name={showChatOverlay ? 'chat' : 'chat-bubble-outline'}
                  size={24}
                  color="white"
                />
                <Text style={styles.controlLabel}>{t('live.chat')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Center - Main Action Button */}
        <View style={styles.centerControls}>
          {!isStreaming ? (
            <TouchableOpacity
              style={[styles.goLiveButton, !isBroadcastReady && styles.buttonDisabled]}
              onPress={() => {
                console.log('[NativeBroadcast] GO LIVE BUTTON PRESSED! isBroadcastReady:', isBroadcastReady);
                startBroadcast();
              }}
              disabled={!isBroadcastReady}
            >
              <MaterialIcons name="videocam" size={32} color="white" />
              <Text style={styles.goLiveText}>{t('live.goLive')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.endButton} onPress={stopBroadcast}>
              <MaterialIcons name="stop" size={32} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Right Controls */}
        <View style={styles.rightControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
            <MaterialIcons name="flip-camera-ios" size={24} color="white" />
            <Text style={styles.controlLabel}>{t('live.flip')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
            <MaterialIcons name={isMuted ? 'mic-off' : 'mic'} size={24} color={isMuted ? '#ef4444' : 'white'} />
            <Text style={styles.controlLabel}>{isMuted ? t('live.muted') : t('live.mic')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products Modal */}
      <Modal
        visible={showProductsPanel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProductsPanel(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('live.manageProducts')}</Text>
            <TouchableOpacity onPress={() => setShowProductsPanel(false)}>
              <MaterialIcons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {products.length === 0 ? (
              <View style={styles.emptyProducts}>
                <MaterialIcons name="inventory-2" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>{t('live.noProducts')}</Text>
              </View>
            ) : (
              products.map((item) => (
                <View key={item.id} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <View style={styles.productHeader}>
                      <Text style={styles.productName}>{item.product.name}</Text>
                      {pinnedProductId === item.product.id && (
                        <View style={styles.pinnedBadge}>
                          <MaterialIcons name="push-pin" size={12} color="white" />
                          <Text style={styles.pinnedBadgeText}>{t('live.pinned')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.productPrice}>
                      {item.specialPrice
                        ? formatCurrency(item.specialPrice)
                        : formatCurrency(item.product.price)}
                    </Text>
                    <View style={styles.productMeta}>
                      <Text style={styles.productStock}>
                        Stock: {item.product.stock}
                      </Text>
                      {purchaseStats[item.product.id] > 0 && (
                        <Text style={styles.productSold}>
                          {purchaseStats[item.product.id]} {t('live.soldDuringStream')}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={[
                        styles.pinButton,
                        pinnedProductId === item.product.id && styles.pinButtonActive,
                      ]}
                      onPress={() => handlePinProduct(item.product.id)}
                    >
                      <MaterialIcons
                        name="push-pin"
                        size={20}
                        color={pinnedProductId === item.product.id ? 'white' : '#6b7280'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.highlightButton,
                        item.isHighlighted && styles.highlightButtonActive,
                      ]}
                      onPress={() => toggleProductHighlight(item.product.id)}
                    >
                      <MaterialIcons
                        name={item.isHighlighted ? 'star' : 'star-outline'}
                        size={20}
                        color={item.isHighlighted ? '#fbbf24' : '#6b7280'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        visible={showAnalytics}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAnalytics(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('live.liveAnalytics')}</Text>
            <TouchableOpacity onPress={() => setShowAnalytics(false)}>
              <MaterialIcons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Transmission Stats */}
            {transmissionStats && (
              <View style={styles.transmissionCard}>
                <Text style={styles.transmissionTitle}>{t('live.streamQuality')}</Text>
                <View style={styles.transmissionRow}>
                  <Text style={styles.transmissionLabel}>{t('live.bitrate')}</Text>
                  <Text style={styles.transmissionValue}>
                    {formatBitrate(transmissionStats.broadcastQuality || 0)}
                  </Text>
                </View>
                <View style={styles.transmissionRow}>
                  <Text style={styles.transmissionLabel}>{t('live.networkHealth')}</Text>
                  <Text style={[
                    styles.transmissionValue,
                    { color: transmissionStats.networkHealth > 0.7 ? '#10b981' : transmissionStats.networkHealth > 0.4 ? '#f59e0b' : '#ef4444' }
                  ]}>
                    {Math.round((transmissionStats.networkHealth || 0) * 100)}%
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialIcons name="visibility" size={32} color="#8b5cf6" />
                <Text style={styles.statValue}>{stats.currentViewers}</Text>
                <Text style={styles.statLabel}>{t('live.currentViewers')}</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="trending-up" size={32} color="#10b981" />
                <Text style={styles.statValue}>{stats.peakViewers}</Text>
                <Text style={styles.statLabel}>{t('live.peakViewers')}</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="chat" size={32} color="#3b82f6" />
                <Text style={styles.statValue}>{stats.messagesCount}</Text>
                <Text style={styles.statLabel}>{t('live.messages')}</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="touch-app" size={32} color="#f59e0b" />
                <Text style={styles.statValue}>{stats.productsClicked}</Text>
                <Text style={styles.statLabel}>{t('live.productsClicked')}</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="shopping-cart" size={32} color="#ef4444" />
                <Text style={styles.statValue}>{stats.purchaseCount}</Text>
                <Text style={styles.statLabel}>{t('live.purchases')}</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="attach-money" size={32} color="#10b981" />
                <Text style={styles.statValue}>{formatCurrency(stats.revenue)}</Text>
                <Text style={styles.statLabel}>{t('live.revenue')}</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionHint: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  permissionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  settingsButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  broadcastView: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusLive: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  viewerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  viewerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginLeft: 'auto',
  },
  qualityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  readyIndicator: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  readyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatOverlay: {
    position: 'absolute',
    left: 16,
    bottom: 140,
    maxWidth: width * 0.7,
    maxHeight: 200,
  },
  chatMessage: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  chatUsername: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  chatText: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  leftControls: {
    flex: 1,
    gap: 16,
  },
  centerControls: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  rightControls: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 16,
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
  },
  controlLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  goLiveButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  goLiveText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  endButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  transmissionCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  transmissionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 12,
  },
  transmissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transmissionLabel: {
    fontSize: 14,
    color: '#166534',
  },
  transmissionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    flex: 1,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pinnedBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 2,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productStock: {
    fontSize: 12,
    color: '#6b7280',
  },
  productSold: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  pinButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  pinButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  highlightButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  highlightButtonActive: {
    backgroundColor: '#fef3c7',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
