import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CategoriesTable } from '@/components/categories/categories-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Categories - GSHOP Admin',
  description: 'Manage product categories and subcategories',
};

export default function CategoriesPage() {
  const t = useTranslations('categories');

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
            <Link href="/dashboard/categories/create">
              <Plus className="mr-2 h-4 w-4" />
              {t('addCategory')}
            </Link>
          </Button>
        </div>

        {/* Categories Table */}
        <CategoriesTable />
      </div>
    </DashboardLayout>
  );
}
