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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  MoreHorizontal,
  Eye,
  CreditCard,
  RefreshCw,
  DollarSign,
  AlertCircle,
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
      return <AlertCircle className="h-4 w-4" />;
    case 'processing':
      return <RefreshCw className="h-4 w-4" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'failed':
      return <XCircle className="h-4 w-4" />;
    case 'refunded':
      return <DollarSign className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
};

export function PaymentsTable() {
  const t = useTranslations('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refundAmount, setRefundAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [searchTerm, statusFilter, currentPage]);

  const fetchPayments = async () => {
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

      const response = await apiClient.get<{ data: Payment[] }>(`/payments-v2?${params}`);
      setPayments(response?.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async (paymentId: string, amount?: number) => {
    setIsRefunding(true);
    try {
      await apiClient.patch(`/payments/${paymentId}/refund`, {
        amount: amount,
      });
      // Refresh payments
      fetchPayments();
      setSelectedPayment(null);
      setRefundAmount('');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund. Please try again.');
    } finally {
      setIsRefunding(false);
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
          <CardTitle>{t('paymentTransactions')}</CardTitle>
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
                <SelectItem value="all">{t('allStatus')}</SelectItem>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="processing">{t('processing')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
                <SelectItem value="failed">{t('failed')}</SelectItem>
                <SelectItem value="refunded">{t('refunded')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('noPayments')}</h3>
            <p>{t('noPaymentsFound')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('transactionId')}</TableHead>
                  <TableHead>{t('order')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('method')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/50">
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {payment.transactionId}
                      </code>
                    </TableCell>
                    <TableCell>
                      {payment.order ? (
                        <Link
                          href={`/dashboard/orders/${payment.order.id}`}
                          className="font-medium hover:underline"
                        >
                          {payment.order.orderNumber}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {payment.user?.firstName || ''} {payment.user?.lastName || 'Guest'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payment.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(payment.amount)}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {payment.currency || 'COP'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">
                        {payment.method}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 w-fit ${getPaymentStatusColor(payment.status)}`}
                      >
                        {getPaymentStatusIcon(payment.status)}
                        {t(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(payment.createdAt)}
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
                            <Link href={`/dashboard/payments/${payment.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              {t('viewDetails')}
                            </Link>
                          </DropdownMenuItem>
                          {payment.order && (
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/orders/${payment.order.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('viewOrder')}
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setSelectedPayment(payment);
                                }}
                                disabled={payment.status !== 'completed'}
                              >
                                <DollarSign className="mr-2 h-4 w-4" />
                                {t('processRefund')}
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('processRefund')}</DialogTitle>
                                <DialogDescription>
                                  {t('refundDescription')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">{t('originalAmount')}</label>
                                  <div className="text-2xl font-bold">
                                    {formatCurrency(selectedPayment?.amount || 0)}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">{t('refundAmountOptional')}</label>
                                  <Input
                                    type="number"
                                    placeholder={t('refundPlaceholder')}
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    max={selectedPayment?.amount || 0}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayment(null);
                                    setRefundAmount('');
                                  }}
                                >
                                  {t('cancel')}
                                </Button>
                                <Button
                                  onClick={() => handleRefund(
                                    selectedPayment?.id || '',
                                    refundAmount ? parseFloat(refundAmount) : undefined
                                  )}
                                  disabled={isRefunding}
                                >
                                  {isRefunding ? t('processing') : t('processRefund')}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
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
