
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye, ShoppingCart } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/api-client';
import { useApi } from '@/hooks/use-api';

interface Order {
  id: string;
  orderNumber: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  totalAmount: number;
  createdAt: string;
}

export function RecentOrders() {
  const t = useTranslations('dashboard');
  const tOrders = useTranslations('orders');
  const api = useApi();
  const { status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for session to be ready
    if (status !== 'authenticated') {
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await api.get<{ data: Order[] }>('/orders?limit=5&sortBy=createdAt&sortOrder=DESC');
        setOrders(response?.data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Show empty array on error
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [api, status]);

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('recentOrders')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3]?.map?.((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-48"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gshop-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('recentOrders')}</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/orders">
            {t('viewAll')}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {orders?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noOrdersFound')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map?.((order) => (
              <div key={order?.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium">
                      {order?.orderNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(order?.status)}`}
                    >
                      {tOrders(order?.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order?.user?.firstName} {order?.user?.lastName} • {order?.user?.email}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(order?.createdAt)}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(order?.totalAmount)}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/orders/${order?.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
