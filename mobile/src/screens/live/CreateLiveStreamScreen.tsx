import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { liveService } from '../../services/live.service';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
}

export default function CreateLiveStreamScreen({ navigation }: any) {
  const { t } = useTranslation('translation');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetchSellerProducts();
  }, []);

  const fetchSellerProducts = async () => {
    try {
      // In a real app, fetch from API with seller token
      const response = await fetch(`${process.env.API_BASE_URL}/products/my-products`, {
        headers: {
          // Add auth token here
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleCreateStream = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('live.titleRequired'));
      return;
    }

    if (selectedProducts.size === 0) {
      Alert.alert(t('common.error'), t('live.selectAtLeastOneProduct'));
      return;
    }

    setLoading(true);

    try {
      const stream = await liveService.createSellerStream({
        title: title.trim(),
        description: description.trim(),
      });

      // Add selected products to the stream
      const productIds = Array.from(selectedProducts);
      await liveService.addProductsToStream(stream.id, productIds);

      // Navigate to method selector
      navigation.replace('GoLive', {
        streamId: stream.id,
        hostType: 'seller',
      });
    } catch (error) {
      console.error('Error creating stream:', error);
      Alert.alert(t('common.error'), t('live.failedToCreateStream'));
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const isSelected = selectedProducts.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.productItem, isSelected && styles.productItemSelected]}
        onPress={() => toggleProductSelection(item.id)}
      >
        <View style={styles.productInfo}>
          <MaterialIcons
            name={isSelected ? "check-box" : "check-box-outline-blank"}
            size={24}
            color={isSelected ? "#8b5cf6" : "#9ca3af"}
          />
          <View style={styles.productDetails}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productPrice}>
              ${item.price.toLocaleString()}
            </Text>
          </View>
        </View>
        <Text style={styles.productStock}>
          {t('products.stock')}: {item.stock}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('live.createLiveStream')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stream Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('live.streamInformation')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('live.title')} *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={t('live.titlePlaceholder')}
              maxLength={100}
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('live.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('live.descriptionPlaceholder')}
              maxLength={500}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('live.selectProducts')} *</Text>
          <Text style={styles.sectionSubtitle}>
            {t('live.selectedCount', { count: selectedProducts.size })}
          </Text>

          {loadingProducts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8b5cf6" />
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="inventory-2" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>{t('live.noProductsAvailable')}</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipRow}>
            <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
            <Text style={styles.tipText}>{t('live.tip1')}</Text>
          </View>
          <View style={styles.tipRow}>
            <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
            <Text style={styles.tipText}>{t('live.tip2')}</Text>
          </View>
          <View style={styles.tipRow}>
            <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
            <Text style={styles.tipText}>{t('live.tip3')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!title.trim() || selectedProducts.size === 0 || loading) && styles.createButtonDisabled
          ]}
          onPress={handleCreateStream}
          disabled={!title.trim() || selectedProducts.size === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialIcons name="videocam" size={24} color="white" />
              <Text style={styles.createButtonText}>{t('live.goLive')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 10,
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  productItemSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productDetails: {
    marginLeft: 12,
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  productStock: {
    fontSize: 12,
    color: '#6b7280',
  },
  tipsSection: {
    padding: 16,
    backgroundColor: '#fffbeb',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#78350f',
    marginLeft: 8,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
