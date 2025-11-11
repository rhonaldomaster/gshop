'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
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
import Link from 'next/link';

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
      // Mock data for demo
      setOrder({
        id: '1',
        orderNumber: 'ORD-2025-001',
        user: {
          id: 'u1',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@example.com',
          phone: '+57 300 123 4567',
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
        totalAmount: 1314999.99,
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'mercadopago',
        shippingType: 'national',
        shippingCost: 15000,
        shippingTrackingNumber: 'TRACK-123456789',
        shippingTrackingUrl: 'https://tracking.example.com/123456789',
        shippingCarrier: 'Servientrega',
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
      });
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
          <h3 className="text-lg font-medium mb-2">Order not found</h3>
          <Button onClick={() => router.back()}>Go Back</Button>
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
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Order {order.orderNumber}
              </h1>
              <p className="text-muted-foreground">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getOrderStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
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
                  Order Items
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
                          Quantity: {item.quantity} × {formatCurrency(item.price)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getVatLabel(item.vatType)}
                          {item.basePrice && (
                            <> • Base: {formatCurrency(item.basePrice)} • VAT: {formatCurrency(item.vatAmountPerUnit || 0)}</>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency((order.totalAmount || 0) - (order.shippingCost || 0))}</span>
                  </div>
                  {order.shippingCost && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping ({order.shippingType})</span>
                      <span>{formatCurrency(order.shippingCost)}</span>
                    </div>
                  )}
                  {order.commissionAmount && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Commission ({order.commissionRate}%)</span>
                      <span>-{formatCurrency(order.commissionAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VAT Breakdown */}
            {order.vatBreakdown && (
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle>VAT Breakdown (Colombian Tax)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(order.vatBreakdown).map(([category, breakdown]) => (
                      <div key={category} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{category}</div>
                          <div className="text-sm text-muted-foreground">
                            Base: {formatCurrency(breakdown.base)} + VAT: {formatCurrency(breakdown.vat)}
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
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Delivery Address</h4>
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
                        <h4 className="font-medium mb-2">Tracking Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Carrier:</span>
                            <span className="font-medium">{order.shippingCarrier || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tracking #:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs">
                              {order.shippingTrackingNumber}
                            </code>
                          </div>
                          {order.shippingTrackingUrl && (
                            <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                              <a href={order.shippingTrackingUrl} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Track Shipment
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
                        <h4 className="font-medium mb-2">Shipping Notes</h4>
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
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium">
                    {order.user?.firstName || ''} {order.user?.lastName || 'Guest'}
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
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {(order.paymentStatus || 'pending').charAt(0).toUpperCase() +
                     (order.paymentStatus || 'pending').slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Method:</span>
                  <span className="text-sm font-medium capitalize">
                    {order.paymentMethod || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
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
                    Attribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.liveSessionId && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Live Stream:</span>
                      <code className="ml-2 bg-muted px-2 py-1 rounded text-xs">
                        {order.liveSessionId}
                      </code>
                    </div>
                  )}
                  {order.affiliateId && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Affiliate:</span>
                      <code className="ml-2 bg-muted px-2 py-1 rounded text-xs">
                        {order.affiliateId}
                      </code>
                    </div>
                  )}
                  {order.commissionAmount && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Commission:</span>
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
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Updated: {formatDate(order.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
