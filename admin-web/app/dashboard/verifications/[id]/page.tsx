'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  FileText,
  MapPin,
  Briefcase,
  Calendar,
  Shield,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react'
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
  documentFrontUrl?: string
  documentBackUrl?: string
  selfieUrl?: string
  selfieVerified: boolean
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  sourceOfFunds?: string
  occupation?: string
  monthlyIncome?: string
  rejectionReason?: string
  verifiedBy?: string
  verifiedAt?: string
  level1SubmittedAt?: string
  level1ApprovedAt?: string
  level2SubmittedAt?: string
  level2ApprovedAt?: string
  reviewAttempts: number
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

type ReviewAction = 'approve' | 'reject' | 'needs_update'

const getImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '')
  return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

export default function VerificationDetailPage() {
  const t = useTranslations('verifications')
  const params = useParams()
  const router = useRouter()
  const verificationId = params.id as string

  const [verification, setVerification] = useState<Verification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<ReviewAction>('approve')
  const [modalMessage, setModalMessage] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [imageModal, setImageModal] = useState<string | null>(null)

  useEffect(() => {
    fetchVerification()
  }, [verificationId])

  const fetchVerification = async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<Verification>(`/verifications/${verificationId}`)
      setVerification(data)
      setError('')
    } catch (err: any) {
      setError(t('detail.loadError'))
      console.error('Error fetching verification:', err)
    } finally {
      setLoading(false)
    }
  }

  const openReviewModal = (action: ReviewAction) => {
    setModalAction(action)
    setModalMessage('')
    setAdminNotes('')
    setShowModal(true)
  }

  const handleReview = async () => {
    if (!verification) return

    if ((modalAction === 'reject' || modalAction === 'needs_update') && !modalMessage.trim()) {
      alert(t('review.reasonRequired'))
      return
    }

    setSubmitting(true)
    try {
      await apiClient.put(`/verifications/${verification.id}/review`, {
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
      fetchVerification()
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

  const canReview =
    verification?.verificationStatus === 'pending' ||
    verification?.verificationStatus === 'under_review' ||
    verification?.verificationStatus === 'needs_update'

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !verification) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error || t('detail.notFound')}
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back')}
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t('detail.title')}</h1>
              <p className="text-muted-foreground">
                {verification.user
                  ? `${verification.user.firstName} ${verification.user.lastName}`
                  : verification.fullLegalName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getLevelBadge(verification.level)}>
              {t(`level.${verification.level}`)}
            </Badge>
            <Badge className={getStatusBadge(verification.verificationStatus)}>
              {t(`status.${verification.verificationStatus}`)}
            </Badge>
          </div>
        </div>

        {/* Rejection Reason Alert */}
        {verification.rejectionReason && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">{t('detail.previousRejection')}</p>
                <p className="text-orange-700">{verification.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('detail.userInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.fullLegalName')}</p>
                  <p className="font-medium">{verification.fullLegalName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.email')}</p>
                  <p className="font-medium">{verification.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.phone')}</p>
                  <p className="font-medium">{verification.user?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('fields.dateOfBirth')}</p>
                  <p className="font-medium">
                    {verification.dateOfBirth
                      ? new Date(verification.dateOfBirth).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Level 1 Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('detail.level1Info')}
                </CardTitle>
                <CardDescription>{t('detail.level1Description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fields.documentType')}</p>
                    <p className="font-medium">
                      {verification.documentType
                        ? t(`documentType.${verification.documentType}`)
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fields.documentNumber')}</p>
                    <p className="font-medium">{verification.documentNumber || 'N/A'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-3">{t('documents.title')}</p>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Document Front */}
                    <div
                      className={`border rounded-lg p-4 text-center ${
                        verification.documentFrontUrl
                          ? 'cursor-pointer hover:bg-muted/50'
                          : 'bg-muted/30'
                      }`}
                      onClick={() =>
                        verification.documentFrontUrl &&
                        setImageModal(getImageUrl(verification.documentFrontUrl)!)
                      }
                    >
                      {verification.documentFrontUrl ? (
                        <img
                          src={getImageUrl(verification.documentFrontUrl)}
                          alt="Document Front"
                          className="w-full h-20 object-cover rounded mb-2"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t('documents.documentFront')}
                      </p>
                      {verification.documentFrontUrl && (
                        <a
                          href={getImageUrl(verification.documentFrontUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center justify-center gap-1 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t('documents.open')}
                        </a>
                      )}
                    </div>

                    {/* Document Back */}
                    <div
                      className={`border rounded-lg p-4 text-center ${
                        verification.documentBackUrl
                          ? 'cursor-pointer hover:bg-muted/50'
                          : 'bg-muted/30'
                      }`}
                      onClick={() =>
                        verification.documentBackUrl && setImageModal(getImageUrl(verification.documentBackUrl)!)
                      }
                    >
                      {verification.documentBackUrl ? (
                        <img
                          src={getImageUrl(verification.documentBackUrl)}
                          alt="Document Back"
                          className="w-full h-20 object-cover rounded mb-2"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      )}
                      <p className="text-xs text-muted-foreground">{t('documents.documentBack')}</p>
                      {verification.documentBackUrl && (
                        <a
                          href={getImageUrl(verification.documentBackUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center justify-center gap-1 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t('documents.open')}
                        </a>
                      )}
                    </div>

                    {/* Selfie */}
                    <div
                      className={`border rounded-lg p-4 text-center ${
                        verification.selfieUrl ? 'cursor-pointer hover:bg-muted/50' : 'bg-muted/30'
                      }`}
                      onClick={() =>
                        verification.selfieUrl && setImageModal(getImageUrl(verification.selfieUrl)!)
                      }
                    >
                      {verification.selfieUrl ? (
                        <img
                          src={getImageUrl(verification.selfieUrl)}
                          alt="Selfie"
                          className="w-full h-20 object-cover rounded mb-2"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      )}
                      <p className="text-xs text-muted-foreground">{t('documents.selfie')}</p>
                      {verification.selfieUrl && (
                        <a
                          href={getImageUrl(verification.selfieUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center justify-center gap-1 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          {t('documents.open')}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level 2 Info Card */}
            {(verification.address ||
              verification.sourceOfFunds ||
              verification.occupation) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t('detail.level2Info')}
                  </CardTitle>
                  <CardDescription>{t('detail.level2Description')}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{t('fields.address')}</p>
                    <p className="font-medium">{verification.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fields.city')}</p>
                    <p className="font-medium">{verification.city || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fields.state')}</p>
                    <p className="font-medium">{verification.state || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fields.postalCode')}</p>
                    <p className="font-medium">{verification.postalCode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fields.country')}</p>
                    <p className="font-medium">{verification.country || 'Colombia'}</p>
                  </div>
                  <Separator className="col-span-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fields.occupation')}</p>
                    <p className="font-medium">{verification.occupation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fields.monthlyIncome')}</p>
                    <p className="font-medium">{verification.monthlyIncome || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{t('fields.sourceOfFunds')}</p>
                    <p className="font-medium">{verification.sourceOfFunds || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            {canReview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t('detail.actions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => openReviewModal('approve')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('actions.approve')}
                  </Button>
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => openReviewModal('needs_update')}
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {t('actions.needsUpdate')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => openReviewModal('reject')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t('actions.reject')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Review History Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {t('detail.reviewHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('detail.attempts')}</p>
                  <p className="font-medium">{verification.reviewAttempts}</p>
                </div>
                {verification.level1SubmittedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('detail.level1Submitted')}</p>
                    <p className="font-medium">{formatDate(verification.level1SubmittedAt)}</p>
                  </div>
                )}
                {verification.level1ApprovedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('detail.level1Approved')}</p>
                    <p className="font-medium">{formatDate(verification.level1ApprovedAt)}</p>
                  </div>
                )}
                {verification.level2SubmittedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('detail.level2Submitted')}</p>
                    <p className="font-medium">{formatDate(verification.level2SubmittedAt)}</p>
                  </div>
                )}
                {verification.level2ApprovedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('detail.level2Approved')}</p>
                    <p className="font-medium">{formatDate(verification.level2ApprovedAt)}</p>
                  </div>
                )}
                {verification.verifiedAt && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('detail.reviewedAt')}</p>
                      <p className="font-medium">{formatDate(verification.verifiedAt)}</p>
                    </div>
                  </>
                )}
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">{t('detail.created')}</p>
                  <p className="font-medium">{formatDate(verification.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('detail.updated')}</p>
                  <p className="font-medium">{formatDate(verification.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Preview Modal */}
        {imageModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setImageModal(null)}
          >
            <div className="max-w-4xl max-h-[90vh] p-4">
              <img
                src={imageModal}
                alt="Document Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <p className="text-white text-center mt-2">{t('detail.clickToClose')}</p>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">
                {modalAction === 'approve' && t('review.approveTitle')}
                {modalAction === 'reject' && t('review.rejectTitle')}
                {modalAction === 'needs_update' && t('review.needsUpdateTitle')}
              </h3>

              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="font-medium">
                  {verification.user
                    ? `${verification.user.firstName} ${verification.user.lastName}`
                    : verification.fullLegalName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {verification.documentType}: {verification.documentNumber}
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
                  {t('review.cancel')}
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
                  {submitting ? t('review.processing') : t('review.confirm')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
