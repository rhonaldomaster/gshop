'use client'

import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Clock
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

type DateRange = 'today' | 'last7Days' | 'last30Days' | 'thisMonth'

export default function AnalyticsPage() {
  const t = useTranslations('analytics')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange>('last30Days')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Calculate date range
  const getDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case 'today':
        return { startDate: now, endDate: now }
      case 'last7Days':
        return { startDate: subDays(now, 7), endDate: now }
      case 'last30Days':
        return { startDate: subDays(now, 30), endDate: now }
      case 'thisMonth':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
      default:
        return { startDate: subDays(now, 30), endDate: now }
    }
  }

  const { startDate, endDate } = getDateRange()

  // Fetch analytics overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/overview`, {
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch overview')
      return response.json()
    },
    enabled: !!session,
  })

  // Fetch sales trends
  const { data: salesTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['sales-trends', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        period: dateRange === 'last7Days' ? 'daily' : 'monthly',
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/analytics/sales-trends?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken}`,
          },
        }
      )
      if (!response.ok) throw new Error('Failed to fetch sales trends')
      return response.json()
    },
    enabled: !!session,
  })

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  const statsCards = [
    {
      title: t('totalRevenue'),
      value: `$${Number(overview?.totalRevenue || 0).toLocaleString('es-CO')}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      title: t('totalOrders'),
      value: overview?.totalOrders || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: t('averageOrderValue'),
      value: `$${Number(overview?.averageOrderValue || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      title: t('products'),
      value: overview?.totalProducts || 0,
      icon: Package,
      color: 'bg-orange-500',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600 mt-1">{t('overview')}</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">{t('today')}</option>
              <option value="last7Days">{t('last7Days')}</option>
              <option value="last30Days">{t('last30Days')}</option>
              <option value="thisMonth">{t('thisMonth')}</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        {overviewLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((card) => (
              <Card key={card.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                    </div>
                    <div className={`${card.color} p-3 rounded-lg`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('salesTrend')}</CardTitle>
            <CardDescription>
              {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : salesTrends?.data && salesTrends.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={salesTrends.data}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString('es-CO')}`}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                No hay datos de ventas para el período seleccionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
