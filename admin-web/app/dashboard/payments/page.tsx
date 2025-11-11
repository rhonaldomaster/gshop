import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PaymentsTable } from '@/components/payments/payments-table';
import { PaymentStats } from '@/components/payments/payment-stats';
import { WithdrawalsTable } from '@/components/payments/withdrawals-table';

export const metadata = {
  title: 'Payments - GSHOP Admin',
  description: 'Manage payments, refunds, and withdrawals',
};

export default function PaymentsPage() {
  const t = useTranslations('payments');

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

        {/* Payment Statistics */}
        <PaymentStats />

        {/* Payments Table */}
        <PaymentsTable />

        {/* Seller Withdrawals */}
        <WithdrawalsTable />
      </div>
    </DashboardLayout>
  );
}
