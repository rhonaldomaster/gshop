'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Eye, CheckCircle, XCircle, AlertCircle, Clock, Users, Shield, ShieldCheck, ShieldAlert } from 'lucide-react'
import { apiClient, formatDate } from '@/lib/api-client'
import Link from 'next/link'

interface Verification {
  id: string
  userId: string
  level: string
  verificationStatus: string
  fullLegalName?: string
  documentType?: string
  documentNumber?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
}

interface VerificationStats {
  totalPending: number
  totalUnderReview: number
  totalApproved: number
  totalRejected: number
  totalNeedsUpdate: number
  pendingLevel1: number
  pendingLevel2: number
  avgReviewTimeHours: number
}

type ReviewAction = 'approve' | 'reject' | 'needs_update'

export default function VerificationsPage() {
  const t = useTranslations('verifications')
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [stats, setStats] = useState<VerificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<ReviewAction>('approve')
  const [modalMessage, setModalMessage] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [statusFilter, levelFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (levelFilter && levelFilter !== 'all') {
        params.append('level', levelFilter)
      }

      const [verificationsData, statsData] = await Promise.all([
        apiClient.get<{ data: Verification[]; total: number }>(
          `/verifications${statusFilter === 'pending' ? '/pending' : ''}?${params.toString()}`
        ),
        apiClient.get<VerificationStats>('/verifications/stats'),
      ])

      setVerifications(verificationsData?.data || [])
      setStats(statsData)
      setError('')
    } catch (err: any) {
      setError('Error al cargar verificaciones')
      console.error('Error fetching verifications:', err)
      setVerifications([])
    } finally {
      setLoading(false)
    }
  }

  const openReviewModal = (verification: Verification, action: ReviewAction) => {
    setSelectedVerification(verification)
    setModalAction(action)
    setModalMessage('')
    setAdminNotes('')
    setShowModal(true)
  }

  const handleReview = async () => {
    if (!selectedVerification) return

    if ((modalAction === 'reject' || modalAction === 'needs_update') && !modalMessage.trim()) {
      alert(t('review.reasonRequired'))
      return
    }

    setSubmitting(true)
    try {
      await apiClient.put(`/verifications/${selectedVerification.id}/review`, {
        action: modalAction,
        message: modalMessage.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
      })

      const successMessages = {
        approve: t('review.successApproved'),
        reject: t('review.successRejected'),
        needs_update: t('review.successNeedsUpdate'),
      }

      alert(successMessages[modalAction])
      setShowModal(false)
      setSelectedVerification(null)
      fetchData()
    } catch (err: any) {
      alert(t('review.error'))
      console.error('Error reviewing verification:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      not_started: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      needs_update: 'bg-orange-100 text-orange-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getLevelBadge = (level: string) => {
    const styles: Record<string, string> = {
      none: 'bg-gray-100 text-gray-600',
      level_1: 'bg-blue-100 text-blue-700',
      level_2: 'bg-purple-100 text-purple-700',
    }
    return styles[level] || 'bg-gray-100 text-gray-600'
  }

  if (loading && !verifications.length) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh') || 'Actualizar'}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.pending')}</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPending + stats.totalUnderReview}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingLevel1} Nivel 1, {stats.pendingLevel2} Nivel 2
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.approved')}</CardTitle>
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalApproved}</div>
                <p className="text-xs text-muted-foreground">Usuarios verificados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.rejected')}</CardTitle>
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.totalRejected}</div>
                <p className="text-xs text-muted-foreground">{stats.totalNeedsUpdate} requieren actualizar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.avgReviewTime')}</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgReviewTimeHours.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">Promedio de revisión</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('filters.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allStatus')}</SelectItem>
              <SelectItem value="pending">{t('status.pending')}</SelectItem>
              <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
              <SelectItem value="approved">{t('status.approved')}</SelectItem>
              <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
              <SelectItem value="needs_update">{t('status.needs_update')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('filters.allLevels')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allLevels')}</SelectItem>
              <SelectItem value="none">{t('level.none')}</SelectItem>
              <SelectItem value="level_1">{t('level.level_1')}</SelectItem>
              <SelectItem value="level_2">{t('level.level_2')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        {/* Verifications Table */}
        {verifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t('empty.noPending')}</h3>
              <p className="text-muted-foreground">{t('empty.noPendingDescription')}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.user')}</TableHead>
                    <TableHead>{t('fields.documentType')}</TableHead>
                    <TableHead>{t('fields.documentNumber')}</TableHead>
                    <TableHead>{t('table.level')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.submittedAt')}</TableHead>
                    <TableHead className="text-right">{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifications.map((verification) => (
                    <TableRow key={verification.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {verification.user
                              ? `${verification.user.firstName} ${verification.user.lastName}`
                              : verification.fullLegalName || 'N/A'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {verification.user?.email || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {verification.documentType
                          ? t(`documentType.${verification.documentType}`)
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{verification.documentNumber || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getLevelBadge(verification.level)}>
                          {t(`level.${verification.level}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(verification.verificationStatus)}>
                          {t(`status.${verification.verificationStatus}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(verification.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/dashboard/verifications/${verification.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {(verification.verificationStatus === 'pending' ||
                            verification.verificationStatus === 'under_review' ||
                            verification.verificationStatus === 'needs_update') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => openReviewModal(verification, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:text-orange-700"
                                onClick={() => openReviewModal(verification, 'needs_update')}
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => openReviewModal(verification, 'reject')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Review Modal */}
        {showModal && selectedVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">
                {modalAction === 'approve' && t('review.approveTitle')}
                {modalAction === 'reject' && t('review.rejectTitle')}
                {modalAction === 'needs_update' && t('review.needsUpdateTitle')}
              </h3>

              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="font-medium">
                  {selectedVerification.user
                    ? `${selectedVerification.user.firstName} ${selectedVerification.user.lastName}`
                    : selectedVerification.fullLegalName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedVerification.documentType}: {selectedVerification.documentNumber}
                </p>
              </div>

              {modalAction === 'approve' && (
                <p className="text-muted-foreground mb-4">{t('review.approveMessage')}</p>
              )}

              {(modalAction === 'reject' || modalAction === 'needs_update') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    {t('review.reasonLabel')}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={modalMessage}
                    onChange={(e) => setModalMessage(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[100px] bg-background"
                    placeholder={t('review.reasonPlaceholder')}
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {t('review.adminNotesLabel')}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full border rounded-lg p-3 min-h-[60px] bg-background"
                  placeholder={t('review.adminNotesPlaceholder')}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={submitting}
                  className={`flex-1 ${
                    modalAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : modalAction === 'needs_update'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Procesando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
