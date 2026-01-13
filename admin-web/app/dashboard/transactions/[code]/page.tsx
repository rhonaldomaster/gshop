'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  CheckCircle2,
  Key,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  DollarSign,
  Coins,
} from 'lucide-react'
import { apiClient, formatDate } from '@/lib/api-client'

interface TransactionUser {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface LinkedTransaction {
  id: string
  type: string
  amount: number
  fee: number
  status: string
  description: string
  user: TransactionUser | null
  createdAt: string
}

interface TransactionVerification {
  dynamicCode: string
  verified: boolean
  executedAt: string
  sender: TransactionUser
  receiver: TransactionUser
  summary: {
    amountSent: number
    platformFee: number
    netReceived: number
  }
  transactions: LinkedTransaction[]
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function TransactionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('transactions')
  const code = params.code as string

  const [verification, setVerification] = useState<TransactionVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (code) {
      fetchVerification()
    }
  }, [code])

  const fetchVerification = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiClient.get<TransactionVerification>(
        `/tokens/verify-transaction/${code}`
      )
      setVerification(data)
    } catch (err: any) {
      console.error('Error fetching verification:', err)
      setError(t('detail.notFound'))
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      transfer_in: 'bg-green-100 text-green-800',
      transfer_out: 'bg-blue-100 text-blue-800',
      platform_fee: 'bg-purple-100 text-purple-800',
    }
    return styles[type] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer_in':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'transfer_out':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />
      case 'platform_fee':
        return <Coins className="h-4 w-4 text-purple-600" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !verification) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('detail.back')}
          </Button>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t('detail.notFound')}</h3>
              <p className="text-muted-foreground">
                {t('detail.notFoundDescription')} <span className="font-mono font-bold">{code}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('detail.back')}
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                {t('detail.title')}
                <span className="font-mono text-primary">{verification.dynamicCode}</span>
              </h1>
            </div>
          </div>

          {verification.verified && (
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1 px-3 py-1">
              <CheckCircle2 className="h-4 w-4" />
              {t('detail.verified')}
            </Badge>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('detail.amountSent')}</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(verification.summary.amountSent)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('detail.platformFee')}</CardTitle>
              <Coins className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(verification.summary.platformFee)}
              </div>
              <p className="text-xs text-muted-foreground">0.2%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('detail.netReceived')}</CardTitle>
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(verification.summary.netReceived)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sender & Receiver */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sender */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <ArrowUpRight className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">{t('detail.sender')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-lg">
                    {verification.sender.firstName} {verification.sender.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {verification.sender.email}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receiver */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <ArrowDownLeft className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">{t('detail.receiver')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-lg">
                    {verification.receiver.firstName} {verification.receiver.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {verification.receiver.email}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Execution Time */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{t('detail.executedAt')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium">
              {formatDateTime(verification.executedAt)}
            </div>
          </CardContent>
        </Card>

        {/* Linked Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.linkedTransactions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {verification.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(tx.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeBadge(tx.type)}>
                          {t(`type.${tx.type}`)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {tx.user
                            ? `${tx.user.firstName} ${tx.user.lastName}`
                            : 'Sistema'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {tx.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-medium ${
                        tx.type === 'transfer_in'
                          ? 'text-green-600'
                          : tx.type === 'platform_fee'
                          ? 'text-purple-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {tx.type === 'transfer_in' ? '+' : '-'}
                      {formatCurrency(Math.abs(tx.amount))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
