'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const BANCOS_COLOMBIA = [
  'Bancolombia',
  'Banco de Bogotá',
  'Davivienda',
  'BBVA Colombia',
  'Banco Popular',
  'Banco de Occidente',
  'Banco Caja Social',
  'Banco AV Villas',
  'Nequi',
  'Daviplata',
]

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    sellerType: 'natural' as 'natural' | 'juridica',
    documentType: 'CC' as 'CC' | 'CE' | 'NIT' | 'PASSPORT',
    documentNumber: '',
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    bankName: '',
    bankAccountType: 'ahorros' as 'ahorros' | 'corriente',
    bankAccountNumber: '',
    bankAccountHolder: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al registrar vendedor')
      }

      const data = await response.json()
      // Redirigir a subir documentos
      router.push(`/register/documents?sellerId=${data.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">Registro de Vendedor</h1>
          <p className="text-gray-600 mb-6">Complete los datos para comenzar a vender en GSHOP</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Vendedor */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Vendedor</label>
              <select
                value={formData.sellerType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sellerType: e.target.value as 'natural' | 'juridica',
                    documentType: e.target.value === 'juridica' ? 'NIT' : 'CC',
                  })
                }
                className="w-full border rounded-lg p-2"
              >
                <option value="natural">Persona Natural</option>
                <option value="juridica">Persona Jurídica (Empresa)</option>
              </select>
            </div>

            {/* Tipo de Documento */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
                disabled={formData.sellerType === 'juridica'}
                className="w-full border rounded-lg p-2 disabled:bg-gray-100"
              >
                {formData.sellerType === 'natural' ? (
                  <>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="PASSPORT">Pasaporte</option>
                  </>
                ) : (
                  <option value="NIT">NIT (Número de Identificación Tributaria)</option>
                )}
              </select>
            </div>

            {/* Número de Documento */}
            <div>
              <label className="block text-sm font-medium mb-2">Número de Documento</label>
              <input
                type="text"
                value={formData.documentNumber}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                placeholder="Sin puntos ni guiones"
                className="w-full border rounded-lg p-2"
                required
              />
            </div>

            {/* Nombre del Negocio */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.sellerType === 'juridica' ? 'Razón Social' : 'Nombre del Negocio'}
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>

            {/* Nombre del Propietario */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.sellerType === 'juridica' ? 'Representante Legal' : 'Nombre del Propietario'}
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ownerName: e.target.value,
                    bankAccountHolder: e.target.value, // Auto-llenar titular
                  })
                }
                className="w-full border rounded-lg p-2"
                required
              />
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="3001234567"
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>
            </div>

            {/* DATOS BANCARIOS */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Datos Bancarios para Pagos</h2>

              <div className="space-y-4">
                {/* Banco */}
                <div>
                  <label className="block text-sm font-medium mb-2">Banco</label>
                  <select
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full border rounded-lg p-2"
                    required
                  >
                    <option value="">Seleccione un banco</option>
                    {BANCOS_COLOMBIA.map((banco) => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Cuenta */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Cuenta</label>
                  <select
                    value={formData.bankAccountType}
                    onChange={(e) =>
                      setFormData({ ...formData, bankAccountType: e.target.value as 'ahorros' | 'corriente' })
                    }
                    className="w-full border rounded-lg p-2"
                    required
                  >
                    <option value="ahorros">Ahorros</option>
                    <option value="corriente">Corriente</option>
                  </select>
                </div>

                {/* Número de Cuenta */}
                <div>
                  <label className="block text-sm font-medium mb-2">Número de Cuenta</label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="Sin espacios ni guiones"
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>

                {/* Titular (auto-llenado) */}
                <div>
                  <label className="block text-sm font-medium mb-2">Titular de la Cuenta</label>
                  <input
                    type="text"
                    value={formData.bankAccountHolder}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    className="w-full border rounded-lg p-2 bg-gray-50"
                    readOnly
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Debe coincidir con el nombre del propietario/representante legal
                  </p>
                </div>
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border rounded-lg p-2"
                minLength={8}
                required
              />
              <p className="text-sm text-gray-500 mt-1">Mínimo 8 caracteres</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Registrando...' : 'Continuar a Subir Documentos'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <a href="/auth/login" className="text-blue-600 hover:underline">
              Inicia sesión aquí
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
