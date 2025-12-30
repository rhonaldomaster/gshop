'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { affiliatesService, type Affiliate } from '@/lib/affiliates.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Eye, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/api-client';
import { toast } from 'sonner';

export function PendingAffiliatesTable() {
  const t = useTranslations('affiliates');
  const tCommon = useTranslations('common');

  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingAffiliates();
  }, []);

  const fetchPendingAffiliates = async () => {
    try {
      setLoading(true);
      const response = await affiliatesService.getPendingAffiliates();
      setAffiliates(response.affiliates || []);
    } catch (error) {
      console.error('Error fetching pending affiliates:', error);
      toast.error(t('errorApproving'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAffiliate) return;

    try {
      setActionLoading(selectedAffiliate.id);
      await affiliatesService.approveAffiliate(selectedAffiliate.id);
      toast.success(t('approved'));
      setShowApproveDialog(false);
      setSelectedAffiliate(null);
      fetchPendingAffiliates();
    } catch (error) {
      console.error('Error approving affiliate:', error);
      toast.error(t('errorApproving'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedAffiliate) return;

    try {
      setActionLoading(selectedAffiliate.id);
      await affiliatesService.rejectAffiliate(selectedAffiliate.id, {
        reason: rejectionReason,
      });
      toast.success(t('rejected'));
      setShowRejectDialog(false);
      setSelectedAffiliate(null);
      setRejectionReason('');
      fetchPendingAffiliates();
    } catch (error) {
      console.error('Error rejecting affiliate:', error);
      toast.error(t('errorRejecting'));
    } finally {
      setActionLoading(null);
    }
  };

  const openApproveDialog = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setShowApproveDialog(true);
  };

  const openRejectDialog = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate);
    setShowRejectDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (affiliates.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          {t('noPendingAffiliates')}
        </h3>
        <p className="text-gray-500">{t('noPendingDescription')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('email')}</TableHead>
              <TableHead>{t('username')}</TableHead>
              <TableHead>{t('documentType')}</TableHead>
              <TableHead>{t('documentNumber')}</TableHead>
              <TableHead>{t('phone')}</TableHead>
              <TableHead>{t('appliedDate')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {affiliates.map((affiliate) => (
              <TableRow key={affiliate.id}>
                <TableCell className="font-medium">{affiliate.name}</TableCell>
                <TableCell>{affiliate.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">@{affiliate.username}</Badge>
                </TableCell>
                <TableCell>
                  {affiliate.documentType ? (
                    <Badge variant="secondary">{affiliate.documentType}</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {affiliate.documentNumber || (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {affiliate.phone || <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(affiliate.createdAt)}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openApproveDialog(affiliate)}
                    disabled={actionLoading === affiliate.id}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    {actionLoading === affiliate.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {t('approve')}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openRejectDialog(affiliate)}
                    disabled={actionLoading === affiliate.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    {t('reject')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('approveAffiliate')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmApprove')}
              {selectedAffiliate && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-2">
                  <p className="font-medium">{selectedAffiliate.name}</p>
                  <p className="text-sm text-gray-600">{selectedAffiliate.email}</p>
                  <p className="text-sm text-gray-600">@{selectedAffiliate.username}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('approve')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rejectAffiliate')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmReject')}
              {selectedAffiliate && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-md space-y-2">
                    <p className="font-medium">{selectedAffiliate.name}</p>
                    <p className="text-sm text-gray-600">{selectedAffiliate.email}</p>
                    <p className="text-sm text-gray-600">@{selectedAffiliate.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      {t('rejectionReason')}
                    </label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder={t('rejectionReasonPlaceholder')}
                      rows={4}
                    />
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('reject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
