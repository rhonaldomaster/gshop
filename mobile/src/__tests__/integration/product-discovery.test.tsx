import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../../screens/home/HomeScreen';
import ProductDetailScreen from '../../screens/products/ProductDetailScreen';
import { productsService } from '../../services/products.service';

jest.mock('../../services/products.service');

const mockProducts = [
  {
    id: '1',
    name: 'iPhone 14',
    price: 999,
    category: 'Electronics',
    image: 'iphone.jpg',
    rating: 4.5,
  },
  {
    id: '2',
    name: 'AirPods Pro',
    price: 249,
    category: 'Electronics',
    image: 'airpods.jpg',
    rating: 4.8,
  },
];

describe('Product Discovery Flow', () => {
  beforeEach(() => {
    (productsService.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    (productsService.searchProducts as jest.Mock).mockResolvedValue(mockProducts);
  });

  it('should load and display products on home screen', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText('iPhone 14')).toBeTruthy();
      expect(getByText('AirPods Pro')).toBeTruthy();
    });
  });

  it('should filter products by category', async () => {
    const electronicsOnly = [mockProducts[0]];
    (productsService.getProducts as jest.Mock).mockResolvedValue(electronicsOnly);

    const { getByText, queryByText } = render(
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>
    );

    // Select Electronics filter
    const electronicsFilter = getByText('Electronics');
    fireEvent.press(electronicsFilter);

    await waitFor(() => {
      expect(getByText('iPhone 14')).toBeTruthy();
      expect(queryByText('AirPods Pro')).toBeNull();
    });
  });

  it('should search products', async () => {
    const searchResults = [mockProducts[0]];
    (productsService.searchProducts as jest.Mock).mockResolvedValue(searchResults);

    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>
    );

    const searchInput = getByPlaceholderText('Search products...');
    fireEvent.changeText(searchInput, 'iPhone');

    await waitFor(() => {
      expect(productsService.searchProducts).toHaveBeenCalledWith('iPhone');
      expect(getByText('iPhone 14')).toBeTruthy();
    });
  });

  it('should navigate to product detail', async () => {
    const navigate = jest.fn();

    const { getByText } = render(
      <NavigationContainer>
        <HomeScreen navigation={{ navigate }} />
      </NavigationContainer>
    );

    await waitFor(() => {
      expect(getByText('iPhone 14')).toBeTruthy();
    });

    fireEvent.press(getByText('iPhone 14'));

    expect(navigate).toHaveBeenCalledWith('ProductDetail', {
      productId: '1',
    });
  });

  it('should handle empty search results', async () => {
    (productsService.searchProducts as jest.Mock).mockResolvedValue([]);

    const { getByPlaceholderText, getByText } = render(
      <NavigationContainer>
        <HomeScreen />
      </NavigationContainer>
    );

    const searchInput = getByPlaceholderText('Search products...');
    fireEvent.changeText(searchInput, 'NonexistentProduct');

    await waitFor(() => {
      expect(getByText('No products found')).toBeTruthy();
    });
  });
});