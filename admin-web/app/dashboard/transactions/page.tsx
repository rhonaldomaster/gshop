'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CreditCard,
  ShoppingCart,
  Coins,
  TrendingUp,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Key,
  Eye,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiClient, formatDate } from '@/lib/api-client'

interface Transaction {
  id: string
  type: string
  status: string
  amount: number
  fee: number
  reference: string
  description: string
  createdAt: string
  processedAt: string
  dynamicCode: string | null
  executedAt: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  fromUser?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  toUser?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  metadata?: any
}

interface TransactionStats {
  totalTransactions: number
  totalVolume: number
  totalFees: number
  transfersCount: number
  transfersVolume: number
  topupsCount: number
  topupsVolume: number
  purchasesCount: number
  purchasesVolume: number
  pendingTransactions: number
  todayTransactions: number
  todayVolume: number
}

interface PaginatedResponse {
  data: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function TransactionsPage() {
  const t = useTranslations('transactions')
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [codeSearch, setCodeSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchData()
  }, [typeFilter, statusFilter, page])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter && typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('page', page.toString())
      params.append('limit', '20')

      const [transactionsData, statsData] = await Promise.all([
        apiClient.get<PaginatedResponse>(`/tokens/admin/transactions?${params.toString()}`),
        apiClient.get<TransactionStats>('/tokens/admin/transactions/stats'),
      ])

      setTransactions(transactionsData?.data || [])
      setTotal(transactionsData?.total || 0)
      setTotalPages(transactionsData?.totalPages || 1)
      setStats(statsData)
      setError('')
    } catch (err: any) {
      if (err?.response?.status >= 500 || err?.message?.includes('Network')) {
        setError(t('errors.loadFailed'))
        console.error('Error fetching transactions:', err)
      }
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleCodeSearch = () => {
    const code = codeSearch.toUpperCase().trim()
    if (code.startsWith('GS-') && code.length === 9) {
      router.push(`/dashboard/transactions/${code}`)
    }
  }

  const isValidCodeFormat = (code: string) => {
    const pattern = /^GS-[A-Z2-9]{6}$/
    return pattern.test(code.toUpperCase().trim())
  }

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      transfer_in: 'bg-green-100 text-green-800',
      transfer_out: 'bg-blue-100 text-blue-800',
      platform_fee: 'bg-purple-100 text-purple-800',
      topup: 'bg-cyan-100 text-cyan-800',
      purchase: 'bg-orange-100 text-orange-800',
      reward: 'bg-yellow-100 text-yellow-800',
      cashback: 'bg-pink-100 text-pink-800',
    }
    return styles[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer_in':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'transfer_out':
        return <ArrowUpRight className="h-4 w-4 text-blue-600" />
      case 'platform_fee':
        return <Coins className="h-4 w-4 text-purple-600" />
      case 'topup':
        return <CreditCard className="h-4 w-4 text-cyan-600" />
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-orange-600" />
      default:
        return <Wallet className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading && !transactions.length) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.totalVolume')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTransactions.toLocaleString()} {t('stats.transactions')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.feesCollected')}</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalFees)}</div>
                <p className="text-xs text-muted-foreground">{t('stats.platformFees')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.transfers')}</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.transfersVolume)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.transfersCount.toLocaleString()} {t('stats.p2pTransfers')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.todayVolume')}</CardTitle>
                <Clock className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.todayVolume)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.todayTransactions.toLocaleString()} {t('stats.todayTransactions')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Secondary Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.topups')}</CardTitle>
                <CreditCard className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(stats.topupsVolume)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.topupsCount.toLocaleString()} {t('stats.recharges')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.purchases')}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(stats.purchasesVolume)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.purchasesCount.toLocaleString()} {t('stats.walletPurchases')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('stats.pending')}</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
                <p className="text-xs text-muted-foreground">{t('stats.pendingTransactions')}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Code Search */}
        <div className="flex gap-2">
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dynamicCode.searchPlaceholder')}
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleCodeSearch()}
              className="pl-10 w-[220px] font-mono"
              maxLength={9}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleCodeSearch}
            disabled={!isValidCodeFormat(codeSearch)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {t('dynamicCode.verify')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('filters.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('filters.allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allTypes')}</SelectItem>
              <SelectItem value="transfer_in">{t('type.transfer_in')}</SelectItem>
              <SelectItem value="transfer_out">{t('type.transfer_out')}</SelectItem>
              <SelectItem value="platform_fee">{t('type.platform_fee')}</SelectItem>
              <SelectItem value="topup">{t('type.topup')}</SelectItem>
              <SelectItem value="purchase">{t('type.purchase')}</SelectItem>
              <SelectItem value="reward">{t('type.reward')}</SelectItem>
              <SelectItem value="cashback">{t('type.cashback')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filters.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allStatus')}</SelectItem>
              <SelectItem value="completed">{t('status.completed')}</SelectItem>
              <SelectItem value="pending">{t('status.pending')}</SelectItem>
              <SelectItem value="failed">{t('status.failed')}</SelectItem>
              <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="secondary" onClick={handleSearch}>
            <Search className="mr-2 h-4 w-4" />
            {t('common.search')}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        {/* Transactions Table */}
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t('empty.noTransactions')}</h3>
              <p className="text-muted-foreground">{t('empty.noTransactionsDescription')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.type')}</TableHead>
                      <TableHead>{t('table.user')}</TableHead>
                      <TableHead>{t('table.description')}</TableHead>
                      <TableHead className="text-right">{t('table.amount')}</TableHead>
                      <TableHead>{t('table.dynamicCode')}</TableHead>
                      <TableHead>{t('table.status')}</TableHead>
                      <TableHead>{t('table.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(tx.type)}
                            <Badge className={getTypeBadge(tx.type)}>
                              {t(`type.${tx.type}`)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {tx.user
                                ? `${tx.user.firstName} ${tx.user.lastName}`
                                : 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tx.user?.email || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <div className="truncate">{tx.description || '-'}</div>
                            {tx.reference && (
                              <div className="text-xs text-muted-foreground truncate">
                                Ref: {tx.reference}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                          </div>
                          {tx.fee > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Fee: {formatCurrency(tx.fee)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.dynamicCode ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="font-mono text-primary hover:bg-primary/10"
                              onClick={() => router.push(`/dashboard/transactions/${tx.dynamicCode}`)}
                            >
                              <Key className="mr-1 h-3 w-3" />
                              {tx.dynamicCode}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(tx.status)}>
                            {t(`status.${tx.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('pagination.showing', { from: (page - 1) * 20 + 1, to: Math.min(page * 20, total), total })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('pagination.previous')}
                </Button>
                <span className="text-sm">
                  {t('pagination.page', { current: page, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t('pagination.next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
