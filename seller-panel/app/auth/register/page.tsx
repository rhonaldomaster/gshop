'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface RegistrationData {
  email: string
  password: string
  confirmPassword: string
  businessName: string
  ownerName: string
  documentType: 'CC' | 'NIT' | 'RUT' | 'Passport'
  documentNumber: string
  phone: string
  address: string
  city: string
  country: string
  businessCategory: string
}

export default function RegisterPage() {
  const t = useTranslations('auth.register')
  const [formData, setFormData] = useState<RegistrationData>({
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
    country: '',
    businessCategory: '',
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
    }
    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/seller/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          documentType: formData.documentType,
          documentNumber: formData.documentNumber,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          businessCategory: formData.businessCategory,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      router.push('/auth/login?message=Registration successful. Please login.')
    } catch (error: any) {
      setError(error.message || 'Something went wrong')
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
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <div>
              <button
                type="button"
                onClick={handleNext}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                  onChange={handleChange}
                />
              </div>
              <div className="flex space-x-2">
                <select
                  name="documentType"
                  required
                  className="appearance-none relative block w-1/3 px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.documentType}
                  onChange={handleChange}
                >
                  <option value="CC">CC</option>
                  <option value="NIT">NIT</option>
                  <option value="RUT">RUT</option>
                  <option value="Passport">{t('documentTypes.passport')}</option>
                </select>
                <input
                  name="documentNumber"
                  type="text"
                  required
                  className="appearance-none relative block w-2/3 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('documentPlaceholder')}
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
              <div className="flex space-x-2">
                <input
                  name="city"
                  type="text"
                  required
                  className="appearance-none relative block w-1/2 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('cityPlaceholder')}
                  value={formData.city}
                  onChange={handleChange}
                />
                <input
                  name="country"
                  type="text"
                  required
                  className="appearance-none relative block w-1/2 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('countryPlaceholder')}
                  value={formData.country}
                  onChange={handleChange}
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
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
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
                {isLoading ? t('creatingAccount') : t('createAccount')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
