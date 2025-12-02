'use client'

import { useTranslations } from 'next-intl'
import { Package, DollarSign, TrendingUp, Clock } from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalProducts: number
    totalEarnings: number
    availableBalance: number
    pendingBalance: number
    commissionRate: number
    status: string
  } | undefined
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const t = useTranslations('dashboard')

  const cards = [
    {
      title: t('totalProducts'),
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: t('totalEarnings'),
      value: `$${Number(stats?.totalEarnings || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: t('availableBalance'),
      value: `$${Number(stats?.availableBalance || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      title: t('pendingBalance'),
      value: `$${Number(stats?.pendingBalance || 0).toFixed(2)}`,
      icon: Clock,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`${card.color} p-3 rounded-md`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {card.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}