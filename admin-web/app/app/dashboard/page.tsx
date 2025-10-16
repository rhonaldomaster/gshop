
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentOrders } from '@/components/dashboard/recent-orders';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { TopProducts } from '@/components/dashboard/top-products';

export const metadata = {
  title: 'Panel de Control - GSHOP Admin',
  description: 'Resumen del rendimiento de tu plataforma de e-commerce',
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('welcome')}
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Charts and Tables */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <SalesChart />
          <TopProducts />
        </div>

        {/* Recent Orders */}
        <RecentOrders />
      </div>
    </DashboardLayout>
  );
}
