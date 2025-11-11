'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { apiClient, formatCurrency } from '@/lib/api-client';

interface PaymentStatsData {
  totalRevenue: number;
  totalTransactions: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedAmount: number;
  averageTransactionValue: number;
}

export function PaymentStats() {
  const t = useTranslations('payments');
  const [stats, setStats] = useState<PaymentStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<PaymentStatsData>('/payments/stats');
      setStats(response);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      // Mock data for demo
      setStats({
        totalRevenue: 125000000,
        totalTransactions: 1250,
        successfulPayments: 1180,
        pendingPayments: 45,
        failedPayments: 25,
        refundedAmount: 2500000,
        averageTransactionValue: 100000,
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
      title: t('totalRevenue'),
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      description: t('totalPaymentVolume'),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('transactions'),
      value: stats?.totalTransactions?.toLocaleString() || '0',
      icon: CreditCard,
      description: `${stats?.successfulPayments} ${t('successful')}`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('avgTransaction'),
      value: formatCurrency(stats?.averageTransactionValue || 0),
      icon: TrendingUp,
      description: t('perTransaction'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: t('refunded'),
      value: formatCurrency(stats?.refundedAmount || 0),
      icon: AlertCircle,
      description: `${stats?.failedPayments} ${t('failedPayments')}`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
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
