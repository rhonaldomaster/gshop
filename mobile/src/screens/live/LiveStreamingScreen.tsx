import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import io, { Socket } from 'socket.io-client';

interface StreamProduct {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
  specialPrice?: number;
  isHighlighted: boolean;
  position: number;
}

interface Message {
  id: string;
  username: string;
  message: string;
  sentAt: string;
}

interface StreamStats {
  currentViewers: number;
  peakViewers: number;
  messagesCount: number;
  productsClicked: number;
  purchaseCount: number;
  revenue: number;
}

const { width, height } = Dimensions.get('window');

export default function LiveStreamingScreen({ route, navigation }: any) {
  const { t } = useTranslation('translation');
  const { streamId, rtmpUrl, streamKey } = route.params;

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [isMuted, setIsMuted] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'torch'>('off');

  // Stream state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);

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

  const socketRef = useRef<Socket | null>(null);
  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }

    fetchStreamProducts();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
    };
  }, []);

  const fetchStreamProducts = async () => {
    try {
      const response = await fetch(`${process.env.API_BASE_URL}/live/streams/${streamId}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch stream products:', error);
    }
  };

  const initializeSocket = () => {
    socketRef.current = io(`${process.env.API_BASE_URL}/live`);

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('hostJoinStream', { streamId });
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
      setMessages(prev => [...prev.slice(-50), message]); // Keep last 50 messages
      setStats(prev => ({ ...prev, messagesCount: prev.messagesCount + 1 }));
    });

    socketRef.current.on('productClick', (data: { productId: string }) => {
      setStats(prev => ({ ...prev, productsClicked: prev.productsClicked + 1 }));
    });

    socketRef.current.on('streamPurchase', (data: { amount: number }) => {
      setStats(prev => ({
        ...prev,
        purchaseCount: prev.purchaseCount + 1,
        revenue: prev.revenue + data.amount,
      }));
    });
  };

  const startStreaming = async () => {
    try {
      // In a real app, this would start RTMP publishing
      // For now, we simulate stream start
      const response = await fetch(`${process.env.API_BASE_URL}/live/streams/${streamId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        setIsStreaming(true);
        // Start duration timer
        streamTimerRef.current = setInterval(() => {
          setStreamDuration(prev => prev + 1);
        }, 1000);
        Alert.alert(t('common.success'), t('live.streamStarted'));
      } else {
        throw new Error('Failed to start stream');
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      Alert.alert(t('common.error'), t('live.failedToStartStream'));
    }
  };

  const endStreaming = () => {
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
              await fetch(`${process.env.API_BASE_URL}/live/streams/${streamId}/end`, {
                method: 'POST',
              });

              if (streamTimerRef.current) {
                clearInterval(streamTimerRef.current);
              }

              socketRef.current?.disconnect();

              // Navigate to results screen
              navigation.replace('LiveStreamResults', {
                streamId,
                stats,
                duration: streamDuration,
              });
            } catch (error) {
              console.error('Error ending stream:', error);
              Alert.alert(t('common.error'), t('live.failedToEndStream'));
            }
          },
        },
      ]
    );
  };

  const toggleCamera = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFlash = () => {
    setFlashMode(current => {
      if (current === 'off') return 'torch';
      if (current === 'torch') return 'off';
      return 'off';
    });
  };

  const highlightProduct = async (productId: string) => {
    try {
      await fetch(`${process.env.API_BASE_URL}/live/streams/${streamId}/products/${productId}/highlight`, {
        method: 'PUT',
      });

      setProducts(prev =>
        prev.map(p =>
          p.product.id === productId
            ? { ...p, isHighlighted: true }
            : { ...p, isHighlighted: false }
        )
      );

      Alert.alert(t('common.success'), t('live.productHighlighted'));
    } catch (error) {
      console.error('Error highlighting product:', error);
    }
  };

  const hideProduct = async (productId: string) => {
    try {
      await fetch(`${process.env.API_BASE_URL}/live/streams/${streamId}/products/${productId}/hide`, {
        method: 'PUT',
      });

      setProducts(prev =>
        prev.map(p =>
          p.product.id === productId ? { ...p, isHighlighted: false } : p
        )
      );
    } catch (error) {
      console.error('Error hiding product:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>{t('live.cameraPermissionRequired')}</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>{t('common.grantPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        enableTorch={flashMode === 'torch'}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.statusIndicator}>
            {isStreaming && <View style={styles.liveDot} />}
            <Text style={styles.liveText}>
              {isStreaming ? t('live.liveNow').toUpperCase() : t('live.ready')}
            </Text>
          </View>

          <View style={styles.durationContainer}>
            <MaterialIcons name="schedule" size={16} color="white" />
            <Text style={styles.durationText}>{formatDuration(streamDuration)}</Text>
          </View>

          <View style={styles.viewerContainer}>
            <MaterialIcons name="visibility" size={16} color="white" />
            <Text style={styles.viewerText}>{viewerCount}</Text>
          </View>
        </View>

        {/* Chat Overlay */}
        {showChatOverlay && messages.length > 0 && (
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
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{products.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowChatOverlay(!showChatOverlay)}
            >
              <MaterialIcons name={showChatOverlay ? "chat" : "chat-bubble-outline"} size={24} color="white" />
              <Text style={styles.controlLabel}>{t('live.chat')}</Text>
            </TouchableOpacity>
          </View>

          {/* Center - Main Action Button */}
          <View style={styles.centerControls}>
            {!isStreaming ? (
              <TouchableOpacity style={styles.startButton} onPress={startStreaming}>
                <MaterialIcons name="play-arrow" size={48} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.endButton} onPress={endStreaming}>
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
              <MaterialIcons name={isMuted ? "mic-off" : "mic"} size={24} color="white" />
              <Text style={styles.controlLabel}>{isMuted ? t('live.muted') : t('live.mic')}</Text>
            </TouchableOpacity>

            {cameraType === 'back' && (
              <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
                <MaterialIcons
                  name={flashMode === 'torch' ? "flash-on" : "flash-off"}
                  size={24}
                  color="white"
                />
                <Text style={styles.controlLabel}>{t('live.flash')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>

      {/* Products Management Modal */}
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
            {products.map((item) => (
              <View key={item.id} style={styles.productItem}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.product.name}</Text>
                  <Text style={styles.productPrice}>{formatCurrency(item.product.price)}</Text>
                  <Text style={styles.productStock}>
                    {t('products.stock')}: {item.product.stock}
                  </Text>
                </View>

                <View style={styles.productActions}>
                  {item.isHighlighted ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.hideButton]}
                      onPress={() => hideProduct(item.product.id)}
                    >
                      <MaterialIcons name="visibility-off" size={20} color="white" />
                      <Text style={styles.actionButtonText}>{t('live.hide')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.showButton]}
                      onPress={() => highlightProduct(item.product.id)}
                    >
                      <MaterialIcons name="visibility" size={20} color="white" />
                      <Text style={styles.actionButtonText}>{t('live.show')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
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
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  liveText: {
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
  chatOverlay: {
    position: 'absolute',
    left: 16,
    bottom: 120,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 24,
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
  startButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  endButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#6b7280',
  },
  productActions: {
    marginLeft: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  showButton: {
    backgroundColor: '#10b981',
  },
  hideButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});
