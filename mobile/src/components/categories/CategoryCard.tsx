import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GSText from '../ui/GSText';
import { useTheme } from '../../contexts/ThemeContext';
import { Category } from '../../services/products.service';

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
  variant?: 'grid' | 'list';
}

// Category icon mapping
const categoryIcons: Record<string, any> = {
  electronics: 'phone-portrait-outline',
  fashion: 'shirt-outline',
  'home & garden': 'home-outline',
  smartphones: 'phone-portrait',
  laptops: 'laptop-outline',
  "men's clothing": 'man-outline',
  "women's clothing": 'woman-outline',
};

export default function CategoryCard({ category, onPress, variant = 'grid' }: CategoryCardProps) {
  const { theme } = useTheme();

  const getCategoryIcon = (cat: Category): string => {
    const lowerName = cat.name.toLowerCase();
    return categoryIcons[lowerName] || categoryIcons[cat.slug] || 'albums-outline';
  };

  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const productCount = category.productCount || 0;

  if (variant === 'list') {
    return (
      <TouchableOpacity
        style={[styles.listCard, { backgroundColor: theme.colors.surface }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.listIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
          {category.image ? (
            <Image source={{ uri: category.image }} style={styles.listIcon} />
          ) : (
            <Ionicons name={getCategoryIcon(category)} size={32} color={theme.colors.primary} />
          )}
        </View>

        <View style={styles.listContent}>
          <GSText variant="h4" weight="semibold">{category.name}</GSText>
          {category.description && (
            <GSText variant="caption" color="textSecondary" numberOfLines={1}>
              {category.description}
            </GSText>
          )}
          <GSText variant="caption" color="textSecondary" style={styles.productCount}>
            {productCount} {productCount === 1 ? 'product' : 'products'}
            {hasSubcategories && ` • ${category.subcategories!.length} subcategories`}
          </GSText>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  // Grid variant (default)
  return (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.gridIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
        {category.image ? (
          <Image source={{ uri: category.image }} style={styles.gridIcon} />
        ) : (
          <Ionicons name={getCategoryIcon(category)} size={36} color={theme.colors.primary} />
        )}
      </View>

      <GSText variant="body" weight="semibold" style={styles.categoryName} numberOfLines={2}>
        {category.name}
      </GSText>

      <GSText variant="caption" color="textSecondary">
        {productCount} {productCount === 1 ? 'item' : 'items'}
      </GSText>

      {hasSubcategories && (
        <View style={styles.subcategoryBadge}>
          <Ionicons name="layers-outline" size={12} color={theme.colors.primary} />
          <GSText variant="caption" color="primary" style={styles.subcategoryText}>
            {category.subcategories!.length}
          </GSText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid variant styles
  gridCard: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  categoryName: {
    marginTop: 4,
    textAlign: 'center',
    minHeight: 36,
  },
  subcategoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  subcategoryText: {
    marginLeft: 2,
    fontSize: 10,
  },

  // List variant styles
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  listIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  listIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  listContent: {
    flex: 1,
  },
  productCount: {
    marginTop: 4,
  },
});
