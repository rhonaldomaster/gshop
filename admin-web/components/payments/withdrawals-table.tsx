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
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  MoreHorizontal,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { apiClient, formatCurrency, formatDate } from '@/lib/api-client';

interface Withdrawal {
  id: string;
  seller: {
    id: string;
    businessName: string;
    email: string;
  };
  amount: number;
  status: string;
  requestedAt: string;
  processedAt?: string;
  notes?: string;
}

const getWithdrawalStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getWithdrawalStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'approved':
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'rejected':
      return <XCircle className="h-4 w-4" />;
    default:
      return <DollarSign className="h-4 w-4" />;
  }
};

export function WithdrawalsTable() {
  const t = useTranslations('payments');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, [searchTerm, statusFilter]);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      // Note: This endpoint doesn't exist in backend yet
      const response = await apiClient.get<Withdrawal[]>(`/sellers/withdrawals?${params}`);
      setWithdrawals(response || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      // Mock data for demo
      setWithdrawals([
        {
          id: '1',
          seller: {
            id: 's1',
            businessName: 'TechStore Colombia',
            email: 'seller@techstore.com',
          },
          amount: 5000000,
          status: 'pending',
          requestedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: '2',
          seller: {
            id: 's2',
            businessName: 'Fashion Boutique',
            email: 'seller@fashionboutique.com',
          },
          amount: 3500000,
          status: 'pending',
          requestedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          seller: {
            id: 's3',
            businessName: 'Electronics Plus',
            email: 'seller@electronicsplus.com',
          },
          amount: 8000000,
          status: 'completed',
          requestedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          processedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string, notes: string) => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/payments/withdrawals/${withdrawalId}/approve`, {
        notes,
      });
      // Refresh withdrawals
      fetchWithdrawals();
      setSelectedWithdrawal(null);
      setActionNotes('');
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Error approving withdrawal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string, notes: string) => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/payments/withdrawals/${withdrawalId}/reject`, {
        notes,
      });
      // Refresh withdrawals
      fetchWithdrawals();
      setSelectedWithdrawal(null);
      setActionNotes('');
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Error rejecting withdrawal. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="gshop-card">
        <CardHeader>
          <CardTitle>{t('loadingWithdrawals')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
          <CardTitle>{t('sellerWithdrawalRequests')}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                placeholder={t('searchWithdrawals')}
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
                <SelectItem value="pending">{t('withdrawalPending')}</SelectItem>
                <SelectItem value="approved">{t('withdrawalApproved')}</SelectItem>
                <SelectItem value="rejected">{t('withdrawalRejected')}</SelectItem>
                <SelectItem value="completed">{t('withdrawalCompleted')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {withdrawals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('noWithdrawalRequests')}</h3>
            <p>{t('withdrawalsWillAppearHere')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('seller')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('requested')}</TableHead>
                  <TableHead>{t('processed')}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{withdrawal.seller.businessName}</div>
                        <div className="text-sm text-muted-foreground">
                          {withdrawal.seller.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-lg">
                        {formatCurrency(withdrawal.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 w-fit ${getWithdrawalStatusColor(withdrawal.status)}`}
                      >
                        {getWithdrawalStatusIcon(withdrawal.status)}
                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(withdrawal.requestedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {withdrawal.processedAt ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(withdrawal.processedAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setSelectedWithdrawal(withdrawal);
                                }}
                                disabled={withdrawal.status !== 'pending'}
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                {t('approve')}
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('approveWithdrawal')}</DialogTitle>
                                <DialogDescription>
                                  {t('approveWithdrawalFor')} {selectedWithdrawal?.seller.businessName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">{t('amount')}</label>
                                  <div className="text-2xl font-bold">
                                    {formatCurrency(selectedWithdrawal?.amount || 0)}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">{t('notesOptional')}</label>
                                  <Textarea
                                    placeholder={t('addNotesForSeller')}
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedWithdrawal(null);
                                    setActionNotes('');
                                  }}
                                >
                                  {t('cancel')}
                                </Button>
                                <Button
                                  onClick={() => handleApproveWithdrawal(
                                    selectedWithdrawal?.id || '',
                                    actionNotes
                                  )}
                                  disabled={isProcessing}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {isProcessing ? t('processing') : t('approveWithdrawal')}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setSelectedWithdrawal(withdrawal);
                                }}
                                disabled={withdrawal.status !== 'pending'}
                              >
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                {t('reject')}
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('rejectWithdrawal')}</DialogTitle>
                                <DialogDescription>
                                  {t('rejectWithdrawalFor')} {selectedWithdrawal?.seller.businessName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">{t('amount')}</label>
                                  <div className="text-2xl font-bold">
                                    {formatCurrency(selectedWithdrawal?.amount || 0)}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">{t('reasonForRejection')}</label>
                                  <Textarea
                                    placeholder={t('provideRejectionReason')}
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                    rows={3}
                                    required
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedWithdrawal(null);
                                    setActionNotes('');
                                  }}
                                >
                                  {t('cancel')}
                                </Button>
                                <Button
                                  onClick={() => handleRejectWithdrawal(
                                    selectedWithdrawal?.id || '',
                                    actionNotes
                                  )}
                                  disabled={isProcessing || !actionNotes}
                                  variant="destructive"
                                >
                                  {isProcessing ? t('processing') : t('rejectWithdrawal')}
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
