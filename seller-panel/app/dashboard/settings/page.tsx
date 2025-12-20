'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tantml:parameter>
import { useTranslations } from 'next-intl'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, CreditCard, Shield, User } from 'lucide-react'
import { toast } from 'sonner'

type TabType = 'general' | 'business' | 'payment' | 'security'

interface SellerProfile {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  address?: string
  city?: string
  state?: string
  country: string
  businessCategory?: string
  bankName?: string
  bankAccountType?: 'ahorros' | 'corriente'
  bankAccountNumber?: string
  bankAccountHolder?: string
  documentType: string
  documentNumber: string
  sellerType: 'natural' | 'juridica'
}

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tNav = useTranslations('navigation')
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<TabType>('general')

  // Profile form state
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Colombia',
    businessCategory: '',
    bankName: '',
    bankAccountType: 'ahorros' as 'ahorros' | 'corriente',
    bankAccountNumber: '',
    bankAccountHolder: '',
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Fetch seller profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['seller-profile'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/profile`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      })

      if (!res.ok) {
        throw new Error('Error al cargar perfil')
      }

      return res.json() as Promise<SellerProfile>
    },
    enabled: !!session?.accessToken,
  })

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        businessName: profile.businessName || '',
        ownerName: profile.ownerName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || 'Colombia',
        businessCategory: profile.businessCategory || '',
        bankName: profile.bankName || '',
        bankAccountType: profile.bankAccountType || 'ahorros',
        bankAccountNumber: profile.bankAccountNumber || '',
        bankAccountHolder: profile.bankAccountHolder || '',
      })
    }
  }, [profile])

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al actualizar perfil')
      }

      return res.json()
    },
    onSuccess: () => {
      toast.success(t('changesSaved'))
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al cambiar contraseña')
      }

      return res.json()
    },
    onSuccess: () => {
      toast.success('Contraseña actualizada exitosamente')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleProfileSubmit = (e: React.FormEvent, section: 'general' | 'business' | 'payment') => {
    e.preventDefault()

    let dataToUpdate = {}

    if (section === 'general') {
      dataToUpdate = {
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
      }
    } else if (section === 'business') {
      dataToUpdate = {
        businessName: formData.businessName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        businessCategory: formData.businessCategory,
      }
    } else if (section === 'payment') {
      dataToUpdate = {
        bankName: formData.bankName,
        bankAccountType: formData.bankAccountType,
        bankAccountNumber: formData.bankAccountNumber,
        bankAccountHolder: formData.bankAccountHolder,
      }
    }

    updateProfileMutation.mutate(dataToUpdate)
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    })
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (status === 'loading' || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">{t('loading') || 'Cargando...'}</div>
        </div>
      </DashboardLayout>
    )
  }

  const tabs = [
    { id: 'general' as TabType, label: t('general'), icon: User },
    { id: 'business' as TabType, label: t('business'), icon: Building2 },
    { id: 'payment' as TabType, label: t('payment'), icon: CreditCard },
    { id: 'security' as TabType, label: t('security'), icon: Shield },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tNav('settings')}</h1>
          <p className="text-gray-600 mt-1">
            Gestiona la información de tu cuenta y negocio
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-12">
          {/* General Tab */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('profile')}</CardTitle>
                <CardDescription>
                  Información personal y de contacto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleProfileSubmit(e, 'general')} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Nombre del propietario</Label>
                      <Input
                        id="ownerName"
                        value={formData.ownerName}
                        onChange={(e) => handleInputChange('ownerName', e.target.value)}
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('contactEmail')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('contactPhone')}</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="3001234567"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? 'Guardando...' : t('saveChanges')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Business Tab */}
          {activeTab === 'business' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('business')}</CardTitle>
                <CardDescription>
                  Información del negocio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleProfileSubmit(e, 'business')} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">{t('businessName')}</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        placeholder="Mi Tienda"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessCategory">Categoría del negocio</Label>
                      <Input
                        id="businessCategory"
                        value={formData.businessCategory}
                        onChange={(e) => handleInputChange('businessCategory', e.target.value)}
                        placeholder="Electrónica, Moda, etc."
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">{t('businessAddress')}</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Calle 123 #45-67"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Bogotá"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Departamento</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="Cundinamarca"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? 'Guardando...' : t('saveChanges')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('payment')}</CardTitle>
                <CardDescription>
                  Información bancaria para recibir pagos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => handleProfileSubmit(e, 'payment')} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">{t('bankName')}</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        placeholder="Bancolombia"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccountType">Tipo de cuenta</Label>
                      <Select
                        value={formData.bankAccountType}
                        onValueChange={(value) => handleInputChange('bankAccountType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ahorros">Ahorros</SelectItem>
                          <SelectItem value="corriente">Corriente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">{t('accountNumber')}</Label>
                      <Input
                        id="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                        placeholder="1234567890"
                        maxLength={20}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccountHolder">{t('accountHolderName')}</Label>
                      <Input
                        id="bankAccountHolder"
                        value={formData.bankAccountHolder}
                        onChange={(e) => handleInputChange('bankAccountHolder', e.target.value)}
                        placeholder="Juan Pérez"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Importante:</strong> Esta información es necesaria para recibir tus pagos.
                      Asegúrate de que los datos sean correctos.
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? 'Guardando...' : t('saveChanges')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('security')}</CardTitle>
                <CardDescription>
                  {t('changePassword')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">{t('newPassword')}</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder="••••••••"
                      />
                      <p className="text-sm text-gray-500">
                        Mínimo 8 caracteres
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? 'Cambiando...' : 'Cambiar contraseña'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
