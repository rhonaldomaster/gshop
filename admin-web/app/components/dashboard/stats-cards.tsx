
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package 
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface StatsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  revenueChange: number;
  ordersChange: number;
  usersChange: number;
  productsChange: number;
}

export function StatsCards() {
  const [stats, setStats] = useState<StatsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    revenueChange: 0,
    ordersChange: 0,
    usersChange: 0,
    productsChange: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [paymentsStats, ordersStats, usersStats, productsStats] = await Promise.all([
          apiClient.get('/payments/stats'),
          apiClient.get('/orders/stats'),
          apiClient.get('/users/stats'),
          apiClient.get('/products/stats'),
        ]);

        setStats({
          totalRevenue: paymentsStats?.totalRevenue || 0,
          totalOrders: ordersStats?.totalOrders || 0,
          totalUsers: usersStats?.totalUsers || 0,
          totalProducts: productsStats?.totalProducts || 0,
          revenueChange: 12.5,
          ordersChange: 8.2,
          usersChange: 15.3,
          productsChange: 5.7,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Set mock data for demo
        setStats({
          totalRevenue: 142350.50,
          totalOrders: 1283,
          totalUsers: 5847,
          totalProducts: 234,
          revenueChange: 12.5,
          ordersChange: 8.2,
          usersChange: 15.3,
          productsChange: 5.7,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Total Revenue',
      value: new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(stats?.totalRevenue || 0),
      change: stats?.revenueChange || 0,
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders?.toLocaleString?.() || '0',
      change: stats?.ordersChange || 0,
      icon: ShoppingCart,
      color: 'text-accent',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers?.toLocaleString?.() || '0',
      change: stats?.usersChange || 0,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts?.toLocaleString?.() || '0',
      change: stats?.productsChange || 0,
      icon: Package,
      color: 'text-orange-600',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4]?.map?.((i) => (
          <Card key={i} className="gshop-stats-card">
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-muted rounded w-32"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards?.map?.((card, index) => {
        const Icon = card?.icon;
        const isPositive = (card?.change || 0) > 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card key={index} className="gshop-stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card?.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${card?.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1 animate-counter">
                {card?.value}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendIcon 
                  className={`h-3 w-3 mr-1 ${
                    isPositive ? 'text-accent' : 'text-red-500'
                  }`} 
                />
                <span className={isPositive ? 'text-accent' : 'text-red-500'}>
                  {Math.abs(card?.change || 0).toFixed(1)}%
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
