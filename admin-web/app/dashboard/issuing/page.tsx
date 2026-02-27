'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CreditCard, ArrowLeftRight, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { CardholdersTable } from '@/components/issuing/cardholders-table';
import { CardsTable } from '@/components/issuing/cards-table';
import { TransactionsTable } from '@/components/issuing/transactions-table';

interface IssuingStats {
  totalCardholders: number;
  activeCardholders: number;
  pendingCardholders: number;
  totalCards: number;
  activeCards: number;
  totalTransactions: number;
  totalTransactionAmount: number;
}

export default function IssuingPage() {
  const t = useTranslations('issuing');
  const [stats, setStats] = useState<IssuingStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await apiClient.get<IssuingStats>('/admin/issuing/stats');
      setStats(response);
    } catch (error) {
      console.error('Error fetching issuing stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('description')}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="gshop-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalCardholders')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalCardholders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activeCardholders || 0} {t('stats.active')} / {stats?.pendingCardholders || 0} {t('stats.pending')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="gshop-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.activeCards')}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.activeCards || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalCards || 0} {t('stats.totalCards')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="gshop-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalTransactions')}</CardTitle>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    ${(stats?.totalTransactionAmount || 0).toFixed(2)} USD {t('stats.totalVolume')}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cardholders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cardholders">
              <Users className="h-4 w-4 mr-2" />
              {t('tabs.cardholders')}
            </TabsTrigger>
            <TabsTrigger value="cards">
              <CreditCard className="h-4 w-4 mr-2" />
              {t('tabs.cards')}
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              {t('tabs.transactions')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cardholders">
            <CardholdersTable />
          </TabsContent>

          <TabsContent value="cards">
            <CardsTable />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
