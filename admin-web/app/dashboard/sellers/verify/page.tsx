'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface Seller {
  id: string
  businessName: string
  ownerName: string
  sellerType: string
  documentType: string
  documentNumber: string
  email: string
  phone: string
  bankName: string
  bankAccountType: string
  bankAccountNumber: string
  bankAccountHolder: string
  rutFileUrl?: string
  comercioFileUrl?: string
  verificationStatus: string
  adminMessage?: string
  adminMessageDate?: string
  reviewedBy?: string
  createdAt: string
}

type ReviewAction = 'approve' | 'reject' | 'needs_update'

export default function VerifySellersPage() {
  const t = useTranslations('sellers')
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<ReviewAction>('approve')
  const [modalMessage, setModalMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPendingSellers()
  }, [])

  const fetchPendingSellers = async () => {
    setLoading(true)
    try {
      const data = await apiClient.get<Seller[]>('/sellers/admin/pending-verifications')
      setSellers(data || [])
      setError('')
    } catch (err: any) {
      setError('Error al cargar vendedores pendientes')
      console.error('Error fetching pending sellers:', err)
      setSellers([])
    } finally {
      setLoading(false)
    }
  }

  const openReviewModal = (action: ReviewAction) => {
    setModalAction(action)
    setModalMessage('')
    setShowModal(true)
  }

  const handleReview = async () => {
    if (!selectedSeller) return

    // Validate message for reject and needs_update
    if ((modalAction === 'reject' || modalAction === 'needs_update') && !modalMessage.trim()) {
      alert('Por favor, escribe un mensaje explicando la razón de tu decisión')
      return
    }

    setSubmitting(true)
    try {
      const result = await apiClient.put<{ message: string; seller: Seller }>(
        `/sellers/${selectedSeller.id}/review`,
        {
          action: modalAction,
          message: modalMessage.trim() || undefined,
        }
      )

      alert(result.message)
      setShowModal(false)
      setSelectedSeller(null)
      fetchPendingSellers()
    } catch (err: any) {
      alert('Error al procesar la solicitud')
      console.error('Error reviewing seller:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      documents_uploaded: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      needs_update: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      documents_uploaded: 'Documentos Subidos',
      under_review: 'En Revisión',
      needs_update: 'Requiere Actualización',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
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
            <h1 className="text-3xl font-bold tracking-tight">{t('verifyTitle')}</h1>
            <p className="text-muted-foreground">{t('verifyDescription')}</p>
          </div>
          <Button variant="outline" onClick={fetchPendingSellers} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Content */}
        {sellers.length === 0 ? (
          <div className="bg-card rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">{t('noPendingSellers')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de vendedores pendientes */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                {t('pending')} ({sellers.length})
              </h2>
              {sellers.map((seller) => (
                <div
                  key={seller.id}
                  onClick={() => setSelectedSeller(seller)}
                  className={`bg-card border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition ${
                    selectedSeller?.id === seller.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <h3 className="font-semibold">{seller.businessName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {seller.documentType}: {seller.documentNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">{seller.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(seller.verificationStatus)}`}>
                      {getStatusLabel(seller.verificationStatus)}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {seller.sellerType === 'natural' ? 'Natural' : 'Jurídica'}
                    </span>
                  </div>
                  {seller.adminMessage && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                      Mensaje anterior: {seller.adminMessage.substring(0, 50)}...
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Detalles del vendedor seleccionado */}
            <div>
              {selectedSeller ? (
                <div className="bg-card border rounded-lg p-6 sticky top-6">
                  <h2 className="text-2xl font-bold mb-4">{selectedSeller.businessName}</h2>

                  {/* Estado actual */}
                  <div className="mb-4">
                    <span
                      className={`text-sm px-3 py-1 rounded-full ${getStatusBadge(selectedSeller.verificationStatus)}`}
                    >
                      {getStatusLabel(selectedSeller.verificationStatus)}
                    </span>
                  </div>

                  {/* Mensaje anterior del admin */}
                  {selectedSeller.adminMessage && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-semibold text-amber-900 mb-1">Mensaje anterior:</p>
                      <p className="text-sm text-amber-800">{selectedSeller.adminMessage}</p>
                      {selectedSeller.adminMessageDate && (
                        <p className="text-xs text-amber-600 mt-1">
                          {new Date(selectedSeller.adminMessageDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="font-medium">Tipo:</span>
                      <span>{selectedSeller.sellerType === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}</span>

                      <span className="font-medium">Documento:</span>
                      <span>
                        {selectedSeller.documentType} - {selectedSeller.documentNumber}
                      </span>

                      <span className="font-medium">Propietario:</span>
                      <span>{selectedSeller.ownerName}</span>

                      <span className="font-medium">Email:</span>
                      <span className="break-all">{selectedSeller.email}</span>

                      <span className="font-medium">Teléfono:</span>
                      <span>{selectedSeller.phone}</span>

                      <span className="font-medium">Banco:</span>
                      <span>{selectedSeller.bankName}</span>

                      <span className="font-medium">Tipo cuenta:</span>
                      <span className="capitalize">{selectedSeller.bankAccountType}</span>

                      <span className="font-medium">N° Cuenta:</span>
                      <span>{selectedSeller.bankAccountNumber}</span>

                      <span className="font-medium">Titular:</span>
                      <span>{selectedSeller.bankAccountHolder}</span>
                    </div>

                    {/* Documentos */}
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-2">Documentos</h3>
                      <div className="space-y-2">
                        {selectedSeller.rutFileUrl && (
                          <a
                            href={selectedSeller.rutFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-primary hover:underline text-sm"
                          >
                            📄 Ver RUT
                          </a>
                        )}
                        {selectedSeller.comercioFileUrl && (
                          <a
                            href={selectedSeller.comercioFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-primary hover:underline text-sm"
                          >
                            📄 Ver Cámara de Comercio
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="border-t pt-4 mt-4 space-y-2">
                      <Button onClick={() => openReviewModal('approve')} className="w-full bg-green-600 hover:bg-green-700">
                        ✓ Aprobar Vendedor
                      </Button>
                      <Button
                        onClick={() => openReviewModal('needs_update')}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        ⚠ Solicitar Actualización
                      </Button>
                      <Button
                        onClick={() => openReviewModal('reject')}
                        variant="destructive"
                        className="w-full"
                      >
                        ✗ Rechazar Vendedor
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border rounded-lg p-6 text-center">
                  <p className="text-muted-foreground">{t('selectSellerToView')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de confirmación */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">
                {modalAction === 'approve' && 'Aprobar Vendedor'}
                {modalAction === 'reject' && 'Rechazar Vendedor'}
                {modalAction === 'needs_update' && 'Solicitar Actualización'}
              </h3>

              {modalAction === 'approve' && (
                <p className="text-muted-foreground mb-4">
                  El vendedor recibirá un email de aprobación y podrá empezar a vender en la plataforma.
                </p>
              )}

              {(modalAction === 'reject' || modalAction === 'needs_update') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    {modalAction === 'reject' ? 'Razón del rechazo' : 'Detalles de lo que debe actualizar'}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={modalMessage}
                    onChange={(e) => setModalMessage(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[100px] bg-background"
                    placeholder={
                      modalAction === 'reject'
                        ? 'Ej: Los documentos no son legibles, el RUT no corresponde al nombre...'
                        : 'Ej: Por favor actualiza tu RUT, la imagen no es clara...'
                    }
                  />
                </div>
              )}

              {modalAction === 'approve' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Mensaje opcional al vendedor</label>
                  <textarea
                    value={modalMessage}
                    onChange={(e) => setModalMessage(e.target.value)}
                    className="w-full border rounded-lg p-3 min-h-[60px] bg-background"
                    placeholder="Ej: Bienvenido a GSHOP..."
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting} className="flex-1">
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
