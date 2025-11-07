'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PlayCircle, PauseCircle, MoreHorizontal, Edit, Trash, BarChart3 } from 'lucide-react'

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
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
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
      }
    } catch (error) {
      console.error('Failed to update campaign status:', error)
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return
    }

    try {
      const response = await fetch(`/api/ads/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCampaigns()
        onRefresh?.()
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      active: 'default',
      paused: 'outline',
      completed: 'secondary',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const labels = {
      dpa: 'Dynamic Product Ads',
      retargeting: 'Retargeting',
      custom: 'Custom',
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
    const revenue = campaign.metrics.reduce((acc, m) => acc + (m.roas * campaign.spent), 0)
    const roas = campaign.spent > 0 ? revenue / campaign.spent : 0

    return {
      ...totals,
      ctr,
      cpa,
      roas,
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading campaigns...</div>
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No campaigns yet</h3>
        <p className="text-muted-foreground">
          Create your first advertising campaign to start reaching customers.
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
              <TableHead>Campaign</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead>Performance</TableHead>
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
                        Created {new Date(campaign.createdAt).toLocaleDateString()}
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
                        ${campaign.dailyBudget.toFixed(2)}/day
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${campaign.spent.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {((campaign.spent / campaign.budget) * 100).toFixed(1)}% of budget
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">{metrics.impressions.toLocaleString()}</span> impressions
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{(metrics.ctr * 100).toFixed(2)}%</span> CTR
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{metrics.roas.toFixed(2)}x</span> ROAS
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
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteCampaign(campaign.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
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