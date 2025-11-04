'use client'

import { useState, useEffect } from 'react'

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
    try {
      const response = await fetch('http://localhost:3000/sellers/admin/pending-verifications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Error al cargar vendedores pendientes')
      }

      const data = await response.json()
      setSellers(data)
    } catch (err: any) {
      setError(err.message)
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

    // Validar que se ingrese mensaje para reject y needs_update
    if ((modalAction === 'reject' || modalAction === 'needs_update') && !modalMessage.trim()) {
      alert('Por favor, escribe un mensaje explicando la razón de tu decisión')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`http://localhost:3000/sellers/${selectedSeller.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: modalAction,
          message: modalMessage.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al procesar la solicitud')
      }

      const result = await response.json()
      alert(result.message)
      setShowModal(false)
      setSelectedSeller(null)
      fetchPendingSellers()
    } catch (err: any) {
      alert(err.message)
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
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Verificar Vendedores</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {sellers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No hay vendedores pendientes de verificación</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* Lista de vendedores pendientes */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Pendientes ({sellers.length})</h2>
            {sellers.map((seller) => (
              <div
                key={seller.id}
                onClick={() => setSelectedSeller(seller)}
                className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition ${
                  selectedSeller?.id === seller.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <h3 className="font-semibold">{seller.businessName}</h3>
                <p className="text-sm text-gray-600">
                  {seller.documentType}: {seller.documentNumber}
                </p>
                <p className="text-sm text-gray-600">{seller.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(seller.verificationStatus)}`}>
                    {getStatusLabel(seller.verificationStatus)}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {seller.sellerType === 'natural' ? 'Natural' : 'Jurídica'}
                  </span>
                </div>
                {seller.adminMessage && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    Mensaje anterior: {seller.adminMessage.substring(0, 50)}...
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detalles del vendedor seleccionado */}
          <div>
            {selectedSeller ? (
              <div className="border rounded-lg p-6 bg-white sticky top-6">
                <h2 className="text-2xl font-bold mb-4">{selectedSeller.businessName}</h2>

                {/* Estado actual */}
                <div className="mb-4">
                  <span className={`text-sm px-3 py-1 rounded-full ${getStatusBadge(selectedSeller.verificationStatus)}`}>
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
                    <span>{selectedSeller.email}</span>

                    <span className="font-medium">Teléfono:</span>
                    <span>{selectedSeller.phone}</span>

                    <span className="font-medium">Banco:</span>
                    <span>{selectedSeller.bankName}</span>

                    <span className="font-medium">Tipo cuenta:</span>
                    <span>{selectedSeller.bankAccountType}</span>

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
                          className="block text-blue-600 hover:underline text-sm"
                        >
                          📄 Ver RUT
                        </a>
                      )}
                      {selectedSeller.comercioFileUrl && (
                        <a
                          href={selectedSeller.comercioFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:underline text-sm"
                        >
                          📄 Ver Cámara de Comercio
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <button
                      onClick={() => openReviewModal('approve')}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition"
                    >
                      ✓ Aprobar Vendedor
                    </button>
                    <button
                      onClick={() => openReviewModal('needs_update')}
                      className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 font-medium transition"
                    >
                      ⚠ Solicitar Actualización
                    </button>
                    <button
                      onClick={() => openReviewModal('reject')}
                      className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium transition"
                    >
                      ✗ Rechazar Vendedor
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-6 bg-gray-50 text-center">
                <p className="text-gray-600">Selecciona un vendedor para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {modalAction === 'approve' && 'Aprobar Vendedor'}
              {modalAction === 'reject' && 'Rechazar Vendedor'}
              {modalAction === 'needs_update' && 'Solicitar Actualización'}
            </h3>

            {modalAction === 'approve' && (
              <p className="text-gray-600 mb-4">
                El vendedor recibirá un email de aprobación y podrá empezar a vender en la plataforma.
              </p>
            )}

            {(modalAction === 'reject' || modalAction === 'needs_update') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {modalAction === 'reject' ? 'Razón del rechazo' : 'Detalles de lo que debe actualizar'}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={modalMessage}
                  onChange={(e) => setModalMessage(e.target.value)}
                  className="w-full border rounded-lg p-3 min-h-[100px]"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje opcional al vendedor
                </label>
                <textarea
                  value={modalMessage}
                  onChange={(e) => setModalMessage(e.target.value)}
                  className="w-full border rounded-lg p-3 min-h-[60px]"
                  placeholder="Ej: Bienvenido a GSHOP..."
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleReview}
                disabled={submitting}
                className={`flex-1 py-2 rounded-lg font-medium transition ${
                  modalAction === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : modalAction === 'needs_update'
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {submitting ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
