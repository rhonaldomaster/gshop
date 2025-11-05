'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Plus, Package, BarChart3, DollarSign } from 'lucide-react'

export default function QuickActions() {
  const t = useTranslations('dashboard')

  const actions = [
    {
      title: t('addProduct'),
      description: t('addProductDesc'),
      href: '/dashboard/products/new',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: t('manageProducts'),
      description: t('manageProductsDesc'),
      href: '/dashboard/products',
      icon: Package,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: t('viewAnalytics'),
      description: t('viewAnalyticsDesc'),
      href: '/dashboard/analytics',
      icon: BarChart3,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: t('requestWithdrawal'),
      description: t('requestWithdrawalDesc'),
      href: '/dashboard/payments',
      icon: DollarSign,
      color: 'bg-emerald-500 hover:bg-emerald-600',
    },
  ]

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{t('quickActions')}</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 ring-4 ring-white ${action.color}`}>
                  <action.icon className="h-6 w-6 text-white" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-700">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
