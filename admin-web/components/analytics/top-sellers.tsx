'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, TrendingUp, Star } from 'lucide-react';
import { apiClient, formatCurrency } from '@/lib/api-client';

interface TopSeller {
  id: string;
  businessName: string;
  email: string;
  totalOrders: number;
  totalRevenue: number;
  averageRating?: number;
  productsCount?: number;
}

export function TopSellers() {
  const t = useTranslations('analytics');
  const [sellers, setSellers] = useState<TopSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTopSellers();
  }, []);

  const fetchTopSellers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<any[]>('/analytics/seller-performance?limit=10');
      // Map backend response to frontend interface
      const mappedSellers: TopSeller[] = response?.map(item => ({
        id: item.id,
        businessName: item.businessName || 'Unknown Seller',
        email: item.email || '',
        totalOrders: 0, // Not available in current endpoint
        totalRevenue: item.totalEarnings || 0,
        averageRating: item.averageRating,
        productsCount: item.productCount || 0,
      })) || [];
      setSellers(mappedSellers);
    } catch (error) {
      console.error('Error fetching top sellers:', error);
      setSellers([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('loadingTopSellers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            {t('topSellers')}
          </CardTitle>
          <Link
            href="/dashboard/sellers"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t('viewAll')}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {sellers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('noSellerData')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sellers.map((seller, index) => (
              <div key={seller.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/sellers/${seller.id}`}
                    className="font-medium hover:underline truncate block"
                  >
                    {seller.businessName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {seller.totalOrders} {t('orders')}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {seller.productsCount} {t('products')}
                    </span>
                    {seller.averageRating && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{seller.averageRating}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(seller.totalRevenue)}</div>
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
