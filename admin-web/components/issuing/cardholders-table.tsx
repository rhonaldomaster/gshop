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
} from '@/components/ui/dialog';
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient, formatDate } from '@/lib/api-client';

interface Cardholder {
  id: string;
  userId: string;
  stripeCardholderId: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  cardsCount?: number;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CardholdersResponse {
  data: Cardholder[];
  total: number;
  page: number;
  limit: number;
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

export function CardholdersTable() {
  const t = useTranslations('issuing');
  const tCommon = useTranslations('common');
  const [cardholders, setCardholders] = useState<Cardholder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    cardholderId: string;
    action: 'active' | 'rejected';
    name: string;
  }>({ open: false, cardholderId: '', action: 'active', name: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchCardholders();
  }, [searchTerm, statusFilter, currentPage]);

  const fetchCardholders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await apiClient.get<CardholdersResponse>(`/admin/issuing/cardholders?${params}`);
      setCardholders(response?.data || []);
      if (response?.total && response?.limit) {
        setTotalPages(Math.ceil(response.total / response.limit));
      }
    } catch (error) {
      console.error('Error fetching cardholders:', error);
      setCardholders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenConfirmDialog = (cardholderId: string, action: 'active' | 'rejected', name: string) => {
    setConfirmDialog({ open: true, cardholderId, action, name });
  };

  const handleUpdateStatus = async () => {
    if (!confirmDialog.cardholderId) return;

    setIsUpdating(true);
    try {
      await apiClient.patch(`/admin/issuing/cardholders/${confirmDialog.cardholderId}/status`, {
        status: confirmDialog.action,
      });
      setConfirmDialog({ open: false, cardholderId: '', action: 'active', name: '' });
      fetchCardholders();
    } catch (error) {
      console.error('Error updating cardholder status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter by search term on client side
  const filteredCardholders = cardholders.filter((ch) => {
    if (!searchTerm) return true;
    const name = `${ch.firstName || ''} ${ch.lastName || ''}`.toLowerCase();
    const email = (ch.email || ch.user?.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
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
    <>
      <Card className="gshop-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('cardholders.title')}</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                <Input
                  placeholder={t('cardholders.searchPlaceholder')}
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
                  <SelectItem value="pending">{t('statuses.pending')}</SelectItem>
                  <SelectItem value="active">{t('statuses.active')}</SelectItem>
                  <SelectItem value="inactive">{t('statuses.inactive')}</SelectItem>
                  <SelectItem value="rejected">{t('statuses.rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCardholders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('cardholders.noResults')}</h3>
              <p>{t('cardholders.noResultsDescription')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('cardholders.user')}</TableHead>
                      <TableHead>{t('cardholders.status')}</TableHead>
                      <TableHead>{t('cardholders.phone')}</TableHead>
                      <TableHead>{t('cardholders.cardsCount')}</TableHead>
                      <TableHead>{t('cardholders.createdAt')}</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCardholders.map((cardholder) => (
                      <TableRow key={cardholder.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {cardholder.firstName || ''} {cardholder.lastName || ''}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {cardholder.email || cardholder.user?.email || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getCardholderStatusColor(cardholder.status)}
                          >
                            {t(`statuses.${cardholder.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {cardholder.phoneNumber || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {cardholder.cardsCount ?? 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(cardholder.createdAt)}
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
                                <Link href={`/dashboard/issuing/${cardholder.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {tCommon('viewDetails')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleOpenConfirmDialog(
                                  cardholder.id,
                                  'active',
                                  `${cardholder.firstName} ${cardholder.lastName}`
                                )}
                                disabled={cardholder.status === 'active'}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('cardholders.approve')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenConfirmDialog(
                                  cardholder.id,
                                  'rejected',
                                  `${cardholder.firstName} ${cardholder.lastName}`
                                )}
                                disabled={cardholder.status === 'rejected'}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                {t('cardholders.reject')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Confirm Status Change Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => {
        if (!open) setConfirmDialog({ open: false, cardholderId: '', action: 'active', name: '' });
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
                ? t('cardholders.confirmApproveDescription', { name: confirmDialog.name })
                : t('cardholders.confirmRejectDescription', { name: confirmDialog.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, cardholderId: '', action: 'active', name: '' })}
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
    </>
  );
}
