'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { apiClient, formatCurrency } from '@/lib/api-client';

interface RevenueData {
  date: string;
  revenue: number;
}

export function RevenueChart() {
  const t = useTranslations('analytics');
  const [data, setData] = useState<RevenueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<RevenueData[]>(`/analytics/revenue?period=${period}`);
      setData(response || []);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      // Mock data for demo
      const mockData = Array.from({ length: 12 }, (_, i) => ({
        date: new Date(2025, i, 1).toISOString(),
        revenue: Math.random() * 10000000 + 5000000,
      }));
      setData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const averageRevenue = data.length > 0 ? totalRevenue / data.length : 0;
  const maxRevenue = Math.max(...data.map(d => d.revenue));

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('loadingRevenueData')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gshop-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('revenueTrends')}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-2xl font-bold">{formatCurrency(totalRevenue)}</span>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12.5%
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('week')}
            >
              {t('week')}
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('month')}
            >
              {t('month')}
            </Button>
            <Button
              variant={period === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('year')}
            >
              {t('year')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Simple bar chart visualization */}
        <div className="space-y-2">
          {data.map((item, index) => {
            const height = (item.revenue / maxRevenue) * 100;
            const monthName = new Date(item.date).toLocaleDateString('en', { month: 'short' });

            return (
              <div key={index} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-12">{monthName}</span>
                <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full flex items-center justify-end pr-2 transition-all"
                    style={{ width: `${height}%` }}
                  >
                    {height > 20 && (
                      <span className="text-xs font-medium text-white">
                        {formatCurrency(item.revenue)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">{t('total')}</p>
            <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('average')}</p>
            <p className="text-lg font-bold">{formatCurrency(averageRevenue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('peak')}</p>
            <p className="text-lg font-bold">{formatCurrency(maxRevenue)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
