import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { wishlistService, WishlistItem } from '../../services/wishlist.service';
import { useCart } from '../../contexts/CartContext';
import { normalizeImageUrl } from '../../config/api.config';

export default function WishlistScreen({ navigation }: any) {
  const { t } = useTranslation('translation');
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart: addItemToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const items = await wishlistService.getWishlist();
      setWishlistItems(items);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      Alert.alert(t('common.error'), t('wishlist.errorLoading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
  };

  const removeFromWishlist = async (productId: string) => {
    Alert.alert(
      t('wishlist.removeItem'),
      t('wishlist.removeConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('wishlist.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically update UI
              setWishlistItems(prev => prev.filter(item => item.productId !== productId));

              // Remove from backend
              await wishlistService.removeFromWishlist(productId);
            } catch (error) {
              console.error('Failed to remove from wishlist:', error);
              Alert.alert(t('common.error'), t('wishlist.errorRemoving'));
              // Reload wishlist on error to sync with backend
              fetchWishlist();
            }
          }
        }
      ]
    );
  };

  const addToCart = async (product: WishlistItem['product']) => {
    const isAvailable = product.status === 'active' && product.quantity > 0;
    if (!isAvailable) {
      Alert.alert(t('wishlist.unavailable'), t('wishlist.outOfStock'));
      return;
    }

    try {
      await addItemToCart(product, 1);
      Alert.alert(t('common.success'), t('wishlist.addedToCart'), [
        { text: t('wishlist.continueShopping'), style: 'cancel' },
        { text: t('wishlist.viewCart'), onPress: () => navigation.navigate('Cart') }
      ]);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      Alert.alert(t('common.error'), t('wishlist.errorAddingToCart'));
    }
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: normalizeImageUrl(item.product.images[0]) || 'https://via.placeholder.com/120x120'
          }}
          style={styles.productImage}
        />
        {!(item.product.status === 'active' && item.product.quantity > 0) && (
          <View style={styles.unavailableBadge}>
            <Text style={styles.unavailableText}>{t('wishlist.outOfStock')}</Text>
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={styles.sellerName}>
          {t('social.by')} {item.product.seller?.name || t('wishlist.unknownSeller')}
        </Text>
        <Text style={styles.price}>${Number(item.product.price).toFixed(2)}</Text>
        <Text style={styles.addedDate}>
          {t('wishlist.added')} {new Date(item.addedAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromWishlist(item.productId)}
        >
          <MaterialIcons name="favorite" size={24} color="#ef4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            !(item.product.status === 'active' && item.product.quantity > 0) && styles.disabledButton
          ]}
          onPress={() => addToCart(item.product)}
          disabled={!(item.product.status === 'active' && item.product.quantity > 0)}
        >
          <MaterialIcons
            name="add-shopping-cart"
            size={24}
            color={(item.product.status === 'active' && item.product.quantity > 0) ? "white" : "#9ca3af"}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="favorite-border" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>{t('wishlist.empty')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('wishlist.emptyMessage')}
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.browseButtonText}>{t('wishlist.browseProducts')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{t('wishlist.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('wishlist.myWishlist')}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.itemCount}>{wishlistItems.length} {t('wishlist.items')}</Text>
          <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
            <MaterialIcons
              name="refresh"
              size={24}
              color={refreshing ? "#d1d5db" : "#374151"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={wishlistItems}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexGrow: 1,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  sellerName: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  addedDate: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  itemActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  removeButton: {
    padding: 4,
  },
  addToCartButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  disabledButton: {
    backgroundColor: '#f3f4f6',
  },
  addToCartText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledText: {
    color: '#9ca3af',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});