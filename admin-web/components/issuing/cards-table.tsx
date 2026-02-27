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
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient, formatDate } from '@/lib/api-client';

interface IssuingCard {
  id: string;
  stripeCardId: string;
  last4: string;
  brand: string;
  type: string;
  status: string;
  spendingLimitAmount?: number;
  spendingLimitInterval?: string;
  currency: string;
  cardholder?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
}

interface CardsResponse {
  data: IssuingCard[];
  total: number;
  page: number;
  limit: number;
}

const getCardStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    canceled: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getCardTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    virtual: 'bg-purple-100 text-purple-800',
    physical: 'bg-blue-100 text-blue-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export function CardsTable() {
  const t = useTranslations('issuing');
  const tCommon = useTranslations('common');
  const [cards, setCards] = useState<IssuingCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCards();
  }, [statusFilter, currentPage]);

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await apiClient.get<CardsResponse>(`/admin/issuing/cards?${params}`);
      setCards(response?.data || []);
      if (response?.total && response?.limit) {
        setTotalPages(Math.ceil(response.total / response.limit));
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter by search term on client side
  const filteredCards = cards.filter((card) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const last4 = card.last4 || '';
    const userName = `${card.user?.firstName || ''} ${card.user?.lastName || ''}`.toLowerCase();
    const email = (card.user?.email || '').toLowerCase();
    return last4.includes(term) || userName.includes(term) || email.includes(term);
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
        <div className="flex items-center justify-between">
          <CardTitle>{t('cards.title')}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                placeholder={t('cards.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
                <SelectItem value="active">{t('statuses.active')}</SelectItem>
                <SelectItem value="inactive">{t('statuses.inactive')}</SelectItem>
                <SelectItem value="canceled">{t('statuses.canceled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCards.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('cards.noResults')}</h3>
            <p>{t('cards.noResultsDescription')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('cards.card')}</TableHead>
                    <TableHead>{t('cards.user')}</TableHead>
                    <TableHead>{t('cards.type')}</TableHead>
                    <TableHead>{t('cards.status')}</TableHead>
                    <TableHead>{t('cards.spendingLimit')}</TableHead>
                    <TableHead>{t('cards.createdAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium font-mono">
                              **** {card.last4}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase">
                              {card.brand}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {card.user?.firstName || card.cardholder?.firstName || ''}{' '}
                            {card.user?.lastName || card.cardholder?.lastName || ''}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {card.user?.email || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getCardTypeColor(card.type)}
                        >
                          {t(`cardTypes.${card.type}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getCardStatusColor(card.status)}
                        >
                          {t(`statuses.${card.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {card.spendingLimitAmount ? (
                          <div className="text-sm">
                            <span className="font-medium">
                              ${(card.spendingLimitAmount / 100).toFixed(2)}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              {card.currency?.toUpperCase()} / {card.spendingLimitInterval}
                            </span>
                          </div>
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
