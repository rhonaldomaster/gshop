'use client'

import { useState, useEffect } from 'react'
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
  const [activeTab, setActiveTab] = useState('campaigns')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<any>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/ads/dashboard')
      if (response.ok) {
        const stats = await response.json()
        setDashboardStats(stats)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ads Manager</h1>
          <p className="text-muted-foreground">
            Create and manage advertising campaigns, audiences, and dynamic product ads
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.activeCampaigns} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <span className="h-4 w-4 text-muted-foreground">$</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboardStats.totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                ${dashboardStats.totalRevenue.toFixed(2)} revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(dashboardStats.avgCTR * 100).toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.clicks.toLocaleString()} total clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average ROAS</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.avgROAS.toFixed(2)}x</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.conversions} conversions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="audiences">Audiences</TabsTrigger>
          <TabsTrigger value="metrics">Analytics</TabsTrigger>
          <TabsTrigger value="dpa">Dynamic Ads</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>
                Manage your advertising campaigns and track their performance
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
              <CardTitle>Audience Manager</CardTitle>
              <CardDescription>
                Create and manage custom audiences for targeted advertising
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
              <CardTitle>Campaign Analytics</CardTitle>
              <CardDescription>
                Detailed metrics and performance analytics for your campaigns
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
              <CardTitle>Dynamic Product Ads</CardTitle>
              <CardDescription>
                Automatically generated ads featuring your product catalog
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Dynamic Product Ads</h3>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                  Automatically show relevant products to users based on their browsing behavior
                  and purchase history. DPA campaigns are generated from your product catalog.
                </p>
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                  Create DPA Campaign
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