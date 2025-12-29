'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Users, CheckCircle, Clock, DollarSign, Eye, Pause, Play, Mail, ExternalLink, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface AffiliatesStats {
  totalAffiliates: number
  activeAffiliates: number
  pendingApprovals: number
  totalSales: number
  totalCommissions: number
}

interface Affiliate {
  affiliateId: string
  affiliate: {
    username: string
    name: string
    email: string
    avatarUrl?: string
    followersCount: number
    isVerified: boolean
  }
  productsCount: number
  totalClicks: number
  totalSales: number
  totalRevenue: number
  totalCommissions: number
  pendingApprovals: number
  lastSaleAt?: string
}

interface AffiliateProduct {
  id: string
  status: string
  customCommissionRate?: number
  totalClicks: number
  totalSales: number
  affiliate: {
    id: string
    username: string
    name: string
  }
}

interface ProductWithAffiliates {
  productId: string
  product: {
    name: string
    price: number
    imageUrl: string | null
  }
  affiliatesCount: number
  totalClicks: number
  totalSales: number
  totalRevenue: number
  pendingApprovals: number
  affiliateProducts: AffiliateProduct[]
}

interface AffiliateDetails {
  affiliate: {
    id: string
    username: string
    name: string
    email: string
    phone?: string
    avatarUrl?: string
    bio?: string
    website?: string
    socialMedia?: any
    followersCount: number
    followingCount: number
    totalViews: number
    totalSales: number
    videosCount: number
    isVerified: boolean
    commissionRate: number
  }
  products: Array<{
    affiliateProductId: string
    productId: string
    productName: string
    productPrice: number
    productImageUrl: string | null
    status: string
    customCommissionRate?: number
    specialPrice?: number
    totalClicks: number
    totalSales: number
    totalRevenue: number
    totalCommissions: number
    createdAt: string
  }>
  stats: {
    totalProductsPromoted: number
    totalClicks: number
    totalSales: number
    totalRevenue: number
    totalCommissions: number
  }
}

