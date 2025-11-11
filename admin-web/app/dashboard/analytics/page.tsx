import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AnalyticsOverview } from '@/components/analytics/analytics-overview';
import { RevenueChart } from '@/components/analytics/revenue-chart';
import { TopProducts } from '@/components/analytics/top-products';
import { TopSellers } from '@/components/analytics/top-sellers';

export const metadata = {
  title: 'Analytics - GSHOP Admin',
  description: 'View platform analytics and insights',
};

export default function AnalyticsPage() {
  const t = useTranslations('analytics');

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

        {/* Overview Metrics */}
        <AnalyticsOverview />

        {/* Revenue Chart */}
        <RevenueChart />

        {/* Top Products & Sellers */}
        <div className="grid gap-6 md:grid-cols-2">
          <TopProducts />
          <TopSellers />
        </div>
      </div>
    </DashboardLayout>
  );
}
