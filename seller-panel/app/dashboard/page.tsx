'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import StatsCards from '@/components/dashboard/StatsCards'
import RecentOrders from '@/components/dashboard/RecentOrders'
import QuickActions from '@/components/dashboard/QuickActions'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.seller?.businessName || 'Seller'}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your store today.
          </p>
        </div>

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrders />
          <QuickActions />
        </div>
      </div>
    </DashboardLayout>
  )
}