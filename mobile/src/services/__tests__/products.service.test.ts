import { productsService } from '../products.service';
import api from '../api';

jest.mock('../api');

describe('ProductsService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];

      (api.get as jest.Mock).mockResolvedValue({ data: mockProducts });

      const result = await productsService.getProducts();

      expect(api.get).toHaveBeenCalledWith('/products');
      expect(result).toEqual(mockProducts);
    });

    it('should handle errors when fetching products', async () => {
      const error = new Error('Network error');
      (api.get as jest.Mock).mockRejectedValue(error);

      await expect(productsService.getProducts()).rejects.toThrow('Network error');
    });

    it('should pass query parameters correctly', async () => {
      const params = { category: 'electronics', minPrice: 50 };
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      await productsService.getProducts(params);

      expect(api.get).toHaveBeenCalledWith('/products', { params });
    });
  });

  describe('getProductById', () => {
    it('should fetch a single product by ID', async () => {
      const mockProduct = { id: '1', name: 'Product 1', price: 100 };
      (api.get as jest.Mock).mockResolvedValue({ data: mockProduct });

      const result = await productsService.getProductById('1');

      expect(api.get).toHaveBeenCalledWith('/products/1');
      expect(result).toEqual(mockProduct);
    });

    it('should handle 404 errors for non-existent products', async () => {
      const error = { response: { status: 404 } };
      (api.get as jest.Mock).mockRejectedValue(error);

      await expect(productsService.getProductById('999')).rejects.toEqual(error);
    });
  });

  describe('searchProducts', () => {
    it('should search products with query', async () => {
      const mockResults = [{ id: '1', name: 'iPhone 14', price: 999 }];
      (api.get as jest.Mock).mockResolvedValue({ data: mockResults });

      const result = await productsService.searchProducts('iPhone');

      expect(api.get).toHaveBeenCalledWith('/products/search', {
        params: { q: 'iPhone' },
      });
      expect(result).toEqual(mockResults);
    });

    it('should handle empty search results', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [] });

      const result = await productsService.searchProducts('nonexistent');

      expect(result).toEqual([]);
    });
  });
});