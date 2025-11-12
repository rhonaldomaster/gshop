'use client'

import { useState, useEffect } from 'react'
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

export default function LiveShoppingPage() {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Live Shopping</h1>
            {isConnected ? (
              <Badge variant="outline" className="gap-1">
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-green-500">Live Updates</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <WifiOff className="h-3 w-3 text-gray-400" />
                <span className="text-gray-400">Offline</span>
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Manage live streaming sessions and real-time product showcases
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Live Stream
        </Button>
      </div>

      {/* Dashboard Stats */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
              <Radio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalStreams}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.liveStreams} currently live
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalViewers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Avg {formatViewTime(dashboardStats.avgViewTime)} watch time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboardStats.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {(dashboardStats.conversionRate * 100).toFixed(1)}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.engagementRate?.toFixed(2) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.totalMessages?.toLocaleString() || 0} messages sent
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="streams">Live Streams</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="streams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Streams</CardTitle>
              <CardDescription>
                Manage your live streaming sessions and product showcases
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
              <CardTitle>Live Stream Analytics</CardTitle>
              <CardDescription>
                Performance metrics and insights for your live shopping sessions
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
              <CardTitle>Live Shopping Settings</CardTitle>
              <CardDescription>
                Configure streaming settings and integration options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Streaming Configuration</CardTitle>
                      <CardDescription>
                        RTMP and streaming server settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">RTMP Server</label>
                        <p className="text-sm text-muted-foreground">rtmp://localhost:1935/live</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">HLS Playback</label>
                        <p className="text-sm text-muted-foreground">http://localhost:8080/hls</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure Streaming
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Chat Settings</CardTitle>
                      <CardDescription>
                        Moderation and chat configuration
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-moderation</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Spam filtering</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage Chat Rules
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Integration Guide</CardTitle>
                    <CardDescription>
                      How to set up live streaming with popular streaming software
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">OBS Studio Setup</h4>
                        <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 mt-2">
                          <li>Open OBS Studio and go to Settings → Stream</li>
                          <li>Set Service to "Custom..."</li>
                          <li>Enter Server: rtmp://localhost:1935/live</li>
                          <li>Enter your unique Stream Key (provided when creating a stream)</li>
                          <li>Click "Start Streaming" to go live</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium">Mobile Streaming</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          Use apps like Streamlabs Mobile or Larix Broadcaster with the same RTMP URL and stream key.
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
  )
}