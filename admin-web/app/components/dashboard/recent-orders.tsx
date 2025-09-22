
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye, ShoppingCart } from 'lucide-react';
import { apiClient, formatCurrency, formatDate, getStatusColor } from '@/lib/api-client';

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await apiClient.get<{ data: Order[] }>('/orders?limit=5&sortBy=createdAt&sortOrder=DESC');
        setOrders(response?.data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Mock data for demo
        setOrders([
          {
            id: '1',
            orderNumber: 'GSH202412001',
            user: {
              firstName: 'Carlos',
              lastName: 'Martinez',
              email: 'carlos@example.com'
            },
            status: 'confirmed',
            totalAmount: 89999.99,
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            orderNumber: 'GSH202412002',
            user: {
              firstName: 'Ana',
              lastName: 'Rodriguez',
              email: 'ana@example.com'
            },
            status: 'shipped',
            totalAmount: 156750.00,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
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
        <CardTitle>Recent Orders</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/orders">
            View All
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {orders?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No orders found</p>
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
                      {order?.status?.charAt?.(0)?.toUpperCase?.() + order?.status?.slice?.(1)}
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
