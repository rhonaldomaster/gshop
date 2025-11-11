import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UsersTable } from '@/components/users/users-table';
import { UserStats } from '@/components/users/user-stats';

export const metadata = {
  title: 'Users - GSHOP Admin',
  description: 'Manage users, sellers, and affiliates',
};

export default function UsersPage() {
  const t = useTranslations('users');

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

        {/* User Statistics */}
        <UserStats />

        {/* Users Table */}
        <UsersTable />
      </div>
    </DashboardLayout>
  );
}
