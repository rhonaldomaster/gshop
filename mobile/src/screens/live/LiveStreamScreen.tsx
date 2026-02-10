import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import io, { Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { ProductCard } from '../../components/live/ProductCard';
import { ChatMessage } from '../../components/live/ChatMessage';
import { LiveCheckoutModal } from '../../components/live/LiveCheckoutModal';
import { ProductOverlayTikTok, StreamProduct } from '../../components/live/ProductOverlayTikTok';
import { PurchaseNotification, PurchaseCelebration, usePurchaseNotifications } from '../../components/live/PurchaseNotification';
import { LiveCartBadge } from '../../components/live/LiveCartBadge';
import { LiveCartModal } from '../../components/live/LiveCartModal';
import { LiveCartItemData } from '../../components/live/LiveCartItem';
import { API_CONFIG } from '../../config/api.config';
import { usePiP } from '../../contexts/PiPContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveCart } from '../../hooks/useLiveCart';

interface LiveStreamData {
  id: string;
  title: string;
  description: string;
  status: string;
  hlsUrl: string;
  hostType: 'seller' | 'affiliate';
  sellerId?: string;
  seller?: {
    id: string;
    businessName: string;
  };
  affiliate?: {
    id: string;
    name: string;
  };
  products: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      price: number;
      images: string[];
    };
    specialPrice?: number;
    isActive: boolean;
  }>;
}

interface Message {
  id: string;
  username: string;
  message: string;
  sentAt: string;
  user?: any;
}

