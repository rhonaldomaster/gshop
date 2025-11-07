
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProductsTable } from '@/components/products/products-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Products - GSHOP Admin',
  description: 'Manage your product catalog',
};

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">
              Manage your product catalog and inventory
            </p>
          </div>
          <Button className="gshop-button-primary" asChild>
            <Link href="/dashboard/products/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>

        {/* Products Table */}
        <ProductsTable />
      </div>
    </DashboardLayout>
  );
}
