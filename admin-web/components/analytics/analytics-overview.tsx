'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  CreditCard,
} from 'lucide-react';
import { apiClient, formatCurrency } from '@/lib/api-client';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  averageOrderValue: number;
  conversionRate: number;
}

export function AnalyticsOverview() {
  const t = useTranslations('analytics');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<AnalyticsData>('/analytics/overview');
      setData(response);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="gshop-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="animate-pulse space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-32"></div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: t('totalRevenue'),
      value: formatCurrency(data?.totalRevenue || 0),
      icon: DollarSign,
      description: t('totalSalesRevenue'),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('totalOrders'),
      value: data?.totalOrders?.toLocaleString() || '0',
      icon: ShoppingCart,
      description: t('allTimeOrders'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('totalUsers'),
      value: data?.totalUsers?.toLocaleString() || '0',
      icon: Users,
      description: t('registeredUsers'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: t('products'),
      value: data?.totalProducts?.toLocaleString() || '0',
      icon: Package,
      description: t('activeProducts'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: t('avgOrderValue'),
      value: formatCurrency(data?.averageOrderValue || 0),
      icon: CreditCard,
      description: t('perTransaction'),
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: t('conversionRate'),
      value: `${data?.conversionRate?.toFixed(1) || '0'}%`,
      icon: TrendingUp,
      description: t('visitorToCustomer'),
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index} className="gshop-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
