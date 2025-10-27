import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import GSText from '../../components/ui/GSText';

// Notification types
export type NotificationType = 'order' | 'promotion' | 'system' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationCardProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
  onMarkAsRead,
}) => {
  const { theme } = useTheme();

  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'order':
        return 'bag-check-outline';
      case 'promotion':
        return 'pricetag-outline';
      case 'system':
        return 'settings-outline';
      case 'info':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case 'order':
        return theme.colors.primary;
      case 'promotion':
        return '#10B981';
      case 'system':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { backgroundColor: theme.colors.surface },
        !notification.isRead && styles.unreadCard,
      ]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationHeader}>
        <View
          style={[
            styles.notificationIcon,
            { backgroundColor: `${getNotificationColor(notification.type)}20` },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(notification.type) as any}
            size={24}
            color={getNotificationColor(notification.type)}
          />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationTitleRow}>
            <GSText variant="body" weight="semiBold" style={styles.notificationTitle}>
              {notification.title}
            </GSText>
            {!notification.isRead && <View style={styles.unreadBadge} />}
          </View>

          <GSText variant="body" color="textSecondary" numberOfLines={2} style={styles.notificationMessage}>
            {notification.message}
          </GSText>

          <GSText variant="caption" color="textSecondary" style={styles.notificationTime}>
            {formatTime(notification.createdAt)}
          </GSText>
        </View>
      </View>

      {!notification.isRead && (
        <TouchableOpacity
          style={styles.markAsReadButton}
          onPress={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // TODO: Replace with actual API call
      // const data = await notificationsService.getNotifications();

      // Mock data for now
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'order',
          title: 'Order Shipped',
          message: 'Your order #12345 has been shipped and is on the way!',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          type: 'promotion',
          title: 'Special Offer',
          message: '50% off on all electronics! Limited time offer.',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'order',
          title: 'Order Delivered',
          message: 'Your order #12344 has been delivered successfully.',
          isRead: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          type: 'system',
          title: 'App Update Available',
          message: 'A new version of GSHOP is available. Update now for new features!',
          isRead: true,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          type: 'info',
          title: 'New Arrivals',
          message: 'Check out the latest products just added to our store.',
          isRead: true,
          createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'order' && notification.data?.orderId) {
      (navigation as any).navigate('OrderTracking', { orderId: notification.data.orderId });
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      // TODO: Call API to mark as read
      // await notificationsService.markAsRead(id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // TODO: Call API to mark all as read
      // await notificationsService.markAllAsRead();

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call API to clear notifications
              // await notificationsService.clearAll();
              setNotifications([]);
            } catch (error) {
              console.error('Failed to clear notifications:', error);
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === 'all' ? true : !n.isRead
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <GSText variant="body" style={styles.loadingText}>
            Loading notifications...
          </GSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <GSText variant="h3" weight="bold">
          Notifications
        </GSText>
        {unreadCount > 0 && (
          <View style={[styles.unreadCountBadge, { backgroundColor: theme.colors.primary }]}>
            <GSText variant="caption" color="white" weight="bold">
              {unreadCount}
            </GSText>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && [styles.filterTabActive, { borderBottomColor: theme.colors.primary }],
          ]}
          onPress={() => setFilter('all')}
        >
          <GSText
            variant="body"
            weight={filter === 'all' ? 'semiBold' : 'normal'}
            color={filter === 'all' ? 'primary' : 'textSecondary'}
          >
            All ({notifications.length})
          </GSText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'unread' && [styles.filterTabActive, { borderBottomColor: theme.colors.primary }],
          ]}
          onPress={() => setFilter('unread')}
        >
          <GSText
            variant="body"
            weight={filter === 'unread' ? 'semiBold' : 'normal'}
            color={filter === 'unread' ? 'primary' : 'textSecondary'}
          >
            Unread ({unreadCount})
          </GSText>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View style={styles.actionsBar}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.actionButton}>
              <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.primary} />
              <GSText variant="caption" color="primary" style={{ marginLeft: 6 }}>
                Mark all as read
              </GSText>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleClearAll} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            <GSText variant="caption" color="error" style={{ marginLeft: 6 }}>
              Clear all
            </GSText>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={handleNotificationPress}
            onMarkAsRead={handleMarkAsRead}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNotifications(true)}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textSecondary} />
            <GSText variant="body" color="textSecondary" style={styles.emptyText}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </GSText>
            <GSText variant="caption" color="textSecondary" style={styles.emptySubtext}>
              {filter === 'unread'
                ? "You're all caught up!"
                : "We'll notify you when something new happens"}
            </GSText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  unreadCountBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  filterTabActive: {
    borderBottomWidth: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  notificationHeader: {
    flexDirection: 'row',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  notificationMessage: {
    marginBottom: 6,
  },
  notificationTime: {
    marginTop: 2,
  },
  markAsReadButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
  },
});
