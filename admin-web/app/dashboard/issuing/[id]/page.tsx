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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeftRight,
  Phone,
  Mail,
  MapPin,
  Hash,
} from 'lucide-react';
import { apiClient, formatDate } from '@/lib/api-client';

interface CardholderCard {
  id: string;
  stripeCardId: string;
  last4: string;
  brand: string;
  type: string;
  status: string;
  spendingLimitAmount?: number;
  spendingLimitInterval?: string;
  currency: string;
  createdAt: string;
}

interface CardTransaction {
  id: string;
  stripeTransactionId: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  merchantName?: string;
  merchantCategory?: string;
  createdAt: string;
}

interface CardholderDetail {
  id: string;
  userId: string;
  stripeCardholderId: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  cards?: CardholderCard[];
  transactions?: CardTransaction[];
  createdAt: string;
  updatedAt: string;
}

const getCardholderStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getCardStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    canceled: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getTransactionStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    captured: 'bg-green-100 text-green-800',
    reversed: 'bg-orange-100 text-orange-800',
    declined: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getTransactionTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    authorization: 'bg-blue-100 text-blue-800',
    capture: 'bg-green-100 text-green-800',
    refund: 'bg-orange-100 text-orange-800',
    reversal: 'bg-red-100 text-red-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export default function CardholderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('issuing');
  const tCommon = useTranslations('common');
  const [cardholder, setCardholder] = useState<CardholderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'active' | 'rejected';
  }>({ open: false, action: 'active' });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCardholder(params.id as string);
    }
  }, [params.id]);

  const fetchCardholder = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<CardholderDetail>(`/admin/issuing/cardholders/${id}`);
      setCardholder(response);
    } catch (error) {
      console.error('Error fetching cardholder:', error);
      setCardholder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenConfirmDialog = (action: 'active' | 'rejected') => {
    setConfirmDialog({ open: true, action });
  };

  const handleUpdateStatus = async () => {
    if (!cardholder) return;

    setIsUpdating(true);
    try {
      await apiClient.patch(`/admin/issuing/cardholders/${cardholder.id}/status`, {
        status: confirmDialog.action,
      });
      setConfirmDialog({ open: false, action: 'active' });
      await fetchCardholder(cardholder.id);
    } catch (error) {
      console.error('Error updating cardholder status:', error);
    } finally {
      setIsUpdating(false);
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

  if (!cardholder) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">{t('detail.notFound')}</h3>
          <Button onClick={() => router.back()}>{tCommon('back')}</Button>
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
              {tCommon('back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {cardholder.firstName} {cardholder.lastName}
              </h1>
              <p className="text-muted-foreground">
                {t('detail.cardholderDetail')}
              </p>
            </div>
          </div>
          <Badge className={getCardholderStatusColor(cardholder.status)}>
            {t(`statuses.${cardholder.status}`)}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column - Info and Cards */}
          <div className="md:col-span-2 space-y-6">
            {/* Cardholder Info */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('detail.cardholderInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">{t('detail.email')}</div>
                      <div className="font-medium">{cardholder.email || cardholder.user?.email || '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">{t('detail.phone')}</div>
                      <div className="font-medium">{cardholder.phoneNumber || '-'}</div>
                    </div>
                  </div>
                </div>

                {cardholder.address && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <div className="text-sm text-muted-foreground">{t('detail.address')}</div>
                        <div className="font-medium">
                          {cardholder.address.line1}
                          {cardholder.address.line2 && <>, {cardholder.address.line2}</>}
                          <br />
                          {cardholder.address.city}, {cardholder.address.state} {cardholder.address.postalCode}
                          <br />
                          {cardholder.address.country}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">{t('detail.stripeCardholderId')}</div>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{cardholder.stripeCardholderId || '-'}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">{t('detail.userId')}</div>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{cardholder.userId || '-'}</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards List */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('detail.cards')} ({cardholder.cards?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!cardholder.cards || cardholder.cards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t('detail.noCards')}</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('cards.card')}</TableHead>
                          <TableHead>{t('cards.type')}</TableHead>
                          <TableHead>{t('cards.status')}</TableHead>
                          <TableHead>{t('cards.spendingLimit')}</TableHead>
                          <TableHead>{t('cards.createdAt')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cardholder.cards.map((card) => (
                          <TableRow key={card.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium font-mono">**** {card.last4}</div>
                                  <div className="text-xs text-muted-foreground uppercase">{card.brand}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                                {t(`cardTypes.${card.type}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getCardStatusColor(card.status)}>
                                {t(`statuses.${card.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {card.spendingLimitAmount ? (
                                <span className="text-sm">
                                  ${(card.spendingLimitAmount / 100).toFixed(2)} {card.currency?.toUpperCase()} / {card.spendingLimitInterval}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(card.createdAt)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  {t('detail.transactionHistory')} ({cardholder.transactions?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!cardholder.transactions || cardholder.transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t('detail.noTransactions')}</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('transactions.id')}</TableHead>
                          <TableHead>{t('transactions.type')}</TableHead>
                          <TableHead>{t('transactions.status')}</TableHead>
                          <TableHead>{t('transactions.amount')}</TableHead>
                          <TableHead>{t('transactions.merchant')}</TableHead>
                          <TableHead>{t('transactions.date')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cardholder.transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {tx.stripeTransactionId?.slice(-8) || tx.id.slice(-8)}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getTransactionTypeColor(tx.type)}>
                                {t(`transactionTypes.${tx.type}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getTransactionStatusColor(tx.status)}>
                                {t(`statuses.${tx.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                ${(Math.abs(tx.amount) / 100).toFixed(2)} {tx.currency?.toUpperCase()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{tx.merchantName || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(tx.createdAt)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('detail.timeline')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t('detail.created')}: {formatDate(cardholder.createdAt)}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t('detail.updated')}: {formatDate(cardholder.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card className="gshop-card">
              <CardHeader>
                <CardTitle>{tCommon('actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleOpenConfirmDialog('active')}
                  disabled={cardholder.status === 'active'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('cardholders.approve')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={() => handleOpenConfirmDialog('rejected')}
                  disabled={cardholder.status === 'rejected'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('cardholders.reject')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Confirm Status Change Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => {
          if (!open) setConfirmDialog({ open: false, action: 'active' });
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmDialog.action === 'active'
                  ? t('cardholders.confirmApproveTitle')
                  : t('cardholders.confirmRejectTitle')}
              </DialogTitle>
              <DialogDescription>
                {confirmDialog.action === 'active'
                  ? t('cardholders.confirmApproveDescription', { name: `${cardholder.firstName} ${cardholder.lastName}` })
                  : t('cardholders.confirmRejectDescription', { name: `${cardholder.firstName} ${cardholder.lastName}` })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog({ open: false, action: 'active' })}
                disabled={isUpdating}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                variant={confirmDialog.action === 'rejected' ? 'destructive' : 'default'}
                onClick={handleUpdateStatus}
                disabled={isUpdating}
              >
                {isUpdating
                  ? tCommon('loading')
                  : confirmDialog.action === 'active'
                    ? t('cardholders.approve')
                    : t('cardholders.reject')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
