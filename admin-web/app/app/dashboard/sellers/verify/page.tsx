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
  createdAt: string
}

export default function VerifySellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const handleVerify = async (sellerId: string, approved: boolean, notes?: string) => {
    try {
      const response = await fetch(`http://localhost:3000/sellers/${sellerId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ approved, notes }),
      })

      if (!response.ok) {
        throw new Error('Error al verificar vendedor')
      }

      alert(approved ? 'Vendedor aprobado exitosamente' : 'Vendedor rechazado')
      fetchPendingSellers()
      setSelectedSeller(null)
    } catch (err: any) {
      alert(err.message)
    }
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
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    {seller.verificationStatus}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {seller.sellerType}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Detalles del vendedor seleccionado */}
          <div>
            {selectedSeller ? (
              <div className="border rounded-lg p-6 bg-white sticky top-6">
                <h2 className="text-2xl font-bold mb-4">{selectedSeller.businessName}</h2>

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
                      onClick={() => handleVerify(selectedSeller.id, true)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
                    >
                      ✓ Aprobar Vendedor
                    </button>
                    <button
                      onClick={() => {
                        const notes = prompt('Razón del rechazo:')
                        if (notes) handleVerify(selectedSeller.id, false, notes)
                      }}
                      className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium"
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
    </div>
  )
}
