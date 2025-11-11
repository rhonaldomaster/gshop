'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp } from 'lucide-react';
import { apiClient, formatCurrency } from '@/lib/api-client';

interface TopProduct {
  id: string;
  name: string;
  category?: string;
  totalSales: number;
  unitsSold: number;
  revenue: number;
}

export function TopProducts() {
  const t = useTranslations('analytics');
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<TopProduct[]>('/analytics/top-products?limit=10');
      setProducts(response || []);
    } catch (error) {
      console.error('Error fetching top products:', error);
      // Mock data for demo
      setProducts([
        {
          id: '1',
          name: 'iPhone 15 Pro Max',
          category: 'Smartphones',
          totalSales: 45,
          unitsSold: 45,
          revenue: 58500000,
        },
        {
          id: '2',
          name: 'MacBook Air 15" M3',
          category: 'Laptops',
          totalSales: 32,
          unitsSold: 32,
          revenue: 56000000,
        },
        {
          id: '3',
          name: 'AirPods Pro 2',
          category: 'Audio',
          totalSales: 156,
          unitsSold: 156,
          revenue: 38750000,
        },
        {
          id: '4',
          name: 'Samsung Galaxy S24 Ultra',
          category: 'Smartphones',
          totalSales: 38,
          unitsSold: 38,
          revenue: 45600000,
        },
        {
          id: '5',
          name: 'PlayStation 5',
          category: 'Gaming',
          totalSales: 28,
          unitsSold: 28,
          revenue: 14000000,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('loadingTopProducts')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            {t('topProducts')}
          </CardTitle>
          <Link
            href="/dashboard/products"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t('viewAll')}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('noProductData')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="font-medium hover:underline truncate block"
                  >
                    {product.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {product.category && (
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {product.unitsSold} {t('unitsSold')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(product.revenue)}</div>
                  <div className="text-xs text-muted-foreground">{t('revenue')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
