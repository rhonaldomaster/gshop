import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
  Clipboard,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { affiliatesService, AffiliateLink } from '../../services/affiliates.service';
import { productsService } from '../../services/products.service';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';

interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  image: string;
  seller?: any;
  category: string;
}

export const LinkGeneratorScreen = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [recentLinks, setRecentLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  const loadRecentLinks = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { links } = await affiliatesService.getAffiliateLinks(1, 10);
      setRecentLinks(links);
    } catch (error) {
      console.error('Error loading recent links:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const products = await productsService.searchProducts(query, 1, 20);
      setSearchResults(products.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Error', 'Failed to search products. Please try again.');
    } finally {
      setSearching(false);
    }
  }, []);

  const generateAffiliateLink = useCallback(async (product: ProductSearchResult) => {
    if (!user?.id) return;

    try {
      setGeneratingLink(product.id);

      // Generate product URL (this would be the actual product page URL)
      const productUrl = `https://gshop.com/products/${product.id}`;

      const affiliateLink = await affiliatesService.createAffiliateLink(
        productUrl,
        product.id,
        product.seller?.id
      );

      // Update recent links
      setRecentLinks(prev => [affiliateLink, ...prev.slice(0, 9)]);

      // Copy to clipboard
      await Clipboard.setString(affiliateLink.fullUrl);

      Alert.alert(
        'Link Generated! 🎉',
        'Your affiliate link has been created and copied to clipboard.',
        [
          { text: 'OK' },
          {
            text: 'Share',
            onPress: () => shareLink(affiliateLink),
          },
        ]
      );
    } catch (error) {
      console.error('Error generating affiliate link:', error);
      Alert.alert('Error', 'Failed to generate affiliate link. Please try again.');
    } finally {
      setGeneratingLink(null);
    }
  }, [user?.id]);

  const shareLink = useCallback(async (link: AffiliateLink) => {
    try {
      const result = await Share.share({
        message: `Check out this amazing product! ${link.fullUrl}`,
        url: link.fullUrl,
      });

      if (result.action === Share.sharedAction) {
        // Track sharing event
        console.log('Link shared successfully');
      }
    } catch (error) {
      console.error('Error sharing link:', error);
      Alert.alert('Error', 'Failed to share link.');
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await Clipboard.setString(text);
      Alert.alert('Copied! 📋', 'Link copied to clipboard.');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy link.');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecentLinks();
    setRefreshing(false);
  }, [loadRecentLinks]);

  useEffect(() => {
    loadRecentLinks();
  }, [loadRecentLinks]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchProducts]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          title="Sign in Required"
          description="Please sign in to generate affiliate links"
          icon="🔐"
        />
      </SafeAreaView>
    );
  }

  const renderProductItem = (product: ProductSearchResult) => (
    <TouchableOpacity
      key={product.id}
      style={styles.productItem}
      onPress={() => generateAffiliateLink(product)}
      disabled={generatingLink === product.id}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
        {product.seller && (
          <Text style={styles.productSeller}>by {product.seller.name}</Text>
        )}
      </View>

      <View style={styles.generateButton}>
        {generatingLink === product.id ? (
          <ActivityIndicator color="#007bff" size="small" />
        ) : (
          <Text style={styles.generateButtonText}>Generate Link</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRecentLink = (link: AffiliateLink) => (
    <View key={link.id} style={styles.linkItem}>
      <View style={styles.linkInfo}>
        <Text style={styles.linkUrl} numberOfLines={1}>
          {link.fullUrl}
        </Text>
        <View style={styles.linkStats}>
          <Text style={styles.linkStat}>👆 {link.clicks} clicks</Text>
          <Text style={styles.linkStat}>💰 {link.conversions} sales</Text>
          <Text style={styles.linkStat}>💵 ${link.revenue.toFixed(2)}</Text>
        </View>
        <Text style={styles.linkDate}>
          Created {new Date(link.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.linkActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => copyToClipboard(link.fullUrl)}
        >
          <Text style={styles.actionButtonText}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => shareLink(link)}
        >
          <Text style={styles.actionButtonText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Link Generator</Text>
        <Text style={styles.headerSubtitle}>Create affiliate links for any product</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>🔍 Search Products</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for products to create affiliate links..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && (
              <ActivityIndicator
                style={styles.searchLoader}
                color="#007bff"
                size="small"
              />
            )}
          </View>

          {searchQuery.length > 0 && (
            <View style={styles.searchResults}>
              {searching ? (
                <LoadingState style={styles.searchLoading} />
              ) : searchResults.length > 0 ? (
                searchResults.map(renderProductItem)
              ) : (
                <Text style={styles.noResults}>No products found. Try a different search term.</Text>
              )}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => setSearchQuery('trending')}
            >
              <Text style={styles.quickActionIcon}>🔥</Text>
              <Text style={styles.quickActionText}>Trending Products</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => setSearchQuery('electronics')}
            >
              <Text style={styles.quickActionIcon}>📱</Text>
              <Text style={styles.quickActionText}>Electronics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => setSearchQuery('fashion')}
            >
              <Text style={styles.quickActionIcon}>👕</Text>
              <Text style={styles.quickActionText}>Fashion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => setSearchQuery('deals')}
            >
              <Text style={styles.quickActionIcon}>💰</Text>
              <Text style={styles.quickActionText}>Best Deals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Links */}
        <View style={styles.recentLinksSection}>
          <Text style={styles.sectionTitle}>📋 Recent Links</Text>
          {loading ? (
            <LoadingState style={styles.recentLoading} />
          ) : recentLinks.length > 0 ? (
            recentLinks.map(renderRecentLink)
          ) : (
            <EmptyState
              title="No Links Yet"
              description="Generate your first affiliate link by searching for products above"
              icon="🔗"
            />
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Link Generation Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🎯</Text>
            <Text style={styles.tipText}>
              Choose products that match your audience's interests for better conversion rates
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📱</Text>
            <Text style={styles.tipText}>
              Share links on multiple platforms - social media, blogs, live streams
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>📊</Text>
            <Text style={styles.tipText}>
              Track your link performance and focus on what works best
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>⏰</Text>
            <Text style={styles.tipText}>
              Generate links for trending and seasonal products for timely promotion
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  searchSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  searchLoader: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  searchResults: {
    marginTop: 16,
  },
  searchLoading: {
    height: 200,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 2,
  },
  productSeller: {
    fontSize: 12,
    color: '#666',
  },
  generateButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    paddingVertical: 32,
  },
  quickActionsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  quickAction: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    flex: 1,
    minWidth: '40%',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
  },
  recentLinksSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recentLoading: {
    height: 200,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  linkInfo: {
    flex: 1,
  },
  linkUrl: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  linkStats: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  linkStat: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
  },
  linkDate: {
    fontSize: 11,
    color: '#999',
  },
  linkActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 16,
  },
  tipsSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    marginBottom: 40,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
    lineHeight: 20,
  },
});