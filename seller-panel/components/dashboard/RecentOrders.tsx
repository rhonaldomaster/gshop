'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function RecentOrders() {
  const t = useTranslations('dashboard')
  const { data: session } = useSession()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/seller?limit=5`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch orders')
      return response.json()
    },
    enabled: !!session?.accessToken,
  })

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t('recentOrders')}</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{t('recentOrders')}</h3>
      </div>
      <div className="flow-root">
        <ul className="divide-y divide-gray-200">
          {orders?.length > 0 ? (
            orders.map((order: any) => (
              <li key={order.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      Pedido #{order.id.slice(-8)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${order.total?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-6 py-8 text-center">
              <p className="text-gray-500">{t('noOrdersYet')}</p>
            </li>
          )}
        </ul>
      </div>
      {orders?.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-200">
          <Link
            href="/dashboard/orders"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            {t('viewAll')} →
          </Link>
        </div>
      )}
    </div>
  )
}
