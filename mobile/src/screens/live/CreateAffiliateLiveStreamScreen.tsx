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
import { api } from '../../services/api';
import { liveService } from '../../services/live.service';

interface Seller {
  id: string;
  businessName: string;
  storeName?: string;
  logo?: string;
  productCount?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
  sellerId: string;
}

export default function CreateAffiliateLiveStreamScreen({ navigation }: any) {
  const { t } = useTranslation('translation');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Step management
  const [currentStep, setCurrentStep] = useState<'seller' | 'products' | 'info'>('seller');

  // Sellers
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [loadingSellers, setLoadingSellers] = useState(true);
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    fetchAvailableSellers();
  }, []);

  const fetchAvailableSellers = async () => {
    try {
      setLoadingSellers(true);
      const response = await api.get('/sellers/active');
      if (response.data) {
        setSellers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
      Alert.alert(t('common.error'), t('live.affiliate.failedLoadSellers'));
    } finally {
      setLoadingSellers(false);
    }
  };

  const fetchSellerProducts = async (sellerId: string) => {
    try {
      setLoadingProducts(true);
      const response = await api.get(`/products?sellerId=${sellerId}&limit=50`);
      if (response.data) {
        setProducts(response.data.products || response.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      Alert.alert(t('common.error'), t('live.affiliate.failedLoadProducts'));
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSelectSeller = async (seller: Seller) => {
    setSelectedSeller(seller);
    setSelectedProducts(new Set());
    await fetchSellerProducts(seller.id);
    setCurrentStep('products');
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

  const handleContinueToInfo = () => {
    if (selectedProducts.size === 0) {
      Alert.alert(t('common.error'), t('live.selectAtLeastOneProduct'));
      return;
    }
    setCurrentStep('info');
  };

  const handleCreateStream = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('live.titleRequired'));
      return;
    }

    if (!selectedSeller) {
      Alert.alert(t('common.error'), t('live.affiliate.selectSeller'));
      return;
    }

    if (selectedProducts.size === 0) {
      Alert.alert(t('common.error'), t('live.selectAtLeastOneProduct'));
      return;
    }

    setLoading(true);

    try {
      const stream = await liveService.createAffiliateStream({
        title: title.trim(),
        description: description.trim(),
        sellerId: selectedSeller.id,
      });

      // Navigate to method selector
      navigation.replace('GoLive', {
        streamId: stream.id,
        hostType: 'affiliate',
      });
    } catch (error) {
      console.error('Error creating stream:', error);
      Alert.alert(t('common.error'), t('live.failedToCreateStream'));
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.businessName?.toLowerCase().includes(sellerSearchQuery.toLowerCase()) ||
    seller.storeName?.toLowerCase().includes(sellerSearchQuery.toLowerCase())
  );

  const renderSeller = ({ item }: { item: Seller }) => {
    const isSelected = selectedSeller?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.sellerItem, isSelected && styles.sellerItemSelected]}
        onPress={() => handleSelectSeller(item)}
      >
        <View style={styles.sellerIcon}>
          <MaterialIcons name="store" size={24} color={isSelected ? "#8b5cf6" : "#6b7280"} />
        </View>
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{item.storeName || item.businessName}</Text>
          {item.productCount !== undefined && (
            <Text style={styles.sellerProducts}>
              {t('live.productCount', { count: item.productCount })}
            </Text>
          )}
        </View>
        <MaterialIcons
          name={isSelected ? "check-circle" : "chevron-right"}
          size={24}
          color={isSelected ? "#8b5cf6" : "#9ca3af"}
        />
      </TouchableOpacity>
    );
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

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.step, currentStep === 'seller' && styles.stepActive]}>
        <Text style={[styles.stepNumber, currentStep === 'seller' && styles.stepNumberActive]}>1</Text>
        <Text style={[styles.stepLabel, currentStep === 'seller' && styles.stepLabelActive]}>
          {t('live.affiliate.selectSellerStep')}
        </Text>
      </View>
      <View style={styles.stepLine} />
      <View style={[styles.step, currentStep === 'products' && styles.stepActive]}>
        <Text style={[styles.stepNumber, currentStep === 'products' && styles.stepNumberActive]}>2</Text>
        <Text style={[styles.stepLabel, currentStep === 'products' && styles.stepLabelActive]}>
          {t('live.products')}
        </Text>
      </View>
      <View style={styles.stepLine} />
      <View style={[styles.step, currentStep === 'info' && styles.stepActive]}>
        <Text style={[styles.stepNumber, currentStep === 'info' && styles.stepNumberActive]}>3</Text>
        <Text style={[styles.stepLabel, currentStep === 'info' && styles.stepLabelActive]}>
          {t('live.affiliate.streamInfo')}
        </Text>
      </View>
    </View>
  );

  const renderSellerStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>{t('live.affiliate.chooseSeller')}</Text>
      <Text style={styles.sectionSubtitle}>{t('live.affiliate.chooseSellerDesc')}</Text>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          value={sellerSearchQuery}
          onChangeText={setSellerSearchQuery}
          placeholder={t('live.affiliate.searchSellers')}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {loadingSellers ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : filteredSellers.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="store" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>{t('live.affiliate.noSellersFound')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSellers}
          renderItem={renderSeller}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderProductsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.selectedSellerBanner}>
        <MaterialIcons name="store" size={20} color="#8b5cf6" />
        <Text style={styles.selectedSellerText}>
          {selectedSeller?.storeName || selectedSeller?.businessName}
        </Text>
        <TouchableOpacity onPress={() => setCurrentStep('seller')}>
          <Text style={styles.changeText}>{t('common.edit')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t('live.selectProducts')}</Text>
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
  );

  const renderInfoStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.selectedSellerBanner}>
        <MaterialIcons name="store" size={20} color="#8b5cf6" />
        <Text style={styles.selectedSellerText}>
          {selectedSeller?.storeName || selectedSeller?.businessName}
        </Text>
        <Text style={styles.productCountBadge}>
          {selectedProducts.size} {t('live.products').toLowerCase()}
        </Text>
      </View>

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

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>{t('live.affiliate.tipsTitle')}</Text>
        <View style={styles.tipRow}>
          <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
          <Text style={styles.tipText}>{t('live.affiliate.tip1')}</Text>
        </View>
        <View style={styles.tipRow}>
          <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
          <Text style={styles.tipText}>{t('live.affiliate.tip2')}</Text>
        </View>
        <View style={styles.tipRow}>
          <MaterialIcons name="lightbulb" size={20} color="#f59e0b" />
          <Text style={styles.tipText}>{t('live.affiliate.tip3')}</Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (currentStep === 'seller') {
      return null;
    }

    if (currentStep === 'products') {
      return (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep('seller')}
          >
            <MaterialIcons name="arrow-back" size={24} color="#6b7280" />
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.nextButton,
              selectedProducts.size === 0 && styles.buttonDisabled
            ]}
            onPress={handleContinueToInfo}
            disabled={selectedProducts.size === 0}
          >
            <Text style={styles.nextButtonText}>{t('common.next')}</Text>
            <MaterialIcons name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentStep('products')}
        >
          <MaterialIcons name="arrow-back" size={24} color="#6b7280" />
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!title.trim() || loading) && styles.buttonDisabled
          ]}
          onPress={handleCreateStream}
          disabled={!title.trim() || loading}
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
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('live.affiliate.createStream')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 'seller' && renderSellerStep()}
        {currentStep === 'products' && renderProductsStep()}
        {currentStep === 'info' && renderInfoStep()}
      </ScrollView>

      {renderFooter()}
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f9fafb',
  },
  step: {
    alignItems: 'center',
  },
  stepActive: {},
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '600',
  },
  stepNumberActive: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  stepLabelActive: {
    color: '#8b5cf6',
    fontWeight: '500',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#111827',
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
  sellerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
  },
  sellerItemSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  sellerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  sellerProducts: {
    fontSize: 13,
    color: '#6b7280',
  },
  selectedSellerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedSellerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b21a8',
    marginLeft: 8,
  },
  changeText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  productCountBadge: {
    fontSize: 12,
    color: '#8b5cf6',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
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
  tipsSection: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#78350f',
    marginLeft: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
});
