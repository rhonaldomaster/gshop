
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Package } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  images?: string[];
  ordersCount: number;
  viewsCount: number;
  rating: number;
}

export function TopProducts() {
  const t = useTranslations('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get<{ data: Product[] }>('/products?limit=5&sortBy=ordersCount&sortOrder=DESC');
        setProducts(response?.data || []);
      } catch (error) {
        console.error('Error fetching top products:', error);
        // Mock data for demo
        setProducts([
          {
            id: '1',
            name: 'iPhone 15 Pro Max',
            images: ['/api/placeholder/80/80'],
            ordersCount: 142,
            viewsCount: 2847,
            rating: 4.8,
          },
          {
            id: '2',
            name: 'MacBook Air M3',
            images: ['/api/placeholder/80/80'],
            ordersCount: 89,
            viewsCount: 1923,
            rating: 4.9,
          },
          {
            id: '3',
            name: 'Premium Cotton T-Shirt',
            images: ['/api/placeholder/80/80'],
            ordersCount: 234,
            viewsCount: 5641,
            rating: 4.6,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('topProducts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3]?.map?.((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gshop-card">
      <CardHeader>
        <CardTitle>{t('topProducts')}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('topProductsDescription')}
        </p>
      </CardHeader>
      <CardContent>
        {products?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noProductsFound')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products?.map?.((product, index) => (
              <div key={product?.id} className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="relative">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {product?.images?.[0] ? (
                      <img 
                        src={product?.images?.[0]} 
                        alt={product?.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1 line-clamp-1">
                    {product?.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {product?.ordersCount} {t('orders')}
                    </div>
                    <span>•</span>
                    <div>{product?.viewsCount?.toLocaleString?.()} {t('views')}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">
                    {product?.rating?.toFixed?.(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
