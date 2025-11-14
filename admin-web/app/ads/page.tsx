'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, PlayCircle, PauseCircle, BarChart3, Users, Target } from 'lucide-react'
import { CampaignsList } from '@/components/ads/campaigns-list'
import { CreateCampaignDialog } from '@/components/ads/create-campaign-dialog'
import { CampaignMetrics } from '@/components/ads/campaign-metrics'
import { AudienceManager } from '@/components/ads/audience-manager'

export default function AdsManagerPage() {
  const t = useTranslations('ads')
  const [activeTab, setActiveTab] = useState('campaigns')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true)
      const response = await fetch('/api/ads/dashboard')
      if (response.ok) {
        const stats = await response.json()
        setDashboardStats(stats)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('pageTitle')}</h1>
          <p className="text-muted-foreground">
            {t('pageDescription')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createCampaign')}
        </Button>
      </div>

      {/* Dashboard Stats */}
      {statsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : dashboardStats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalCampaigns')}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.activeCampaigns} {t('activeCampaigns')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalSpent')}</CardTitle>
              <span className="h-4 w-4 text-muted-foreground">$</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboardStats.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                ${dashboardStats.totalRevenue.toFixed(2)} {t('revenue')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('averageCTR')}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(dashboardStats.avgCTR * 100).toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.clicks.toLocaleString()} {t('totalClicks')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('averageROAS')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.avgROAS.toFixed(2)}x</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.conversions} {t('conversions')}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">{t('campaigns')}</TabsTrigger>
          <TabsTrigger value="audiences">{t('audiences')}</TabsTrigger>
          <TabsTrigger value="metrics">{t('analytics')}</TabsTrigger>
          <TabsTrigger value="dpa">{t('dynamicAds')}</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('campaignsTitle')}</CardTitle>
              <CardDescription>
                {t('campaignsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignsList onRefresh={fetchDashboardStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audiences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('audienceManagerTitle')}</CardTitle>
              <CardDescription>
                {t('audienceManagerDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudienceManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('analyticsTitle')}</CardTitle>
              <CardDescription>
                {t('analyticsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CampaignMetrics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dpa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dpaTitle')}</CardTitle>
              <CardDescription>
                {t('dpaDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">{t('dpaEmptyTitle')}</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                  {t('dpaEmptyDescription')}
                </p>
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  {t('createDPACampaign')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
          fetchDashboardStats()
        }}
      />
    </div>
  )
}