'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import StatsCards from '@/components/dashboard/StatsCards'
import RecentOrders from '@/components/dashboard/RecentOrders'
import QuickActions from '@/components/dashboard/QuickActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const { data: profile } = useQuery({
    queryKey: ['seller-profile'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/profile`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch profile')
      return response.json()
    },
    enabled: !!session?.accessToken,
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/stats`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    enabled: !!session?.accessToken,
  })

  if (status === 'loading' || statsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Helper to get verification status banner
  const getVerificationBanner = () => {
    if (!profile?.verificationStatus) return null

    const banners: Record<string, { color: string; icon: string; title: string; message: string }> = {
      pending: {
        color: 'bg-gray-50 border-gray-200 text-gray-800',
        icon: '⏳',
        title: 'Cuenta Pendiente de Verificación',
        message: 'Tu cuenta está en proceso de revisión. Te notificaremos por email cuando esté aprobada.',
      },
      documents_uploaded: {
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: '📄',
        title: 'Documentos Recibidos',
        message: 'Hemos recibido tus documentos y estamos revisándolos. Te notificaremos pronto.',
      },
      under_review: {
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: '🔍',
        title: 'En Revisión',
        message: 'Tu cuenta está siendo revisada por nuestro equipo. Esto puede tomar 24-48 horas.',
      },
      needs_update: {
        color: 'bg-orange-50 border-orange-200 text-orange-800',
        icon: '⚠️',
        title: 'Se Requiere Actualización',
        message: profile.adminMessage || 'Se necesita actualizar algunos datos de tu cuenta.',
      },
      rejected: {
        color: 'bg-red-50 border-red-200 text-red-800',
        icon: '❌',
        title: 'Cuenta Rechazada',
        message: profile.adminMessage || 'Tu solicitud no pudo ser aprobada. Contacta a soporte para más información.',
      },
    }

    const banner = banners[profile.verificationStatus]
    if (!banner || profile.verificationStatus === 'approved') return null

    return (
      <div className={`border rounded-lg p-4 ${banner.color}`}>
        <div className="flex items-start gap-3">
          <div className="text-2xl">{banner.icon}</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">{banner.title}</h3>
            <p className="text-sm">{banner.message}</p>
            {profile.adminMessageDate && (
              <p className="text-xs mt-2 opacity-75">
                Última actualización: {new Date(profile.adminMessageDate).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Verification Status Banner */}
        {getVerificationBanner()}

        <Card className="gshop-seller-header border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-bold">
              Welcome back, {session?.seller?.businessName || 'Seller'}! 🏪
            </CardTitle>
            <p className="text-white/90 text-lg">
              Here's what's happening with your store today.
            </p>
          </CardHeader>
        </Card>

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders />
          <QuickActions />
        </div>
      </div>
    </DashboardLayout>
  )
}