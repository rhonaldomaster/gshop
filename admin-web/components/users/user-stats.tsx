'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  UserCheck,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface UserStatsData {
  totalUsers: number;
  activeUsers: number;
  totalSellers: number;
  totalAffiliates: number;
  totalCustomers: number;
  newUsersThisMonth: number;
}

export function UserStats() {
  const t = useTranslations('users');
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<UserStatsData>('/users/stats');
      setStats(response);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Mock data for demo
      setStats({
        totalUsers: 1250,
        activeUsers: 1180,
        totalSellers: 45,
        totalAffiliates: 78,
        totalCustomers: 1127,
        newUsersThisMonth: 156,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
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

  const statCards = [
    {
      title: t('totalUsers'),
      value: stats?.totalUsers?.toLocaleString() || '0',
      icon: Users,
      description: `${stats?.activeUsers} ${t('active')}`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('sellers'),
      value: stats?.totalSellers?.toLocaleString() || '0',
      icon: ShoppingBag,
      description: t('activeSellers'),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('affiliates'),
      value: stats?.totalAffiliates?.toLocaleString() || '0',
      icon: TrendingUp,
      description: t('marketingPartners'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: t('customers'),
      value: stats?.totalCustomers?.toLocaleString() || '0',
      icon: UserCheck,
      description: `${stats?.newUsersThisMonth} ${t('thisMonth')}`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
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