export default function AffiliatesPage() {
  const t = useTranslations('affiliates')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const sellerId = session?.seller?.id

  // Dialog states
  const [approveDialog, setApproveDialog] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve')
  const [approveNotes, setApproveNotes] = useState('')

  const [commissionDialog, setCommissionDialog] = useState<{ open: boolean, item: any | null }>({ open: false, item: null })
  const [newCommissionRate, setNewCommissionRate] = useState('')

  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean, affiliateId: string | null }>({ open: false, affiliateId: null })

  // Queries
  const { data: affiliatesData, isLoading: affiliatesLoading } = useQuery({
    queryKey: ['seller-affiliates', sellerId],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/${sellerId}/affiliates`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      if (!res.ok) throw new Error('Error loading affiliates')
      const data = await res.json()
      return data as { affiliates: Affiliate[], stats: AffiliatesStats }
    },
    enabled: !!session?.accessToken && !!sellerId
  })

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['seller-affiliate-products', sellerId],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/${sellerId}/affiliate-products`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      if (!res.ok) throw new Error('Error loading products')
      const data = await res.json()
      return data as { products: ProductWithAffiliates[] }
    },
    enabled: !!session?.accessToken && !!sellerId
  })

  const { data: affiliateDetailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['affiliate-details', sellerId, detailsDialog.affiliateId],
    queryFn: async () => {
      if (!detailsDialog.affiliateId) return null
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sellers/${sellerId}/affiliates/${detailsDialog.affiliateId}/details`,
        {
          headers: { Authorization: `Bearer ${session?.accessToken}` }
        }
      )
      if (!res.ok) throw new Error('Error loading affiliate details')
      return res.json() as Promise<AffiliateDetails>
    },
    enabled: !!session?.accessToken && !!sellerId && !!detailsDialog.affiliateId && detailsDialog.open
  })

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async ({ id, approved, notes }: { id: string, approved: boolean, notes?: string }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/${sellerId}/affiliate-products/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ approved, notes })
      })
      if (!res.ok) throw new Error('Error processing approval')
      return res.json()
    },
    onSuccess: () => {
      toast.success(t('messages.approvalSuccess'))
      queryClient.invalidateQueries({ queryKey: ['seller-affiliates'] })
      queryClient.invalidateQueries({ queryKey: ['seller-affiliate-products'] })
      setApproveDialog({ open: false, item: null })
      setApproveAction('approve')
      setApproveNotes('')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const commissionMutation = useMutation({
    mutationFn: async ({ id, rate }: { id: string, rate: number }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/${sellerId}/affiliate-products/${id}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ rate })
      })
      if (!res.ok) throw new Error('Error updating commission')
      return res.json()
    },
    onSuccess: () => {
      toast.success(t('messages.commissionUpdated'))
      queryClient.invalidateQueries({ queryKey: ['seller-affiliates'] })
      queryClient.invalidateQueries({ queryKey: ['seller-affiliate-products'] })
      setCommissionDialog({ open: false, item: null })
      setNewCommissionRate('')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'active' | 'paused' }) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/${sellerId}/affiliate-products/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Error updating status')
      return res.json()
    },
    onSuccess: () => {
      toast.success(t('messages.statusUpdated'))
      queryClient.invalidateQueries({ queryKey: ['seller-affiliates'] })
      queryClient.invalidateQueries({ queryKey: ['seller-affiliate-products'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Handlers
  const handleApproveSubmit = () => {
    if (!approveDialog.item) return

    if (approveAction === 'reject' && !approveNotes.trim()) {
      toast.error(t('messages.notesRequired'))
      return
    }

    approveMutation.mutate({
      id: approveDialog.item.id,
      approved: approveAction === 'approve',
      notes: approveNotes.trim() || undefined
    })
  }

  const handleCommissionSubmit = () => {
    if (!commissionDialog.item) return

    const rate = parseFloat(newCommissionRate)
    if (isNaN(rate) || rate < 1 || rate > 50) {
      toast.error(t('messages.invalidRate'))
      return
    }

    commissionMutation.mutate({
      id: commissionDialog.item.id,
      rate
    })
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-800',
      paused: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    }

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {t(`status.${status}`) || status}
      </Badge>
    )
  }

  // Render loading
  if (affiliatesLoading || productsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  const affiliates = affiliatesData?.affiliates || []
  const stats = affiliatesData?.stats || {
    totalAffiliates: 0,
    activeAffiliates: 0,
    pendingApprovals: 0,
    totalSales: 0,
    totalCommissions: 0
  }
  const products = productsData?.products || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-2">{t('subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalAffiliates')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAffiliates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.activeAffiliates')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAffiliates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.pendingApprovals')}</CardTitle>
              <Clock className={`h-4 w-4 ${stats.pendingApprovals > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.pendingApprovals > 0 ? 'text-yellow-600' : ''}`}>
                {stats.pendingApprovals}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalCommissions')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalCommissions.toLocaleString('es-CO')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="affiliates" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="affiliates">{t('byAffiliate')}</TabsTrigger>
            <TabsTrigger value="products">{t('byProduct')}</TabsTrigger>
          </TabsList>

          {/* Tab: Por Afiliado */}
          <TabsContent value="affiliates">
            <Card>
              <CardHeader>
                <CardTitle>{t('byAffiliate')}</CardTitle>
                <CardDescription>{affiliates.length} afiliado(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {affiliates.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty.noAffiliates')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('empty.noAffiliatesDesc')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('table.affiliate')}</TableHead>
                          <TableHead>{t('table.email')}</TableHead>
                          <TableHead className="text-right">{t('table.followers')}</TableHead>
                          <TableHead className="text-right">{t('table.products')}</TableHead>
                          <TableHead className="text-right">{t('table.sales')}</TableHead>
                          <TableHead className="text-right">{t('table.commissions')}</TableHead>
                          <TableHead className="text-center">{t('table.pending')}</TableHead>
                          <TableHead className="text-right">{t('table.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {affiliates.map((aff) => (
                          <TableRow key={aff.affiliateId}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {aff.affiliate.avatarUrl ? (
                                    <img
                                      src={aff.affiliate.avatarUrl}
                                      alt={aff.affiliate.name}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-600">
                                        {aff.affiliate.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">{aff.affiliate.name}</span>
                                    {aff.affiliate.isVerified && (
                                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                                        {t('badges.verified')}
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-500">@{aff.affiliate.username}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">{aff.affiliate.email}</TableCell>
                            <TableCell className="text-right text-sm">{aff.affiliate.followersCount.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm">{aff.productsCount}</TableCell>
                            <TableCell className="text-right text-sm">{aff.totalSales}</TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              ${aff.totalCommissions.toLocaleString('es-CO')}
                            </TableCell>
                            <TableCell className="text-center">
                              {aff.pendingApprovals > 0 ? (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  {aff.pendingApprovals} {t('badges.pendingApproval')}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDetailsDialog({ open: true, affiliateId: aff.affiliateId })}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {t('actions.viewDetails')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Por Producto */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>{t('byProduct')}</CardTitle>
                <CardDescription>{products.length} producto(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">{t('empty.noProducts')}</h3>
                    <p className="mt-1 text-sm text-gray-500">{t('empty.noProductsDesc')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((prod) => (
                      <div key={prod.productId} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            {prod.product.imageUrl ? (
                              <img
                                src={prod.product.imageUrl}
                                alt={prod.product.name}
                                className="h-16 w-16 rounded object-cover"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-500">Sin imagen</span>
                              </div>
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900">{prod.product.name}</h4>
                              <p className="text-sm text-gray-500">
                                ${prod.product.price.toLocaleString('es-CO')} • {prod.affiliatesCount} afiliado(s)
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">{t('table.clicks')}: {prod.totalClicks}</div>
                            <div className="text-sm text-gray-500">{t('table.sales')}: {prod.totalSales}</div>
                            <div className="text-sm font-medium">Revenue: ${prod.totalRevenue.toLocaleString('es-CO')}</div>
                          </div>
                        </div>

                        {prod.affiliateProducts.length > 0 && (
                          <div className="border-t pt-4">
                            <h5 className="text-sm font-medium mb-2">Afiliados:</h5>
                            <div className="space-y-2">
                              {prod.affiliateProducts.map((ap) => (
                                <div key={ap.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-medium">@{ap.affiliate.username}</span>
                                    {getStatusBadge(ap.status)}
                                    {ap.customCommissionRate && (
                                      <Badge variant="outline">
                                        {ap.customCommissionRate}% comisión
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">{ap.totalSales} ventas</span>
                                    <div className="flex space-x-1">
                                      {ap.status === 'pending' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setApproveDialog({ open: true, item: ap })}
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {ap.status === 'active' && (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCommissionDialog({ open: true, item: ap })}
                                            title={t('actions.adjustCommission')}
                                          >
                                            <DollarSign className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => statusMutation.mutate({ id: ap.id, status: 'paused' })}
                                            title={t('actions.pause')}
                                          >
                                            <Pause className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                      {ap.status === 'paused' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => statusMutation.mutate({ id: ap.id, status: 'active' })}
                                          title={t('actions.activate')}
                                        >
                                          <Play className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Aprobar/Rechazar */}
        <Dialog open={approveDialog.open} onOpenChange={(open) => setApproveDialog({ open, item: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dialogs.approveTitle')}</DialogTitle>
              <DialogDescription>{t('dialogs.approveDesc')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <RadioGroup value={approveAction} onValueChange={(val) => setApproveAction(val as 'approve' | 'reject')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="approve" id="approve" />
                  <Label htmlFor="approve" className="flex items-center space-x-2 cursor-pointer">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{t('dialogs.approveAction')}</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reject" id="reject" />
                  <Label htmlFor="reject" className="flex items-center space-x-2 cursor-pointer">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>{t('dialogs.rejectAction')}</span>
                  </Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  {approveAction === 'reject' ? t('dialogs.notes') : t('dialogs.notesOptional')}
                  {approveAction === 'reject' && <span className="text-red-600 ml-1">*</span>}
                </Label>
                <Textarea
                  id="notes"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder={approveAction === 'reject' ? t('dialogs.notesPlaceholder') : t('dialogs.notesOptional')}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialog({ open: false, item: null })}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleApproveSubmit} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? tCommon('loading') : tCommon('confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Ajustar Comisión */}
        <Dialog open={commissionDialog.open} onOpenChange={(open) => setCommissionDialog({ open, item: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('dialogs.commissionTitle')}</DialogTitle>
              <DialogDescription>{t('dialogs.commissionDesc')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {commissionDialog.item && (
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">{t('dialogs.currentRate')}</div>
                  <div className="text-lg font-medium">
                    {commissionDialog.item.customCommissionRate || '5'}%
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="commission-rate">
                  {t('dialogs.newRate')} <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="commission-rate"
                  type="number"
                  min="1"
                  max="50"
                  value={newCommissionRate}
                  onChange={(e) => setNewCommissionRate(e.target.value)}
                  placeholder={t('dialogs.ratePlaceholder')}
                />
                <p className="text-xs text-gray-500">{t('dialogs.rateHelp')}</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCommissionDialog({ open: false, item: null })}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleCommissionSubmit} disabled={commissionMutation.isPending}>
                {commissionMutation.isPending ? tCommon('loading') : tCommon('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Detalles del Afiliado */}
        <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ open, affiliateId: null })}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('dialogs.detailsTitle')}</DialogTitle>
            </DialogHeader>

            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : affiliateDetailsData ? (
              <div className="space-y-6">
                {/* Affiliate Info */}
                <div className="flex items-start space-x-4">
                  {affiliateDetailsData.affiliate.avatarUrl ? (
                    <img
                      src={affiliateDetailsData.affiliate.avatarUrl}
                      alt={affiliateDetailsData.affiliate.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xl font-medium text-gray-600">
                        {affiliateDetailsData.affiliate.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold">{affiliateDetailsData.affiliate.name}</h3>
                      {affiliateDetailsData.affiliate.isVerified && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          {t('badges.verified')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-500">@{affiliateDetailsData.affiliate.username}</p>
                    {affiliateDetailsData.affiliate.bio && (
                      <p className="text-sm text-gray-600 mt-2">{affiliateDetailsData.affiliate.bio}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span>{affiliateDetailsData.affiliate.followersCount.toLocaleString()} {t('dialogs.detailsFollowers')}</span>
                      <span>{affiliateDetailsData.affiliate.videosCount} {t('dialogs.detailsVideos')}</span>
                      <span>{affiliateDetailsData.affiliate.totalSales} {t('dialogs.detailsSales')}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      {affiliateDetailsData.affiliate.email && (
                        <a
                          href={`mailto:${affiliateDetailsData.affiliate.email}`}
                          className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          <span>{t('dialogs.detailsContact')}</span>
                        </a>
                      )}
                      {affiliateDetailsData.affiliate.website && (
                        <a
                          href={affiliateDetailsData.affiliate.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500">Clicks</div>
                      <div className="text-2xl font-bold">{affiliateDetailsData.stats.totalClicks.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500">Ventas</div>
                      <div className="text-2xl font-bold">{affiliateDetailsData.stats.totalSales}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500">Revenue</div>
                      <div className="text-2xl font-bold">${affiliateDetailsData.stats.totalRevenue.toLocaleString('es-CO')}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Products */}
                <div>
                  <h4 className="font-medium mb-3">{t('dialogs.detailsProducts')}</h4>
                  {affiliateDetailsData.products.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('dialogs.detailsNoProducts')}</p>
                  ) : (
                    <div className="space-y-2">
                      {affiliateDetailsData.products.map((prod) => (
                        <div key={prod.affiliateProductId} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center space-x-3">
                            {prod.productImageUrl ? (
                              <img
                                src={prod.productImageUrl}
                                alt={prod.productName}
                                className="h-12 w-12 rounded object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded bg-gray-200" />
                            )}
                            <div>
                              <div className="font-medium">{prod.productName}</div>
                              <div className="text-sm text-gray-500">
                                ${prod.productPrice.toLocaleString('es-CO')}
                                {prod.customCommissionRate && ` • ${prod.customCommissionRate}% comisión`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">{prod.totalSales} ventas</div>
                            <div className="text-sm font-medium">${prod.totalCommissions.toLocaleString('es-CO')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialog({ open: false, affiliateId: null })}>
                {tCommon('cancel')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
