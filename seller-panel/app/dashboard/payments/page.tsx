'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Wallet, TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface SellerStats {
  totalEarnings: number
  availableBalance: number
  pendingBalance: number
  totalOrders: number
  totalSales: number
}

interface Withdrawal {
  id: string
  amount: number
  status: 'pending' | 'completed' | 'rejected'
  createdAt: string
  processedAt?: string
  notes?: string
}

export default function PaymentsPage() {
  const t = useTranslations('payments')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch seller stats (incluye balances)
  const { data: stats, isLoading: statsLoading } = useQuery<SellerStats>({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/stats`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      })
      if (!res.ok) throw new Error('Error al cargar estadísticas')
      return res.json()
    },
    enabled: !!session?.accessToken,
  })

  // Fetch withdrawal history
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['my-withdrawals', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sellers/my-withdrawals?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      )
      if (!res.ok) throw new Error('Error al cargar retiros')
      return res.json()
    },
    enabled: !!session?.accessToken,
  })

  // Request withdrawal mutation
  const requestWithdrawalMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ amount }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Error al solicitar retiro')
      }

      return res.json()
    },
    onSuccess: () => {
      toast.success(t('withdrawalRequested'))
      setWithdrawalAmount('')
      queryClient.invalidateQueries({ queryKey: ['seller-stats'] })
      queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleRequestWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount)

    if (isNaN(amount) || amount <= 0) {
      toast.error(t('invalidAmount'))
      return
    }

    if (amount > (stats?.availableBalance || 0)) {
      toast.error(t('insufficientBalance'))
      return
    }

    if (amount < 10000) {
      toast.error(t('minimumAmount'))
      return
    }

    requestWithdrawalMutation.mutate(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: t('pending'), color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      completed: { label: t('completed'), color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: t('rejected'), color: 'bg-red-100 text-red-800', icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  if (statsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">{tCommon('loading')}</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('availableBalance')}
              </CardTitle>
              <Wallet className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${stats?.availableBalance?.toLocaleString('es-CO') || '0'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('availableForWithdrawal')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('pendingBalance')}
              </CardTitle>
              <Clock className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                ${stats?.pendingBalance?.toLocaleString('es-CO') || '0'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('pendingApproval')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('totalEarnings')}
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ${stats?.totalEarnings?.toLocaleString('es-CO') || '0'}
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('allTimeEarnings')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Request Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('requestWithdrawal')}</CardTitle>
            <CardDescription>{t('requestWithdrawalDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="amount">{t('amount')}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="pl-10"
                    min="10000"
                    step="1000"
                  />
                </div>
                <p className="text-sm text-gray-500">{t('minimumWithdrawal')}: $10.000 COP</p>
              </div>
              <div className="flex items-center">
                <Button
                  onClick={handleRequestWithdrawal}
                  disabled={requestWithdrawalMutation.isPending || !withdrawalAmount}
                  className="w-full"
                >
                  {requestWithdrawalMutation.isPending ? t('requesting') : t('request')}
                </Button>
              </div>
            </div>

            {/* Bank Account Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                {t('bankAccountInfo')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">{t('bankName')}:</span>
                  <span className="ml-2 font-medium">{session?.seller?.bankName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('accountType')}:</span>
                  <span className="ml-2 font-medium">
                    {session?.seller?.bankAccountType === 'ahorros' ? 'Ahorros' : 'Corriente'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('accountNumber')}:</span>
                  <span className="ml-2 font-medium">
                    {session?.seller?.bankAccountNumber
                      ? `****${session.seller.bankAccountNumber.slice(-4)}`
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">{t('accountHolder')}:</span>
                  <span className="ml-2 font-medium">
                    {session?.seller?.bankAccountHolder || 'N/A'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                {t('updateBankInfo')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('withdrawalHistory')}</CardTitle>
                <CardDescription>{t('withdrawalHistoryDesc')}</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                  <SelectItem value="rejected">{t('rejected')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {withdrawalsLoading ? (
              <div className="text-center py-8 text-gray-500">{tCommon('loading')}</div>
            ) : withdrawalsData?.withdrawals?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t('noWithdrawals')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        {t('date')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        {t('amount')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        {t('status')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        {t('processedDate')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        {t('notes')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalsData?.withdrawals?.map((withdrawal: Withdrawal) => (
                      <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(withdrawal.createdAt).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          ${withdrawal.amount.toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(withdrawal.status)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {withdrawal.processedAt
                            ? new Date(withdrawal.processedAt).toLocaleDateString('es-CO')
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {withdrawal.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
