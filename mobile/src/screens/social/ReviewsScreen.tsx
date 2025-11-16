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
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface Review {
  id: string;
  productId: string;
  product: {
    name: string;
    images: string[];
  };
  rating: number;
  comment: string;
  reviewImages?: string[];
  createdAt: string;
  user: {
    name: string;
    profileImage?: string;
  };
  helpful: number;
  isHelpful?: boolean;
}

export default function ReviewsScreen({ navigation, route }: any) {
  const { t } = useTranslation('translation');
  const { productId, mode = 'view' } = route.params || {};

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const url = productId
        ? `${process.env.API_BASE_URL}/reviews/product/${productId}`
        : `${process.env.API_BASE_URL}/reviews`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const submitReview = async () => {
    if (!newReview.comment.trim()) {
      Alert.alert(t('common.error'), t('reviews.pleaseWriteComment'));
      return;
    }

    try {
      const response = await fetch(`${process.env.API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: newReview.rating,
          comment: newReview.comment.trim(),
        }),
      });

      if (response.ok) {
        setShowWriteReview(false);
        setNewReview({ rating: 5, comment: '' });
        fetchReviews();
        Alert.alert(t('common.success'), t('reviews.reviewSubmitted'));
      } else {
        Alert.alert(t('common.error'), t('reviews.failedToSubmit'));
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      Alert.alert(t('common.error'), t('reviews.failedToSubmit'));
    }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      const response = await fetch(
        `${process.env.API_BASE_URL}/reviews/${reviewId}/helpful`,
        { method: 'POST' }
      );

      if (response.ok) {
        setReviews(prev => prev.map(review =>
          review.id === reviewId
            ? {
                ...review,
                helpful: review.helpful + (review.isHelpful ? -1 : 1),
                isHelpful: !review.isHelpful
              }
            : review
        ));
      }
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const renderStars = (rating: number, size = 16, interactive = false, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && onPress ? onPress(star) : null}
            disabled={!interactive}
          >
            <MaterialIcons
              name={star <= rating ? "star" : "star-border"}
              size={size}
              color={star <= rating ? "#fbbf24" : "#d1d5db"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReview = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {item.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <View style={styles.ratingRow}>
              {renderStars(item.rating)}
              <Text style={styles.reviewDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {item.product && (
        <TouchableOpacity
          style={styles.productInfo}
          onPress={() => navigation.navigate('ProductDetail', { productId: item.productId })}
        >
          <Image
            source={{ uri: item.product.images[0] || 'https://via.placeholder.com/40x40' }}
            style={styles.productThumb}
          />
          <Text style={styles.productName} numberOfLines={1}>
            {item.product.name}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.reviewComment}>{item.comment}</Text>

      {item.reviewImages && item.reviewImages.length > 0 && (
        <View style={styles.reviewImages}>
          {item.reviewImages.map((imageUri, index) => (
            <Image
              key={index}
              source={{ uri: imageUri }}
              style={styles.reviewImage}
            />
          ))}
        </View>
      )}

      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={[styles.helpfulButton, item.isHelpful && styles.helpfulActive]}
          onPress={() => markHelpful(item.id)}
        >
          <MaterialIcons
            name={item.isHelpful ? "thumb-up" : "thumb-up-off-alt"}
            size={16}
            color={item.isHelpful ? "#8b5cf6" : "#6b7280"}
          />
          <Text style={[styles.helpfulText, item.isHelpful && styles.helpfulActiveText]}>
            {t('reviews.helpful')} ({item.helpful})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="rate-review" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>{t('reviews.noReviewsYet')}</Text>
      <Text style={styles.emptySubtitle}>
        {productId ? t('reviews.beTheFirst') : t('reviews.noReviewsToDisplay')}
      </Text>
      {productId && (
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={() => setShowWriteReview(true)}
        >
          <Text style={styles.writeReviewButtonText}>{t('reviews.writeReview')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderWriteReviewModal = () => (
    <Modal
      visible={showWriteReview}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowWriteReview(false)}>
            <MaterialIcons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{t('reviews.writeReview')}</Text>
          <TouchableOpacity onPress={submitReview}>
            <Text style={styles.submitButton}>{t('reviews.submit')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.ratingLabel}>{t('reviews.yourRating')}</Text>
          {renderStars(newReview.rating, 32, true, (rating) =>
            setNewReview(prev => ({ ...prev, rating }))
          )}

          <Text style={styles.commentLabel}>{t('reviews.yourReview')}</Text>
          <TextInput
            style={styles.commentInput}
            value={newReview.comment}
            onChangeText={(text) => setNewReview(prev => ({ ...prev, comment: text }))}
            placeholder={t('reviews.sharePlaceholder')}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {newReview.comment.length}/500 {t('reviews.characters')}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>{t('reviews.loadingReviews')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {productId ? t('reviews.productReviews') : t('reviews.allReviews')}
        </Text>
        <View style={styles.headerRight}>
          <Text style={styles.reviewCount}>{reviews.length} {t('reviews.reviewsCount')}</Text>
          {productId && (
            <TouchableOpacity
              style={styles.writeButton}
              onPress={() => setShowWriteReview(true)}
            >
              <MaterialIcons name="edit" size={20} color="#8b5cf6" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {renderWriteReviewModal()}
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  writeButton: {
    padding: 4,
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
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  productThumb: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 8,
  },
  productName: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewImages: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  reviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  reviewActions: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
  },
  helpfulActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  helpfulText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  helpfulActiveText: {
    color: '#8b5cf6',
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
  writeReviewButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  writeReviewButtonText: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  submitButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  modalContent: {
    padding: 16,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    height: 120,
    fontSize: 14,
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
});