'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Radio, Users, ShoppingCart, Calendar, Play, Square, Wifi, WifiOff } from 'lucide-react'
import { LiveStreamsList } from '@/components/live/live-streams-list'
import { CreateStreamDialog } from '@/components/live/create-stream-dialog'
import { LiveStreamMetrics } from '@/components/live/live-stream-metrics'
import { useLiveWebSocket } from '@/hooks/useLiveWebSocket'
import { useToast } from '@/hooks/use-toast'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function LiveShoppingPage() {
  const t = useTranslations('live')
  const [activeTab, setActiveTab] = useState('streams')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const { toast } = useToast()

  // WebSocket connection for real-time updates
  const { isConnected } = useLiveWebSocket({
    onPurchase: (purchase) => {
      // Show toast notification for live purchases
      toast({
        title: '🎉 Live Purchase!',
        description: `${purchase.buyerName} bought ${purchase.productName} for $${purchase.amount.toFixed(2)} during ${purchase.streamTitle}`,
      })

      // Refresh dashboard stats
      fetchDashboardStats()
    },
    onStreamEnded: (stats) => {
      // Show toast with stream summary
      toast({
        title: '📺 Stream Ended',
        description: `${stats.streamTitle} ended with ${stats.totalViewers} viewers and $${stats.totalSales.toFixed(2)} in sales`,
      })

      // Refresh dashboard stats
      fetchDashboardStats()
    },
    onDashboardUpdate: (stats) => {
      // Update dashboard stats in real-time
      setDashboardStats(stats)
    },
  })

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/v1/live/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardStats(data)
      } else {
        setDashboardStats(null)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      setDashboardStats(null)
    }
  }

  const formatViewTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{t('pageTitle')}</h1>
            {isConnected ? (
              <Badge variant="outline" className="gap-1">
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-green-500">{t('liveUpdates')}</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <WifiOff className="h-3 w-3 text-gray-400" />
                <span className="text-gray-400">{t('offline')}</span>
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {t('pageDescription')}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createLiveStream')}
        </Button>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalStreams')}</CardTitle>
              <Radio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalStreams}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.liveStreams} {t('currentlyLive')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalViewers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalViewers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {t('avgWatchTime')} {formatViewTime(dashboardStats.avgViewTime)} {t('watchTime')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('liveSales')}</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboardStats.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {(dashboardStats.conversionRate * 100).toFixed(1)}% {t('conversionRate')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('engagement')}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.engagementRate?.toFixed(2) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.totalMessages?.toLocaleString() || 0} {t('messagesSent')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="streams">{t('liveStreams')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('analytics')}</TabsTrigger>
          <TabsTrigger value="settings">{t('settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="streams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('liveStreams')}</CardTitle>
              <CardDescription>
                {t('liveStreamsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveStreamsList onRefresh={fetchDashboardStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('liveStreamAnalytics')}</CardTitle>
              <CardDescription>
                {t('analyticsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveStreamMetrics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('liveShoppingSettings')}</CardTitle>
              <CardDescription>
                {t('settingsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('streamingConfiguration')}</CardTitle>
                      <CardDescription>
                        {t('rtmpSettings')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">{t('rtmpServer')}</label>
                        <p className="text-sm text-muted-foreground">rtmp://localhost:1935/live</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">{t('hlsPlayback')}</label>
                        <p className="text-sm text-muted-foreground">http://localhost:8080/hls</p>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('configureStreaming')}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('chatSettings')}</CardTitle>
                      <CardDescription>
                        {t('moderationConfig')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t('autoModeration')}</span>
                        <Badge variant="outline">{t('enabled')}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{t('spamFiltering')}</span>
                        <Badge variant="outline">{t('enabled')}</Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('manageChatRules')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('integrationGuide')}</CardTitle>
                    <CardDescription>
                      {t('integrationDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">{t('obsSetup')}</h4>
                        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 mt-2">
                          <li>{t('obsStep1')}</li>
                          <li>{t('obsStep2')}</li>
                          <li>{t('obsStep3')}</li>
                          <li>{t('obsStep4')}</li>
                          <li>{t('obsStep5')}</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium">{t('mobileStreaming')}</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          {t('mobileDescription')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Stream Dialog */}
      <CreateStreamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
          fetchDashboardStats()
        }}
      />
      </div>
    </DashboardLayout>
  )
}