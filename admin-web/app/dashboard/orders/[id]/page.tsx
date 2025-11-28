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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  paymentMethod?: string | { type?: string; provider?: string };
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
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
  sellerCommissionRate?: number;
  sellerCommissionAmount?: number;
  commissionStatus?: string;
  platformFeeRate?: number;
  platformFeeAmount?: number;
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

const getOrderStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Pendiente de Pago',
    confirmed: 'Pendiente de Envío',
    processing: 'Preparando Envío',
    in_transit: 'En Tránsito',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    return_requested: 'Devolución Solicitada',
    refunded: 'Reembolsado',
  };
  return labels[status] || status;
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

const formatPaymentMethod = (paymentMethod?: string | { type?: string; provider?: string }): string => {
  if (!paymentMethod) return 'N/A';
  if (typeof paymentMethod === 'string') return paymentMethod;
  const { type, provider } = paymentMethod;
  if (type && provider) return `${type} (${provider})`;
  return type || provider || 'N/A';
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('orders');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleDownloadInvoice = async () => {
    if (!order) return;

    setIsDownloadingInvoice(true);
    try {
      // Get invoices for this order
      const invoices = await apiClient.get<any[]>(`/invoicing/order/${order.id}`);

      if (!invoices || invoices.length === 0) {
        alert('No hay facturas disponibles para esta orden.');
        return;
      }

      // Download the first invoice (or all if needed)
      const invoice = invoices[0];
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/invoicing/${invoice.id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al descargar la factura');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura_${invoice.invoiceNumber || order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error al descargar la factura. Por favor, intenta de nuevo.');
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handleOpenUpdateStatusDialog = () => {
    if (order) {
      setSelectedStatus(order.status);
      setIsUpdateStatusDialogOpen(true);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order || !selectedStatus) return;

    setIsUpdatingStatus(true);
    try {
      await apiClient.patch(`/orders/${order.id}/status`, {
        status: selectedStatus,
      });

      // Refresh order data
      await fetchOrder(order.id);
      setIsUpdateStatusDialogOpen(false);
      alert('Estado de la orden actualizado correctamente.');
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el estado de la orden. Por favor, intenta de nuevo.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenCancelDialog = () => {
    if (order && order.status !== 'cancelled' && order.status !== 'refunded') {
      setCancelReason('');
      setIsCancelDialogOpen(true);
    } else if (order?.status === 'cancelled') {
      alert('Esta orden ya está cancelada.');
    } else if (order?.status === 'refunded') {
      alert('Esta orden ya ha sido reembolsada y no puede cancelarse.');
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    if (!cancelReason.trim()) {
      alert('Por favor, proporciona una razón para la cancelación.');
      return;
    }

    setIsCancelling(true);
    try {
      // Update status to cancelled
      await apiClient.patch(`/orders/${order.id}/status`, {
        status: 'cancelled',
      });

      // Optionally save the cancel reason (if backend supports it)
      // You could add a note or comment field to the order

      // Refresh order data
      await fetchOrder(order.id);
      setIsCancelDialogOpen(false);
      setCancelReason('');
      alert('Orden cancelada correctamente.');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Error al cancelar la orden. Por favor, intenta de nuevo.');
    } finally {
      setIsCancelling(false);
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
              {getOrderStatusLabel(order.status)}
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
                  {order.platformFeeAmount && order.platformFeeAmount > 0 && (
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Fee Plataforma ({order.platformFeeRate}%)</span>
                      <span>+{formatCurrency(order.platformFeeAmount)}</span>
                    </div>
                  )}
                  {order.sellerCommissionRate && order.sellerCommissionRate > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>Comisión Vendedor ({order.sellerCommissionRate}%)</span>
                      <span>
                        {order.sellerCommissionAmount && order.sellerCommissionAmount > 0
                          ? `-${formatCurrency(order.sellerCommissionAmount)}`
                          : `${order.commissionStatus || 'pending'}`
                        }
                      </span>
                    </div>
                  )}
                  {order.commissionAmount && order.commissionAmount > 0 && (
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>Comisión Afiliado ({order.commissionRate}%)</span>
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
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                      {order.shippingAddress.address1}<br />
                      {order.shippingAddress.address2 && <>{order.shippingAddress.address2}<br /></>}
                      {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                      {order.shippingAddress.postalCode}<br />
                      {order.shippingAddress.country}
                      {order.shippingAddress.phone && <><br />Tel: {order.shippingAddress.phone}</>}
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
                    {formatPaymentMethod(order.paymentMethod)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('total')}:</span>
                  <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Commission & Attribution Info */}
            {(order.platformFeeAmount || order.sellerCommissionRate || order.liveSessionId || order.affiliateId) && (
              <Card className="gshop-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Comisiones y Fees
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.platformFeeAmount && order.platformFeeAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Fee Plataforma:</span>
                      <div className="text-right">
                        <div className="font-medium text-blue-600">
                          {order.platformFeeRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(order.platformFeeAmount)}
                        </div>
                      </div>
                    </div>
                  )}

                  {order.sellerCommissionRate && order.sellerCommissionRate > 0 && (
                    <>
                      {order.platformFeeAmount && <Separator />}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Comisión Vendedor:</span>
                        <div className="text-right">
                          <div className="font-medium text-orange-600">
                            {order.sellerCommissionRate}%
                          </div>
                          {order.sellerCommissionAmount && order.sellerCommissionAmount > 0 ? (
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(order.sellerCommissionAmount)}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              Status: {order.commissionStatus || 'pending'}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {order.liveSessionId && (
                    <>
                      <Separator />
                      <div className="text-sm">
                        <span className="text-muted-foreground">{t('liveStream')}:</span>
                        <code className="ml-2 bg-muted px-2 py-1 rounded text-xs">
                          {order.liveSessionId}
                        </code>
                      </div>
                    </>
                  )}

                  {order.affiliateId && (
                    <>
                      {!order.liveSessionId && <Separator />}
                      <div className="text-sm">
                        <span className="text-muted-foreground">{t('affiliate')}:</span>
                        <code className="ml-2 bg-muted px-2 py-1 rounded text-xs">
                          {order.affiliateId}
                        </code>
                      </div>
                    </>
                  )}

                  {order.commissionAmount && order.commissionAmount > 0 && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Comisión Afiliado:</span>
                      <span className="font-medium text-purple-600">
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
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleDownloadInvoice}
                  disabled={isDownloadingInvoice}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloadingInvoice ? 'Descargando...' : t('downloadInvoice')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleOpenUpdateStatusDialog}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('updateStatus')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={handleOpenCancelDialog}
                  disabled={order?.status === 'cancelled' || order?.status === 'refunded'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('cancelOrder')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Update Status Dialog */}
        <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Estado de la Orden</DialogTitle>
              <DialogDescription>
                Selecciona el nuevo estado para la orden {order?.orderNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente de Pago</SelectItem>
                  <SelectItem value="confirmed">Pendiente de Envío</SelectItem>
                  <SelectItem value="processing">Preparando Envío</SelectItem>
                  <SelectItem value="in_transit">En Tránsito</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="return_requested">Devolución Solicitada</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUpdateStatusDialogOpen(false)}
                disabled={isUpdatingStatus}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateStatus} disabled={isUpdatingStatus}>
                {isUpdatingStatus ? 'Actualizando...' : 'Actualizar Estado'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Order Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Orden</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas cancelar la orden {order?.orderNumber}? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cancelReason">Razón de la Cancelación *</Label>
                <Textarea
                  id="cancelReason"
                  placeholder="Explica el motivo de la cancelación..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  disabled={isCancelling}
                />
                <p className="text-xs text-muted-foreground">
                  Esta información será registrada en el sistema.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancelDialogOpen(false);
                  setCancelReason('');
                }}
                disabled={isCancelling}
              >
                No, volver
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelOrder}
                disabled={isCancelling || !cancelReason.trim()}
              >
                {isCancelling ? 'Cancelando...' : 'Sí, Cancelar Orden'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
