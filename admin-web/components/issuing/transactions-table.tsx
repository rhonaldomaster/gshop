'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  Search,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient, formatDate } from '@/lib/api-client';

interface IssuingTransaction {
  id: string;
  stripeTransactionId: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  merchantName?: string;
  merchantCategory?: string;
  card?: {
    id: string;
    last4: string;
    brand: string;
  };
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
}

interface TransactionsResponse {
  data: IssuingTransaction[];
  total: number;
  page: number;
  limit: number;
}

const getTransactionStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    captured: 'bg-green-100 text-green-800',
    reversed: 'bg-orange-100 text-orange-800',
    declined: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
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

export function TransactionsTable() {
  const t = useTranslations('issuing');
  const tCommon = useTranslations('common');
  const [transactions, setTransactions] = useState<IssuingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, typeFilter, currentPage]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      const response = await apiClient.get<TransactionsResponse>(`/admin/issuing/transactions?${params}`);
      setTransactions(response?.data || []);
      if (response?.total && response?.limit) {
        setTotalPages(Math.ceil(response.total / response.limit));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter by search term on client side
  const filteredTransactions = transactions.filter((tx) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const merchant = (tx.merchantName || '').toLowerCase();
    const userName = `${tx.user?.firstName || ''} ${tx.user?.lastName || ''}`.toLowerCase();
    const last4 = tx.card?.last4 || '';
    return merchant.includes(term) || userName.includes(term) || last4.includes(term);
  });

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{tCommon('loading')}</CardTitle>
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>{t('transactions.title')}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                placeholder={t('transactions.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
                <SelectItem value="authorization">{t('transactionTypes.authorization')}</SelectItem>
                <SelectItem value="capture">{t('transactionTypes.capture')}</SelectItem>
                <SelectItem value="refund">{t('transactionTypes.refund')}</SelectItem>
                <SelectItem value="reversal">{t('transactionTypes.reversal')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="pending">{t('statuses.pending')}</SelectItem>
                <SelectItem value="captured">{t('statuses.captured')}</SelectItem>
                <SelectItem value="reversed">{t('statuses.reversed')}</SelectItem>
                <SelectItem value="declined">{t('statuses.declined')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ArrowLeftRight className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('transactions.noResults')}</h3>
            <p>{t('transactions.noResultsDescription')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('transactions.id')}</TableHead>
                    <TableHead>{t('transactions.card')}</TableHead>
                    <TableHead>{t('transactions.user')}</TableHead>
                    <TableHead>{t('transactions.type')}</TableHead>
                    <TableHead>{t('transactions.status')}</TableHead>
                    <TableHead>{t('transactions.amount')}</TableHead>
                    <TableHead>{t('transactions.merchant')}</TableHead>
                    <TableHead>{t('transactions.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/50">
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {tx.stripeTransactionId?.slice(-8) || tx.id.slice(-8)}
                        </code>
                      </TableCell>
                      <TableCell>
                        {tx.card ? (
                          <span className="font-mono text-sm">
                            **** {tx.card.last4}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {tx.user?.firstName || ''} {tx.user?.lastName || ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {tx.user?.email || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getTransactionTypeColor(tx.type)}
                        >
                          {t(`transactionTypes.${tx.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getTransactionStatusColor(tx.status)}
                        >
                          {t(`statuses.${tx.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          ${(Math.abs(tx.amount) / 100).toFixed(2)} {tx.currency?.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{tx.merchantName || '-'}</div>
                          {tx.merchantCategory && (
                            <div className="text-xs text-muted-foreground">{tx.merchantCategory}</div>
                          )}
                        </div>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
