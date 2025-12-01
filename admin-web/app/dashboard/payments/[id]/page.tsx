'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CreditCard,
  User,
  ShoppingBag,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiClient, formatCurrency, formatDate } from '@/lib/api-client';

interface Payment {
  id: string;
  transactionId: string;
  order?: {
    id: string;
    orderNumber: string;
  };
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  amount: number;
  status: string;
  method: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

const getPaymentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getPaymentStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <AlertCircle className="h-5 w-5" />;
    case 'processing':
      return <RefreshCw className="h-5 w-5" />;
    case 'completed':
      return <CheckCircle className="h-5 w-5" />;
    case 'failed':
      return <XCircle className="h-5 w-5" />;
    case 'refunded':
      return <DollarSign className="h-5 w-5" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5" />;
    default:
      return <CreditCard className="h-5 w-5" />;
  }
};

export default function PaymentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('payments');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentDetails();
  }, [params.id]);

  const fetchPaymentDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Payment>(`/payments-v2/${params.id}`);
      setPayment(response);
    } catch (error: any) {
      console.error('Error fetching payment details:', error);
      setError(error.response?.data?.message || 'Failed to load payment details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back') || 'Volver'}
            </Button>
          </div>
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                {t('loading')}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !payment) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back') || 'Volver'}
            </Button>
          </div>
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h3 className="text-lg font-medium mb-2">Error</h3>
                <p className="text-muted-foreground">{error || 'Payment not found'}</p>
              </div>
            </CardContent>
          </Card>
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
              {t('back') || 'Volver'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t('paymentDetails') || 'Detalles del Pago'}
              </h1>
              <p className="text-muted-foreground">
                {t('transactionId')}: {payment.transactionId}
              </p>
            </div>
          </div>
          {payment.order && (
            <Button asChild>
              <Link href={`/dashboard/orders/${payment.order.id}`}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                {t('viewOrder')}
              </Link>
            </Button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('paymentInformation') || 'Información del Pago'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t('status')}
                  </span>
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1.5 ${getPaymentStatusColor(payment.status)}`}
                  >
                    {getPaymentStatusIcon(payment.status)}
                    {t(payment.status)}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t('amount')}
                  </span>
                  <span className="text-lg font-bold">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t('method')}
                  </span>
                  <span className="font-medium capitalize">
                    {payment.method}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t('currency') || 'Moneda'}
                  </span>
                  <span className="font-medium">
                    {payment.currency || 'COP'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {t('transactionId')}
                  </span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {payment.transactionId}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('customerInformation') || 'Información del Cliente'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {payment.user ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t('name') || 'Nombre'}
                      </span>
                      <span className="font-medium">
                        {payment.user.firstName || ''} {payment.user.lastName || 'N/A'}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t('email') || 'Email'}
                      </span>
                      <span className="font-medium text-sm">
                        {payment.user.email}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    {t('noCustomerInfo') || 'No hay información del cliente'}
                  </div>
                )}
                {payment.order && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t('order')}
                      </span>
                      <Link
                        href={`/dashboard/orders/${payment.order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {payment.order.orderNumber}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('timeline') || 'Historial'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{t('created') || 'Creado'}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('paymentCreated') || 'El pago fue creado'}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(payment.createdAt)}
                  </span>
                </div>
                {payment.updatedAt !== payment.createdAt && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{t('updated') || 'Actualizado'}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('lastUpdate') || 'Última actualización'}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(payment.updatedAt)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
