'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Users, Clock, DollarSign, TrendingUp, Radio } from 'lucide-react'
import { format, subDays } from 'date-fns'

interface StreamMetrics {
  streamId: string
  title: string
  status: string
  hostType: string
  metrics: {
    peakViewers: number
    totalViewers: number
    avgWatchTime: number
    totalSales: number
    ordersCount: number
    conversionRate: number
    messages: number
  }
  viewersByTime: Array<{ timestamp: Date; viewers: number }>
  topProducts: Array<{
    productId: string
    name: string
    units: number
    revenue: number
  }>
}

interface LiveStream {
  id: string
  title: string
  status: string
}

export function LiveStreamMetrics() {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [selectedStream, setSelectedStream] = useState<string>('')
  const [metrics, setMetrics] = useState<StreamMetrics | null>(null)
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStreams()
  }, [])

  useEffect(() => {
    if (selectedStream) {
      fetchMetrics()
    }
  }, [selectedStream])

  const fetchStreams = async () => {
    try {
      const response = await fetch('/api/live/streams')
      if (response.ok) {
        const data = await response.json()
        setStreams(data)
        if (data.length > 0) {
          setSelectedStream(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch streams:', error)
    }
  }

  const fetchMetrics = async () => {
    if (!selectedStream) return

    try {
      setLoading(true)
      const response = await fetch(`/api/v1/live/analytics/${selectedStream}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      } else {
        setMetrics(null)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const calculateEngagementRate = () => {
    if (!metrics || metrics.metrics.totalViewers === 0) return 0
    return (metrics.metrics.messages / metrics.metrics.totalViewers) * 100
  }

  const calculateConversionRate = () => {
    if (!metrics) return 0
    return metrics.metrics.conversionRate * 100
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'text-red-600'
      case 'ended':
        return 'text-gray-600'
      case 'scheduled':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedStream} onValueChange={setSelectedStream}>
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="Select a stream" />
            </SelectTrigger>
            <SelectContent>
              {streams.map((stream) => (
                <SelectItem key={stream.id} value={stream.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      stream.status === 'live' ? 'bg-red-500 animate-pulse' :
                      stream.status === 'ended' ? 'bg-gray-400' : 'bg-blue-500'
                    }`} />
                    {stream.title}
                    <span className={`text-xs ${getStatusColor(stream.status)}`}>
                      ({stream.status})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={fetchMetrics}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading metrics...</div>
      ) : !metrics ? (
        <div className="text-center py-12">
          <Radio className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No metrics available</h3>
          <p className="text-muted-foreground">
            Select a stream to view its performance metrics and analytics.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Peak Viewers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.metrics.peakViewers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum concurrent viewers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.metrics.totalViewers}</div>
                <p className="text-xs text-muted-foreground">
                  {calculateEngagementRate().toFixed(1)}% engagement rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Watch Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatDuration(Math.round(metrics.metrics.avgWatchTime / 60))}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.metrics.messages} chat messages
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${metrics.metrics.totalSales.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.metrics.ordersCount} orders ({calculateConversionRate().toFixed(1)}% conv.)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Audience Engagement</CardTitle>
                <CardDescription>
                  How viewers are interacting with your stream
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Viewers</span>
                    <span className="font-medium">{metrics.metrics.totalViewers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Peak Concurrent</span>
                    <span className="font-medium">{metrics.metrics.peakViewers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Chat Messages</span>
                    <span className="font-medium">{metrics.metrics.messages}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Engagement Rate</span>
                    <span className="font-medium">{calculateEngagementRate().toFixed(1)}%</span>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="text-sm text-muted-foreground mb-2">Viewer Retention</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (metrics.metrics.totalViewers / Math.max(1, metrics.metrics.peakViewers)) * 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Average viewer retention based on peak viewers
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>
                  Revenue and conversion metrics from your stream
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Products Featured</span>
                    <span className="font-medium">{metrics.topProducts.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Orders</span>
                    <span className="font-medium">{metrics.metrics.ordersCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Revenue</span>
                    <span className="font-medium">${metrics.metrics.totalSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Conversion Rate</span>
                    <span className="font-medium">{calculateConversionRate().toFixed(1)}%</span>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="text-sm text-muted-foreground mb-2">Revenue per Viewer</div>
                  <div className="text-2xl font-bold">
                    ${metrics.metrics.totalViewers > 0 ? (metrics.metrics.totalSales / metrics.metrics.totalViewers).toFixed(2) : '0.00'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Average revenue generated per viewer
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stream Status */}
          <Card>
            <CardHeader>
              <CardTitle>Stream Status</CardTitle>
              <CardDescription>
                Current status and technical information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm font-medium mb-1">Status</div>
                  <div className={`text-lg font-semibold ${getStatusColor(metrics.status)}`}>
                    {metrics.status === 'live' && <Radio className="inline w-4 h-4 mr-1" />}
                    {metrics.status.charAt(0).toUpperCase() + metrics.status.slice(1)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Avg Watch Time</div>
                  <div className="text-lg font-semibold">
                    {formatDuration(Math.round(metrics.metrics.avgWatchTime / 60))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Host Type</div>
                  <div className="text-lg font-semibold capitalize">
                    {metrics.hostType}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}