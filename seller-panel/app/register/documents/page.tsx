'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function DocumentsForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sellerId = searchParams.get('sellerId')

  const [files, setFiles] = useState({
    rut: null as File | null,
    comercio: null as File | null,
  })
  const [comercioExpirationDate, setComercioExpirationDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (field: 'rut' | 'comercio', file: File | null) => {
    setFiles({ ...files, [field]: file })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!files.rut) {
      setError('El RUT es obligatorio')
      return
    }

    if (!sellerId) {
      setError('ID de vendedor no encontrado')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('rut', files.rut)
      if (files.comercio) {
        formData.append('comercio', files.comercio)
        formData.append('comercioExpirationDate', comercioExpirationDate)
      }

      const response = await fetch(`http://localhost:3000/sellers/${sellerId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al subir documentos')
      }

      alert('Documentos subidos exitosamente. Pendiente de verificación.')
      router.push('/auth/login')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">Subir Documentos Requeridos</h1>
          <p className="text-gray-600 mb-6">Por favor suba los documentos para completar su registro</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* RUT (Obligatorio) */}
            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">
                RUT (Registro Único Tributario) <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => handleFileChange('rut', e.target.files?.[0] || null)}
                className="w-full"
                required
              />
              <p className="text-sm text-gray-500 mt-2">Archivo PDF o imagen, máximo 5MB</p>
              {files.rut && (
                <p className="text-sm text-green-600 mt-2">✓ Archivo seleccionado: {files.rut.name}</p>
              )}
            </div>

            {/* Cámara de Comercio (Opcional para naturales) */}
            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">
                Certificado de Cámara de Comercio <span className="text-gray-400">(Opcional)</span>
              </label>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => handleFileChange('comercio', e.target.files?.[0] || null)}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-2">
                Obligatorio para personas jurídicas. Debe tener máximo 30 días de expedición.
              </p>

              {files.comercio && (
                <>
                  <p className="text-sm text-green-600 mt-2">✓ Archivo seleccionado: {files.comercio.name}</p>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Fecha de Expedición</label>
                    <input
                      type="date"
                      value={comercioExpirationDate}
                      onChange={(e) => setComercioExpirationDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || !files.rut}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploading ? 'Subiendo...' : 'Enviar Documentos para Verificación'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2">📌 Próximos Pasos</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Tus documentos serán revisados por nuestro equipo de verificación</li>
              <li>Recibirás un email cuando tu cuenta sea aprobada o si se requieren cambios</li>
              <li>El proceso de verificación toma entre 1-3 días hábiles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <DocumentsForm />
    </Suspense>
  )
}
