'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ColombiaLocationSelector } from '@/components/ColombiaLocationSelector'

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

interface RegistrationData {
  sellerType: 'natural' | 'juridica'
  email: string
  password: string
  confirmPassword: string
  businessName: string
  ownerName: string
  documentType: 'CC' | 'CE' | 'NIT' | 'PASSPORT'
  documentNumber: string
  phone: string
  address: string
  city: string
  state: string
  businessCategory: string
  bankName: string
  bankAccountType: 'ahorros' | 'corriente'
  bankAccountNumber: string
  bankAccountHolder: string
  acceptTerms: boolean
  acceptPrivacy: boolean
}

export default function RegisterPage() {
  const t = useTranslations('auth.register')
  const [formData, setFormData] = useState<RegistrationData>({
    sellerType: 'natural',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    ownerName: '',
    documentType: 'CC',
    documentNumber: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    businessCategory: '',
    bankName: '',
    bankAccountType: 'ahorros',
    bankAccountNumber: '',
    bankAccountHolder: '',
    acceptTerms: false,
    acceptPrivacy: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.email || !formData.password || formData.password !== formData.confirmPassword) {
        setError(t('errorPasswordMatch'))
        return
      }
      if (formData.password.length < 8) {
        setError(t('errorPasswordLength'))
        return
      }
      if (!formData.acceptTerms || !formData.acceptPrivacy) {
        setError(t('errorAcceptTerms'))
        return
      }
    }
    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerType: formData.sellerType,
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          documentType: formData.documentType,
          documentNumber: formData.documentNumber,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: 'Colombia',
          businessCategory: formData.businessCategory,
          bankName: formData.bankName,
          bankAccountType: formData.bankAccountType,
          bankAccountNumber: formData.bankAccountNumber,
          bankAccountHolder: formData.bankAccountHolder,
          acceptTerms: formData.acceptTerms,
          acceptPrivacy: formData.acceptPrivacy,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Traducir errores del backend
        const errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || t('error')
        throw new Error(errorMessage)
      }

      const data = await response.json()
      // Redirigir a subir documentos si es juridica
      if (formData.sellerType === 'juridica') {
        router.push(`/register/documents?sellerId=${data.id}`)
      } else {
        router.push('/auth/login?message=' + encodeURIComponent(t('success')))
      }
    } catch (error: any) {
      setError(error.message || t('error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('step')} {step} {t('of')} 2
          </p>
        </div>

        {step === 1 && (
          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <input
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('emailPlaceholder')}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <input
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('passwordPlaceholder')}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              {/* Terms and Privacy Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">
                    {t('acceptTermsLabel')}{' '}
                    <Link
                      href="/legal/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 underline"
                    >
                      {t('termsOfService')}
                    </Link>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptPrivacy}
                    onChange={(e) => setFormData({ ...formData, acceptPrivacy: e.target.checked })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">
                    {t('acceptPrivacyLabel')}{' '}
                    <Link
                      href="/legal/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 underline"
                    >
                      {t('privacyPolicy')}
                    </Link>
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.acceptTerms || !formData.acceptPrivacy}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('next')}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {t('hasAccount')} {t('signIn')}
              </Link>
            </div>
          </div>
        )}

        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Tipo de Vendedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('sellerType')}
                </label>
                <select
                  name="sellerType"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.sellerType}
                  onChange={(e) => {
                    const newSellerType = e.target.value as 'natural' | 'juridica'
                    setFormData({
                      ...formData,
                      sellerType: newSellerType,
                      documentType: newSellerType === 'juridica' ? 'NIT' : 'CC'
                    })
                  }}
                >
                  <option value="natural">{t('sellerTypes.natural')}</option>
                  <option value="juridica">{t('sellerTypes.legal')}</option>
                </select>
              </div>

              <div>
                <input
                  name="businessName"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('businessName')}
                  value={formData.businessName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <input
                  name="ownerName"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('ownerName')}
                  value={formData.ownerName}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      ownerName: e.target.value,
                      bankAccountHolder: e.target.value, // Auto-llenar titular
                    })
                  }}
                />
              </div>

              {/* Documento */}
              <div className="flex space-x-2">
                <select
                  name="documentType"
                  required
                  disabled={formData.sellerType === 'juridica'}
                  className="appearance-none relative block w-1/3 px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  value={formData.documentType}
                  onChange={handleChange}
                >
                  {formData.sellerType === 'natural' ? (
                    <>
                      <option value="CC">{t('documentTypes.cc')}</option>
                      <option value="CE">{t('documentTypes.ce')}</option>
                      <option value="PASSPORT">{t('documentTypes.passport')}</option>
                    </>
                  ) : (
                    <option value="NIT">NIT</option>
                  )}
                </select>
                <input
                  name="documentNumber"
                  type="text"
                  required
                  className="appearance-none relative block w-2/3 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('documentPlaceholderNoDots')}
                  value={formData.documentNumber}
                  onChange={handleChange}
                />
              </div>

              <div>
                <input
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('phonePlaceholder')}
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div>
                <input
                  name="address"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('addressPlaceholder')}
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div>
                <ColombiaLocationSelector
                  departmentValue={formData.state}
                  cityValue={formData.city}
                  onDepartmentChange={(value) => setFormData({ ...formData, state: value })}
                  onCityChange={(value) => setFormData({ ...formData, city: value })}
                  departmentLabel={t('department')}
                  cityLabel={t('city')}
                  required
                />
              </div>
              <div>
                <select
                  name="businessCategory"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.businessCategory}
                  onChange={handleChange}
                >
                  <option value="">{t('selectCategory')}</option>
                  <option value="fashion">{t('categories.fashion')}</option>
                  <option value="electronics">{t('categories.electronics')}</option>
                  <option value="home">{t('categories.home')}</option>
                  <option value="beauty">{t('categories.beauty')}</option>
                  <option value="sports">{t('categories.sports')}</option>
                  <option value="books">{t('categories.books')}</option>
                  <option value="toys">{t('categories.toys')}</option>
                  <option value="food">{t('categories.food')}</option>
                  <option value="other">{t('categories.other')}</option>
                </select>
              </div>

              {/* DATOS BANCARIOS */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {t('bankingInfo')}
                </h3>

                {/* Banco */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('bankName')}
                  </label>
                  <select
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">{t('selectBank')}</option>
                    {BANCOS_COLOMBIA.map((banco) => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Cuenta */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('accountType')}
                  </label>
                  <select
                    name="bankAccountType"
                    value={formData.bankAccountType}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="ahorros">{t('accountTypes.savings')}</option>
                    <option value="corriente">{t('accountTypes.current')}</option>
                  </select>
                </div>

                {/* Número de Cuenta */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('accountNumber')}
                  </label>
                  <input
                    name="bankAccountNumber"
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    placeholder={t('accountNumberPlaceholder')}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>

                {/* Titular (auto-llenado) */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('accountHolder')}
                  </label>
                  <input
                    name="bankAccountHolder"
                    type="text"
                    value={formData.bankAccountHolder}
                    onChange={handleChange}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="group relative w-1/3 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('back')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-2/3 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? t('registering') : t('continueDocuments')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
