'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Eye,
  Package,
  Truck,
  XCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import { apiClient, formatCurrency, formatDate } from '@/lib/api-client';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    images?: string[];
  };
  quantity: number;
  price: number;
  vatType?: string;
  basePrice?: number;
  vatAmountPerUnit?: number;
  totalBasePrice?: number;
  totalVatAmount?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  shippingType?: string;
  shippingCost?: number;
  shippingTrackingNumber?: string;
  shippingTrackingUrl?: string;
  vatBreakdown?: {
    excluido?: { base: number; vat: number; total: number };
    exento?: { base: number; vat: number; total: number };
    reducido?: { base: number; vat: number; total: number };
    general?: { base: number; vat: number; total: number };
  };
  liveSessionId?: string;
  affiliateId?: string;
  commissionRate?: number;
  commissionAmount?: number;
  createdAt: string;
  updatedAt: string;
}

const getOrderStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    in_transit: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    return_requested: 'bg-orange-100 text-orange-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getPaymentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getOrderStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'confirmed':
    case 'processing':
      return <RefreshCw className="h-4 w-4" />;
    case 'in_transit':
    case 'shipped':
      return <Truck className="h-4 w-4" />;
    case 'delivered':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
    case 'refunded':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

export function OrdersTable() {
  const t = useTranslations('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, statusFilter, currentPage]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await apiClient.get<{ data: Order[] }>(`/orders?${params}`);
      setOrders(response?.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Mock data for demo
      setOrders([
        {
          id: '1',
          orderNumber: 'ORD-2025-001',
          user: {
            id: 'u1',
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan.perez@example.com',
          },
          items: [
            {
              id: 'i1',
              product: {
                id: 'p1',
                name: 'iPhone 15 Pro Max',
                images: [],
              },
              quantity: 1,
              price: 1299999.99,
              vatType: 'general',
              basePrice: 1092436.97,
              vatAmountPerUnit: 207563.02,
              totalBasePrice: 1092436.97,
              totalVatAmount: 207563.02,
            },
          ],
          totalAmount: 1299999.99,
          status: 'delivered',
          paymentStatus: 'paid',
          shippingType: 'national',
          shippingCost: 15000,
          shippingAddress: {
            street: 'Calle 123 #45-67',
            city: 'Bogotá',
            state: 'Cundinamarca',
            postalCode: '110111',
            country: 'Colombia',
          },
          vatBreakdown: {
            general: {
              base: 1092436.97,
              vat: 207563.02,
              total: 1299999.99,
            },
          },
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          orderNumber: 'ORD-2025-002',
          user: {
            id: 'u2',
            firstName: 'María',
            lastName: 'González',
            email: 'maria.gonzalez@example.com',
          },
          items: [
            {
              id: 'i2',
              product: {
                id: 'p2',
                name: 'MacBook Air 15" M3',
                images: [],
              },
              quantity: 1,
              price: 1749999.99,
              vatType: 'general',
            },
          ],
          totalAmount: 1749999.99,
          status: 'processing',
          paymentStatus: 'paid',
          shippingType: 'local',
          shippingCost: 8000,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus });
      // Refresh orders
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('loading')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-48"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('allOrders')}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filterByStatus')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                <SelectItem value="processing">{t('processing')}</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="shipped">{t('shipped')}</SelectItem>
                <SelectItem value="delivered">{t('delivered')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                <SelectItem value="return_requested">Return Requested</SelectItem>
                <SelectItem value="refunded">{t('refunded')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('noOrders')}</h3>
            <p>{t('noOrdersFound')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('orderNumber')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('items')}</TableHead>
                  <TableHead>{t('total')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('paymentStatus')}</TableHead>
                  <TableHead>{t('shipping')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {order.user?.firstName || ''} {order.user?.lastName || 'Guest'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      {order.commissionAmount && (
                        <div className="text-xs text-muted-foreground">
                          Commission: {formatCurrency(order.commissionAmount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 w-fit ${getOrderStatusColor(order.status)}`}
                      >
                        {getOrderStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getPaymentStatusColor(order.paymentStatus || 'pending')}
                      >
                        {(order.paymentStatus || 'pending').charAt(0).toUpperCase() +
                         (order.paymentStatus || 'pending').slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.shippingTrackingNumber ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Truck className="h-3 w-3" />
                          <code className="text-xs">{order.shippingTrackingNumber}</code>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {order.shippingType || 'N/A'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/orders/${order.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t('viewDetails')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                            disabled={order.status !== 'pending'}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t('confirmOrder')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(order.id, 'shipped')}
                            disabled={order.status === 'delivered' || order.status === 'cancelled'}
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            {t('markAsShipped')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            disabled={order.status !== 'shipped'}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {t('markAsDelivered')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            disabled={order.status === 'delivered' || order.status === 'cancelled'}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            {t('cancelOrder')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
