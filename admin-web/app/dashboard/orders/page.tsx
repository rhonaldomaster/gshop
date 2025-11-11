import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { OrdersTable } from '@/components/orders/orders-table';

export const metadata = {
  title: 'Orders - GSHOP Admin',
  description: 'Manage customer orders and shipments',
};

export default function OrdersPage() {
  const t = useTranslations('orders');

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

        {/* Orders Table */}
        <OrdersTable />
      </div>
    </DashboardLayout>
  );
}
