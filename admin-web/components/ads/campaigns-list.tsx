'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PlayCircle, PauseCircle, MoreHorizontal, Edit, Trash, BarChart3 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Campaign {
  id: string
  name: string
  type: 'dpa' | 'retargeting' | 'custom'
  status: 'draft' | 'active' | 'paused' | 'completed'
  budget: number
  dailyBudget: number
  spent: number
  createdAt: string
  metrics: {
    impressions: number
    clicks: number
    conversions: number
    ctr: number
    cpa: number
    roas: number
  }[]
}

interface CampaignsListProps {
  onRefresh?: () => void
}

export function CampaignsList({ onRefresh }: CampaignsListProps) {
  const t = useTranslations('ads')
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ads/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch campaigns. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      toast({
        title: 'Error',
        description: 'Failed to load campaigns. Please check your connection.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      const response = await fetch(`/api/ads/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await fetchCampaigns()
        onRefresh?.()
        toast({
          title: 'Success',
          description: `Campaign ${status === 'active' ? 'activated' : 'paused'} successfully.`,
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update campaign status.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to update campaign status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update campaign status. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm(t('confirmDelete'))) {
      return
    }

    try {
      const response = await fetch(`/api/ads/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCampaigns()
        onRefresh?.()
        toast({
          title: 'Success',
          description: 'Campaign deleted successfully.',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete campaign.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete campaign. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      active: 'default',
      paused: 'outline',
      completed: 'secondary',
    } as const

    const labels = {
      draft: t('draft'),
      active: t('active'),
      paused: t('paused'),
      completed: t('completed'),
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const labels = {
      dpa: t('dpaLabel'),
      retargeting: t('retargetingLabel'),
      custom: t('customLabel'),
    }

    return (
      <Badge variant="outline">
        {labels[type as keyof typeof labels] || type}
      </Badge>
    )
  }

  const calculateMetrics = (campaign: Campaign) => {
    if (!campaign.metrics || campaign.metrics.length === 0) {
      return { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpa: 0, roas: 0 }
    }

    const totals = campaign.metrics.reduce(
      (acc, metric) => ({
        impressions: acc.impressions + metric.impressions,
        clicks: acc.clicks + metric.clicks,
        conversions: acc.conversions + metric.conversions,
      }),
      { impressions: 0, clicks: 0, conversions: 0 }
    )

    const ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0
    const cpa = totals.conversions > 0 ? campaign.spent / totals.conversions : 0

    // Calculate average ROAS from metrics (weighted by daily performance)
    const avgRoas = campaign.metrics.length > 0
      ? campaign.metrics.reduce((acc, m) => acc + m.roas, 0) / campaign.metrics.length
      : 0

    return {
      ...totals,
      ctr,
      cpa,
      roas: avgRoas,
    }
  }

  if (loading) {
    return <div className="text-center py-8">{t('loadingCampaigns')}</div>
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">{t('noCampaigns')}</h3>
        <p className="text-muted-foreground">
          {t('noCampaignsDescription')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('campaign')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('budget')}</TableHead>
              <TableHead>{t('spent')}</TableHead>
              <TableHead>{t('performance')}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              const metrics = calculateMetrics(campaign)
              return (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('created')} {new Date(campaign.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(campaign.type)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(campaign.status)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">${campaign.budget.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        ${campaign.dailyBudget.toFixed(2)}{t('perDay')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${campaign.spent.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {((campaign.spent / campaign.budget) * 100).toFixed(1)}% {t('ofBudget')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">{metrics.impressions.toLocaleString()}</span> {t('impressions')}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{(metrics.ctr * 100).toFixed(2)}%</span> {t('ctr')}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{metrics.roas.toFixed(2)}x</span> {t('roas')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {campaign.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                        >
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCampaignStatus(campaign.id, 'active')}
                          disabled={campaign.status === 'completed'}
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            {t('viewAnalytics')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteCampaign(campaign.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}