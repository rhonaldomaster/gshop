import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { UsersTable } from '@/components/users/users-table';
import { UserStats } from '@/components/users/user-stats';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

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
          <Button className="gshop-button-primary" asChild>
            <Link href="/dashboard/users/create">
              <Plus className="mr-2 h-4 w-4" />
              {t('addUser')}
            </Link>
          </Button>
        </div>

        {/* User Statistics */}
        <UserStats />

        {/* Users Table */}
        <UsersTable />
      </div>
    </DashboardLayout>
  );
}
