
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Package } from 'lucide-react';
import { useApi } from '@/hooks/use-api';

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
  const api = useApi();
  const { status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for session to be ready
    if (status !== 'authenticated') {
      return;
    }

    const fetchProducts = async () => {
      try {
        const response = await api.get('/products/top?limit=5&metric=orders');
        setProducts((response as any) || []);
      } catch (error) {
        console.error('Error fetching top products:', error);
        // Show empty array on error
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [api, status]);

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
