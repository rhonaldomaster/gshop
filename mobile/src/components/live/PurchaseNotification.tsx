import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PurchaseEvent {
  id: string;
  productName: string;
  buyerName: string;
  quantity: number;
  timestamp: Date;
}

interface PurchaseNotificationProps {
  enabled: boolean;
  onPurchase?: (purchase: PurchaseEvent) => void;
}

interface NotificationItem extends PurchaseEvent {
  animValue: Animated.Value;
}

export function PurchaseNotification({ enabled, onPurchase }: PurchaseNotificationProps) {
  const { t } = useTranslation('translation');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notificationQueue = useRef<PurchaseEvent[]>([]);
  const isProcessing = useRef(false);

  // Process notification queue
  const processQueue = useCallback(async () => {
    if (isProcessing.current || notificationQueue.current.length === 0) {
      return;
    }

    isProcessing.current = true;
    const purchase = notificationQueue.current.shift()!;

    // Create notification with animation value
    const notification: NotificationItem = {
      ...purchase,
      animValue: new Animated.Value(0),
    };

    setNotifications(prev => [...prev.slice(-2), notification]); // Keep max 3 notifications

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Animate in
    Animated.sequence([
      Animated.spring(notification.animValue, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.delay(2500), // Show for 2.5 seconds
      Animated.timing(notification.animValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove notification after animation
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      isProcessing.current = false;
      // Process next in queue
      processQueue();
    });

    // Callback
    if (onPurchase) {
      onPurchase(purchase);
    }
  }, [onPurchase]);

  // Add purchase to queue
  const addPurchase = useCallback((purchase: PurchaseEvent) => {
    if (!enabled) return;

    notificationQueue.current.push(purchase);
    processQueue();
  }, [enabled, processQueue]);

  // Expose addPurchase method via ref
  useEffect(() => {
    // This component should be controlled via socket events
    // The parent component will call addPurchase when receiving 'newPurchase' socket events
  }, []);

  // For demo/testing, expose method globally (remove in production)
  useEffect(() => {
    (global as any).addPurchaseNotification = addPurchase;
    return () => {
      delete (global as any).addPurchaseNotification;
    };
  }, [addPurchase]);

  if (!enabled || notifications.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {notifications.map((notification, index) => (
        <Animated.View
          key={notification.id}
          style={[
            styles.notificationCard,
            {
              opacity: notification.animValue,
              transform: [
                {
                  translateX: notification.animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_WIDTH, 0],
                  }),
                },
                {
                  scale: notification.animValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.1, 1],
                  }),
                },
              ],
              marginBottom: index < notifications.length - 1 ? 8 : 0,
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name="shopping-bag" size={20} color="white" />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.buyerName}>{notification.buyerName}</Text>
            <Text style={styles.purchaseText} numberOfLines={1}>
              {t('live.justBought')} {notification.quantity > 1 ? `${notification.quantity}x ` : ''}
              <Text style={styles.productName}>{notification.productName}</Text>
            </Text>
          </View>
          <View style={styles.celebrationEmoji}>
            <Text style={styles.emoji}>🎉</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

// Standalone component for floating purchase animations (confetti-like)
export function PurchaseAnimation({ visible }: { visible: boolean }) {
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; anim: Animated.Value }[]>([]);

  useEffect(() => {
    if (visible) {
      const emojis = ['🛍️', '💜', '✨', '🎉', '💰', '🔥'];
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * SCREEN_WIDTH,
        anim: new Animated.Value(0),
      }));

      setParticles(newParticles);

      // Animate all particles
      Animated.stagger(
        50,
        newParticles.map(p =>
          Animated.timing(p.anim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          })
        )
      ).start(() => {
        setParticles([]);
      });
    }
  }, [visible]);

  if (!visible && particles.length === 0) return null;

  return (
    <View style={styles.animationContainer} pointerEvents="none">
      {particles.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x,
              opacity: particle.anim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateY: particle.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -200],
                  }),
                },
                {
                  scale: particle.anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1.5, 1],
                  }),
                },
                {
                  rotate: particle.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${Math.random() * 360}deg`],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.particleEmoji}>{particle.emoji}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

// Combined component with banner for big purchases
export function PurchaseCelebration({
  purchase,
  onDismiss,
}: {
  purchase: PurchaseEvent | null;
  onDismiss: () => void;
}) {
  const { t } = useTranslation('translation');
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (purchase) {
      // Animate in
      Animated.parallel([
        Animated.spring(bannerAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        Animated.timing(bannerAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onDismiss();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [purchase]);

  if (!purchase) return null;

  return (
    <View style={styles.celebrationOverlay} pointerEvents="none">
      {/* Confetti animation */}
      <PurchaseAnimation visible={!!purchase} />

      {/* Big banner */}
      <Animated.View
        style={[
          styles.celebrationBanner,
          {
            opacity: bannerAnim,
            transform: [
              { scale: scaleAnim },
              {
                translateY: bannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.celebrationContent}>
          <Text style={styles.celebrationEmoji}>🎊</Text>
          <View style={styles.celebrationText}>
            <Text style={styles.celebrationTitle}>{t('live.newPurchase')}</Text>
            <Text style={styles.celebrationProduct} numberOfLines={1}>
              {purchase.productName}
            </Text>
          </View>
          <Text style={styles.celebrationEmoji}>🎊</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 12,
    left: 12,
    zIndex: 100,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 10,
  },
  buyerName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  purchaseText: {
    fontSize: 13,
    color: 'white',
    marginTop: 2,
  },
  productName: {
    fontWeight: 'bold',
    color: '#fcd34d',
  },
  celebrationEmoji: {
    marginLeft: 8,
  },
  emoji: {
    fontSize: 20,
  },
  animationContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    bottom: 100,
  },
  particleEmoji: {
    fontSize: 32,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 120,
  },
  celebrationBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    maxWidth: SCREEN_WIDTH - 48,
  },
  celebrationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  celebrationText: {
    alignItems: 'center',
    flex: 1,
  },
  celebrationTitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  celebrationProduct: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
  celebrationEmoji: {
    fontSize: 28,
  },
});

// Export a hook for easy integration
export function usePurchaseNotifications() {
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentPurchase, setCurrentPurchase] = useState<PurchaseEvent | null>(null);

  const triggerNotification = useCallback((purchase: Omit<PurchaseEvent, 'id'>) => {
    const fullPurchase: PurchaseEvent = {
      ...purchase,
      id: `purchase_${Date.now()}`,
    };

    // Add to notification queue
    if ((global as any).addPurchaseNotification) {
      (global as any).addPurchaseNotification(fullPurchase);
    }

    // Show animation for big purchases (quantity > 1 or high value)
    if (purchase.quantity > 1) {
      setShowAnimation(true);
      setCurrentPurchase(fullPurchase);
    }
  }, []);

  const dismissCelebration = useCallback(() => {
    setCurrentPurchase(null);
    setShowAnimation(false);
  }, []);

  return {
    triggerNotification,
    showAnimation,
    currentPurchase,
    dismissCelebration,
  };
}
