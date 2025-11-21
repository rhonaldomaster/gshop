'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Package,
  User,
  CreditCard,
  Truck,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  Download,
  CheckCircle,
  XCircle,
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
  unitPrice: number;
  totalPrice: number;
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
    phone?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
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
  shippingCarrier?: string;
  shippingNotes?: string;
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

const getVatLabel = (vatType?: string): string => {
  const labels: Record<string, string> = {
    excluido: 'Excluido (0%)',
    exento: 'Exento (0%)',
    reducido: 'Reducido (5%)',
    general: 'General (19%)',
  };
  return labels[vatType || 'general'] || 'General (19%)';
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('orders');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string);
    }
  }, [params.id]);

  const fetchOrder = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Order>(`/orders/${id}`);
      setOrder(response);
    } catch (error) {
      console.error('Error fetching order:', error);
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">{t('orderNotFound')}</h3>
          <Button onClick={() => router.back()}>{t('goBack')}</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('order')} {order.orderNumber}
              </h1>
              <p className="text-muted-foreground">
                {t('placedOn')} {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getOrderStatusColor(order.status)}>
              {t(order.status)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Order Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('orderItems')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        {item.product.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <div className="text-sm text-muted-foreground">
                          {t('quantity')}: {item.quantity} × {formatCurrency(item.unitPrice)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getVatLabel(item.vatType)}
                          {item.basePrice && (
                            <> • {t('base')}: {formatCurrency(item.basePrice)} • {t('vat')}: {formatCurrency(item.vatAmountPerUnit || 0)}</>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(item.totalPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('subtotal')}</span>
                    <span>{formatCurrency((order.totalAmount || 0) - (order.shippingCost || 0))}</span>
                  </div>
                  {order.shippingCost && (
                    <div className="flex justify-between text-sm">
                      <span>{t('shipping')} ({order.shippingType})</span>
                      <span>{formatCurrency(order.shippingCost)}</span>
                    </div>
                  )}
                  {order.commissionAmount && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>{t('commission')} ({order.commissionRate}%)</span>
                      <span>-{formatCurrency(order.commissionAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('total')}</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VAT Breakdown */}
            {order.vatBreakdown && (
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle>{t('colombianVat')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(order.vatBreakdown).map(([category, breakdown]) => (
                      <div key={category} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{category}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('base')}: {formatCurrency(breakdown.base)} + {t('vat')}: {formatCurrency(breakdown.vat)}
                          </div>
                        </div>
                        <div className="font-medium">{formatCurrency(breakdown.total)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Information */}
            {order.shippingAddress && (
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {t('shippingInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{t('deliveryAddress')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                      {order.shippingAddress.postalCode}<br />
                      {order.shippingAddress.country}
                    </p>
                  </div>

                  {order.shippingTrackingNumber && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">{t('trackingInfo')}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('carrier')}:</span>
                            <span className="font-medium">{order.shippingCarrier || t('na')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('trackingNumber')} #:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {order.shippingTrackingNumber}
                            </code>
                          </div>
                          {order.shippingTrackingUrl && (
                            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                              <a href={order.shippingTrackingUrl} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="h-4 w-4 mr-2" />
                                {t('trackShipment')}
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {order.shippingNotes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">{t('shippingNotes')}</h4>
                        <p className="text-sm text-muted-foreground">{order.shippingNotes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Customer & Payment Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('customer')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium">
                    {order.user?.firstName || ''} {order.user?.lastName || t('guest')}
                  </div>
                  <div className="text-sm text-muted-foreground">{order.user?.email}</div>
                  {order.user?.phone && (
                    <div className="text-sm text-muted-foreground">{order.user.phone}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('payment')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('status')}:</span>
                  <Badge
                    variant="outline"
                    className={
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {t(order.paymentStatus || 'pending')}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('method')}:</span>
                  <span className="text-sm font-medium capitalize">
                    {order.paymentMethod || t('na')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('total')}:</span>
                  <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Live Stream / Affiliate Info */}
            {(order.liveSessionId || order.affiliateId) && (
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {t('attribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.liveSessionId && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t('liveStream')}:</span>
                      <code className="ml-2 bg-muted px-2 py-1 rounded text-xs">
                        {order.liveSessionId}
                      </code>
                    </div>
                  )}
                  {order.affiliateId && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t('affiliate')}:</span>
                      <code className="ml-2 bg-muted px-2 py-1 rounded text-xs">
                        {order.affiliateId}
                      </code>
                    </div>
                  )}
                  {order.commissionAmount && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">{t('commission')}:</span>
                      <span className="font-medium text-orange-600">
                        {formatCurrency(order.commissionAmount)} ({order.commissionRate}%)
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Timeline */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('timeline')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t('created')}: {formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t('updated')}: {formatDate(order.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>{t('actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  {t('downloadInvoice')}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('updateStatus')}
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('cancelOrder')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
