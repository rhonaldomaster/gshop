import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import io, { Socket } from 'socket.io-client';
import { ProductCard } from '../../components/live/ProductCard';
import { ChatMessage } from '../../components/live/ChatMessage';

interface LiveStreamData {
  id: string;
  title: string;
  description: string;
  status: string;
  hlsUrl: string;
  hostType: 'seller' | 'affiliate';
  seller?: {
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

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen({ route, navigation }: any) {
  const { streamId } = route.params;
  const [stream, setStream] = useState<LiveStreamData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showProducts, setShowProducts] = useState(false);
  const [showChat, setShowChat] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    fetchStreamData();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveStream', { streamId });
        socketRef.current.disconnect();
      }
    };
  }, [streamId]);

  const fetchStreamData = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/live/streams/${streamId}`);
      if (response.ok) {
        const data = await response.json();
        setStream(data);
      }
    } catch (error) {
      console.error('Failed to fetch stream data:', error);
      Alert.alert('Error', 'Failed to load stream');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    socketRef.current = io(`${process.env.EXPO_PUBLIC_API_URL}/live`);

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('joinStream', {
        streamId,
        sessionId: `mobile_${Date.now()}`,
      });
    });

    socketRef.current.on('streamInfo', (data) => {
      setStream(data.stream);
      setViewerCount(data.viewerCount);
    });

    socketRef.current.on('viewerCountUpdate', (data) => {
      setViewerCount(data.count);
    });

    socketRef.current.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('recentMessages', (recentMessages) => {
      setMessages(recentMessages);
    });

    socketRef.current.on('streamStatusUpdate', (data) => {
      if (data.status === 'ended') {
        Alert.alert('Stream Ended', 'This live stream has ended.');
        navigation.goBack();
      }
    });

    socketRef.current.on('streamProductsUpdate', (data) => {
      setStream(prev => prev ? { ...prev, products: data.products } : null);
    });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('sendMessage', {
      streamId,
      username: 'Anonymous', // In a real app, get from user context
      message: newMessage.trim(),
    });

    setNewMessage('');
  };

  const toggleProducts = () => {
    setShowProducts(!showProducts);
    setShowChat(false);
  };

  const toggleChat = () => {
    setShowChat(!showChat);
    setShowProducts(false);
  };

  const onProductPress = (productId: string) => {
    // Pass live stream context for attribution
    navigation.navigate('ProductDetails', {
      productId,
      liveSessionId: streamId,
      affiliateId: stream?.hostType === 'affiliate' ? stream.affiliate?.id : undefined
    });
  };

  const formatViewerCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage message={item} />
  );

  const renderProduct = ({ item }: any) => (
    <ProductCard
      product={item}
      onPress={() => onProductPress(item.product.id)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading stream...</Text>
      </View>
    );
  }

  if (!stream) {
    return (
      <View style={styles.errorContainer}>
        <Text>Stream not found</Text>
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
          useNativeControls
          resizeMode="contain"
          shouldPlay
          isLooping={false}
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

            <View style={styles.streamInfo}>
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
                    {stream.hostType === 'seller' ? 'SELLER' : 'AFFILIATE'}
                  </Text>
                </View>
              </View>
            </View>

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
              <Text style={styles.controlText}>Products</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, showChat && styles.activeButton]}
              onPress={toggleChat}
            >
              <MaterialIcons name="chat" size={20} color="white" />
              <Text style={styles.controlText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Products Panel */}
      {showProducts && (
        <View style={styles.productsPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => setShowProducts(false)}>
              <MaterialIcons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={stream.products.filter(p => p.isActive)}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        </View>
      )}

      {/* Chat Panel */}
      {showChat && (
        <View style={styles.chatPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Live Chat</Text>
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
              placeholder="Type a message..."
              multiline
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
    marginRight: 12,
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
});