interface PurchaseStats {
  [productId: string]: number;
}

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen({ route, navigation }: any) {
  const { t } = useTranslation('translation');
  const { streamId, fromPiP } = route.params;
  const { user, isAuthenticated } = useAuth();
  const [stream, setStream] = useState<LiveStreamData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showQuickCheckout, setShowQuickCheckout] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [streamEnded, setStreamEnded] = useState(false);

  // TikTok Shop style states
  const [pinnedProductId, setPinnedProductId] = useState<string | null>(null);
  const [purchaseStats, setPurchaseStats] = useState<PurchaseStats>({});
  const [timerEndTime, setTimerEndTime] = useState<Date | null>(null);

  // Live cart with persistence
  const {
    cart: liveCart,
    setCart: setLiveCart,
    isLoading: isCartLoading,
    addItem: addCartItem,
    updateQuantity: updateCartItemQuantity,
    removeItem: removeCartItem,
    isInCart: checkIsInCart,
    clearCart,
    getSummary: getCartSummary,
  } = useLiveCart(streamId);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Purchase notification hook
  const { triggerNotification, currentPurchase, dismissCelebration } = usePurchaseNotifications();

  // PiP context
  const { enterPiP, isActive: isPiPActive, streamData: pipStreamData, socketRef: pipSocketRef } = usePiP();

  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<Video>(null);
  const wasPlayingRef = useRef(false);

  // Handle returning from PiP mode - reuse existing socket
  useEffect(() => {
    if (fromPiP && pipStreamData && pipStreamData.id === streamId) {
      // Reuse socket from PiP mode
      socketRef.current = pipSocketRef.current;
      setViewerCount(pipStreamData.viewerCount);
      console.log('[LiveStreamScreen] Restored from PiP mode');
    }
  }, [fromPiP, pipStreamData, streamId, pipSocketRef]);

  useEffect(() => {
    fetchStreamData();
    // Only initialize socket if not coming from PiP
    if (!fromPiP || !pipSocketRef.current) {
      initializeSocket();
    }

    return () => {
      // Only disconnect if not in PiP mode
      if (socketRef.current && !isPiPActive) {
        socketRef.current.emit('leaveStream', { streamId });
        socketRef.current.disconnect();
      }
    };
  }, [streamId]);

  // Minimize to PiP mode
  const minimizeToPiP = useCallback(() => {
    if (!stream) return;

    const hostName = stream.hostType === 'seller'
      ? stream.seller?.businessName || ''
      : stream.affiliate?.name || '';

    enterPiP({
      id: stream.id,
      title: stream.title,
      hlsUrl: stream.hlsUrl,
      hostType: stream.hostType,
      hostName,
      viewerCount,
    }, socketRef.current);

    // Don't disconnect socket - PiP will use it
    socketRef.current = null;
    navigation.goBack();
  }, [stream, viewerCount, enterPiP, navigation]);

  const fetchStreamData = async () => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/live/streams/${streamId}`;
      console.log('Fetching stream from:', url);
      const response = await fetch(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (response.ok) {
        const data = await response.json();
        setStream(data);
      } else {
        console.error('Failed to fetch stream, status:', response.status);
        Alert.alert(t('common.error'), t('live.failedToLoadStream'));
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to fetch stream data:', error);
      Alert.alert(t('common.error'), t('live.failedToLoadStream'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const socketUrl = `${API_CONFIG.WEBSOCKET_URL}/live`;
    console.log('Connecting to WebSocket:', socketUrl);
    socketRef.current = io(socketUrl);

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('joinStream', {
        streamId,
        userId: user?.id,
        sessionId: `mobile_${Date.now()}`,
      });
    });

    socketRef.current.on('streamInfo', (data: { stream: LiveStreamData; viewerCount: number }) => {
      setStream(data.stream);
      setViewerCount(data.viewerCount);
    });

    socketRef.current.on('viewerCountUpdate', (data: { count: number }) => {
      setViewerCount(data.count);
    });

    socketRef.current.on('newMessage', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('recentMessages', (recentMessages: Message[]) => {
      setMessages(recentMessages);
    });

    socketRef.current.on('streamStatusUpdate', (data: { status: string }) => {
      if (data.status === 'ended') {
        setStreamEnded(true);
      }
    });

    socketRef.current.on('streamProductsUpdate', (data: { products: LiveStreamData['products'] }) => {
      setStream(prev => prev ? { ...prev, products: data.products } : null);
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

    socketRef.current.on('purchaseAnimation', () => {
      // Animation is handled by PurchaseCelebration component
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    const displayName = user?.firstName || user?.email?.split('@')[0] || t('live.anonymous');

    socketRef.current.emit('sendMessage', {
      streamId,
      userId: user?.id,
      username: displayName,
      message: newMessage.trim(),
    });

    setNewMessage('');

    // Add haptic feedback for sending message
    // Vibration.vibrate(50); // Uncomment if you want vibration
  };

  const toggleProducts = () => {
    console.log('[LiveStreamScreen] toggleProducts called');
    console.log('[LiveStreamScreen] stream:', stream ? 'exists' : 'null');
    console.log('[LiveStreamScreen] stream.products:', stream?.products ? `array of ${stream.products.length}` : 'null/undefined');
    if (stream?.products) {
      console.log('[LiveStreamScreen] products sample:', JSON.stringify(stream.products.slice(0, 2), null, 2));
    }
    setShowProducts(!showProducts);
    setShowChat(false);
  };

  const toggleChat = () => {
    setShowChat(!showChat);
    setShowProducts(false);
  };

  const onProductPress = (productId: string) => {
    // Minimize to PiP so viewer keeps watching while browsing the product
    if (stream) {
      const hostName = stream.hostType === 'seller'
        ? stream.seller?.businessName || ''
        : stream.affiliate?.name || '';

      enterPiP({
        id: stream.id,
        title: stream.title,
        hlsUrl: stream.hlsUrl,
        hostType: stream.hostType,
        hostName,
        viewerCount,
      }, socketRef.current);

      socketRef.current = null;
    }

    // Navigate to product detail with live context for attribution
    navigation.navigate('ProductDetail', {
      productId,
      liveSessionId: streamId,
      affiliateId: stream?.hostType === 'affiliate' ? stream.affiliate?.id : undefined
    });
  };

  const quickBuyProduct = (product: any) => {
    setSelectedProduct(product);
    setShowQuickCheckout(true);
  };

  const handleCheckoutSuccess = useCallback((orderData: { orderId: string; productName: string }) => {
    // Notify via WebSocket that purchase was made
    if (socketRef.current && selectedProduct) {
      socketRef.current.emit('purchaseMade', {
        streamId,
        productId: selectedProduct.product.id,
        productName: orderData.productName,
        quantity: 1,
        amount: selectedProduct.specialPrice || selectedProduct.product.price,
      });
    }
    setShowQuickCheckout(false);
    setSelectedProduct(null);
  }, [streamId, selectedProduct]);

  // Live Cart Functions
  const addToLiveCart = useCallback((streamProduct: StreamProduct | any) => {
    // Handle different product shapes from overlay vs panel
    const hasNestedProduct = !!streamProduct.product;
    const productId = hasNestedProduct
      ? streamProduct.product.id
      : (streamProduct.productId || streamProduct.id);
    const productData = hasNestedProduct
      ? streamProduct.product
      : {
          id: productId,
          name: streamProduct.name || '',
          price: streamProduct.price || 0,
          images: streamProduct.image ? [streamProduct.image] : [],
          stock: streamProduct.stock,
        };
    const specialPrice = streamProduct.specialPrice;

    // Use the hook's addItem function with persistence
    console.log('[LiveStreamScreen] Adding to cart:', { productId, productName: productData.name });
    addCartItem({
      productId,
      product: productData,
      quantity: 1,
      specialPrice,
    });
    console.log('[LiveStreamScreen] Cart after add:', liveCart.length + 1, 'items');

    // Feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Toast.show({
      type: 'success',
      text1: t('live.liveCart.addedToCart'),
      text2: productData.name,
      visibilityTime: 2000,
    });
  }, [t, addCartItem]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    updateCartItemQuantity(productId, quantity);
  }, [updateCartItemQuantity]);

  const removeFromCart = useCallback((productId: string) => {
    removeCartItem(productId);
    Toast.show({
      type: 'info',
      text1: t('live.liveCart.itemRemoved'),
      visibilityTime: 1500,
    });
  }, [t, removeCartItem]);

  const isInCart = useCallback((productId: string) => {
    return checkIsInCart(productId);
  }, [checkIsInCart]);

  // Calculate total items reactively from liveCart
  const liveCartTotalItems = liveCart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCartCheckout = useCallback(() => {
    setIsCartOpen(false);
    navigation.navigate('LiveCartCheckout', {
      items: liveCart,
      streamId,
      affiliateId: stream?.hostType === 'affiliate' ? stream.affiliate?.id : undefined,
    });
  }, [liveCart, streamId, stream?.hostType, stream?.affiliate?.id, navigation]);

  // Handler for TikTok style overlay quick buy
  const handleOverlayQuickBuy = useCallback((overlayProduct: any) => {
    if (!overlayProduct || !stream?.products) return;
    // Find the full product data from stream products
    const streamProduct = stream.products.find(
      p => p?.id === overlayProduct.id || p?.product?.id === overlayProduct.productId
    );
    if (streamProduct?.product) {
      setSelectedProduct(streamProduct);
      setShowQuickCheckout(true);
    }
  }, [stream]);

  // Handler for expanding products panel
  const handleExpandProducts = useCallback(() => {
    setShowProducts(true);
    setShowChat(false);
  }, []);

  // Get total purchase count for pinned product
  const getPinnedProductPurchaseCount = useCallback(() => {
    if (!pinnedProductId) return 0;
    return purchaseStats[pinnedProductId] || 0;
  }, [pinnedProductId, purchaseStats]);

  // Detect stream end via video player (fallback if socket event doesn't arrive)
  const handlePlaybackStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      wasPlayingRef.current = true;
    }

    // Stream ended: was playing, now stopped, not buffering, and not already marked
    if (wasPlayingRef.current && !status.isPlaying && !status.isBuffering && !streamEnded) {
      // didJustFinish for HLS means the stream genuinely ended
      if (status.didJustFinish) {
        setStreamEnded(true);
      }
    }
  }, [streamEnded]);

  const formatViewerCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage message={item} />
  );

  const renderProduct = ({ item, index }: any) => {
    console.log(`[LiveStreamScreen] renderProduct called for index ${index}`);
    console.log(`[LiveStreamScreen] item:`, item ? 'exists' : 'null');
    console.log(`[LiveStreamScreen] item.product:`, item?.product ? 'exists' : 'null');
    console.log(`[LiveStreamScreen] item.product.id:`, item?.product?.id || 'missing');

    if (!item?.product?.id) {
      console.log(`[LiveStreamScreen] Skipping product at index ${index} - missing product.id`);
      return null;
    }

    try {
      return (
        <ProductCard
          product={item}
          onPress={() => onProductPress(item.product.id)}
          onQuickBuy={() => quickBuyProduct(item)}
          onAddToCart={() => addToLiveCart(item)}
          isInCart={isInCart(item.product.id)}
          showSpecialPrice={true}
          liveMode={true}
        />
      );
    } catch (error) {
      console.error(`[LiveStreamScreen] Error rendering product at index ${index}:`, error);
      return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('live.loadingStream')}</Text>
      </View>
    );
  }

  if (!stream) {
    return (
      <View style={styles.errorContainer}>
        <Text>{t('live.streamNotFound')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: stream.hlsUrl }}
          useNativeControls={true}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Stream Info Overlay */}
        <View style={styles.streamOverlay}>
          <View style={styles.streamHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            {/* PiP minimize button */}
            <TouchableOpacity
              style={styles.pipButton}
              onPress={minimizeToPiP}
            >
              <MaterialIcons name="picture-in-picture-alt" size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.streamInfo}
              onPress={() => {
                if (stream.hostType === 'seller' && (stream.seller?.id || stream.sellerId)) {
                  navigation.navigate('SellerProfile' as any, { sellerId: stream.seller?.id || stream.sellerId });
                } else if (stream.hostType === 'affiliate' && stream.affiliate?.id) {
                  navigation.navigate('AffiliateProfile' as any, { affiliateId: stream.affiliate.id });
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.streamTitle} numberOfLines={1}>
                {stream.title}
              </Text>
              <View style={styles.hostInfo}>
                <Text style={styles.sellerName}>
                  {stream.hostType === 'seller' ? stream.seller?.businessName : stream.affiliate?.name}
                </Text>
                <View style={[styles.hostTypeBadge, {
                  backgroundColor: stream.hostType === 'seller' ? '#3b82f6' : '#f59e0b'
                }]}>
                  <Text style={styles.hostTypeText}>
                    {stream.hostType === 'seller' ? t('live.seller').toUpperCase() : t('live.affiliateLabel').toUpperCase()}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={16} color="rgba(255, 255, 255, 0.6)" />
              </View>
            </TouchableOpacity>

            <View style={styles.viewerInfo}>
              <MaterialIcons name="visibility" size={16} color="white" />
              <Text style={styles.viewerCount}>{formatViewerCount(viewerCount)}</Text>
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={[styles.controlButton, showProducts && styles.activeButton]}
              onPress={toggleProducts}
            >
              <MaterialIcons name="shopping-bag" size={20} color="white" />
              <Text style={styles.controlText}>{t('live.products')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, showChat && styles.activeButton]}
              onPress={toggleChat}
            >
              <MaterialIcons name="chat" size={20} color="white" />
              <Text style={styles.controlText}>{t('live.chat')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Products Panel */}
      {showProducts && (() => {
        console.log('[LiveStreamScreen] Rendering Products Panel');
        const productsData = (stream?.products || []).filter(p => {
          const isValid = p?.isActive && p?.product;
          console.log(`[LiveStreamScreen] Filter product: isActive=${p?.isActive}, hasProduct=${!!p?.product}, isValid=${isValid}`);
          return isValid;
        });
        console.log(`[LiveStreamScreen] Filtered products count: ${productsData.length}`);

        return (
          <View style={styles.productsPanel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{t('live.featuredProducts')}</Text>
              <TouchableOpacity onPress={() => setShowProducts(false)}>
                <MaterialIcons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={productsData}
              renderItem={renderProduct}
              keyExtractor={(item, index) => item?.id || `product-${index}`}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          </View>
        );
      })()}

      {/* Chat Panel */}
      {showChat && (
        <View style={styles.chatPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>{t('live.liveChat')}</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.messageInput}>
            <TextInput
              style={styles.textInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={t('live.typeMessage')}
              multiline={true}
              maxLength={200}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <MaterialIcons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* TikTok Style Product Overlay */}
      {(stream.products || []).filter(p => p?.isActive && p?.product).length > 0 && (
        <ProductOverlayTikTok
          products={(stream.products || [])
            .filter(p => p?.isActive && p?.product)
            .map(p => ({
              id: p.id || '',
              productId: p.product?.id || '',
              name: p.product?.name || '',
              price: p.product?.price || 0,
              specialPrice: p.specialPrice,
              image: p.product?.images?.[0] || '',
              isActive: p.isActive,
            }))}
          pinnedProductId={pinnedProductId}
          purchaseCount={getPinnedProductPurchaseCount()}
          onQuickBuy={handleOverlayQuickBuy}
          onAddToCart={addToLiveCart}
          onViewProduct={onProductPress}
          onExpandProducts={handleExpandProducts}
          timerEndTime={timerEndTime}
          isHost={false}
          isInCart={isInCart}
        />
      )}

      {/* Live Cart Badge */}
      <LiveCartBadge
        count={liveCartTotalItems}
        onPress={() => setIsCartOpen(true)}
      />

      {/* Live Cart Modal */}
      <LiveCartModal
        visible={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={liveCart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCartCheckout}
      />

      {/* Purchase Notifications */}
      <PurchaseNotification
        enabled={true}
      />

      {/* Purchase Celebration for big purchases */}
      <PurchaseCelebration
        purchase={currentPurchase}
        onDismiss={dismissCelebration}
      />

      {/* Live Checkout Modal */}
      {selectedProduct?.product && (
        <LiveCheckoutModal
          visible={showQuickCheckout}
          product={{
            id: selectedProduct.product.id || '',
            name: selectedProduct.product.name || '',
            price: selectedProduct.product.price || 0,
            images: selectedProduct.product.images || [],
            specialPrice: selectedProduct.specialPrice,
          }}
          liveSessionId={streamId}
          affiliateId={stream?.hostType === 'affiliate' ? stream?.affiliate?.id : undefined}
          onClose={() => setShowQuickCheckout(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Stream Ended Overlay */}
      {streamEnded && (
        <View style={styles.streamEndedOverlay}>
          <View style={styles.streamEndedContent}>
            <MaterialIcons name="videocam-off" size={48} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.streamEndedTitle}>{t('live.streamEnded')}</Text>
            <Text style={styles.streamEndedMessage}>{t('live.streamEndedMessage')}</Text>
            <TouchableOpacity
              style={styles.streamEndedButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.streamEndedButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: width,
    height: height * 0.6,
  },
  streamOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  streamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  pipButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
  },
  streamInfo: {
    flex: 1,
  },
  streamTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sellerName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginRight: 8,
  },
  hostTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  hostTypeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  viewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewerCount: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  activeButton: {
    backgroundColor: '#8b5cf6',
  },
  controlText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  productsPanel: {
    backgroundColor: 'white',
    maxHeight: height * 0.3,
  },
  chatPanel: {
    backgroundColor: 'white',
    flex: 1,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  productsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: 'white',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#8b5cf6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  streamEndedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  streamEndedContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  streamEndedTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  streamEndedMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  streamEndedButton: {
    marginTop: 24,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  streamEndedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});