'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Icons } from '@/components/ui/icons'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { CreatorStats } from '@/types'
import StatsCards from '@/components/dashboard/StatsCards'
import RecentVideos from '@/components/dashboard/RecentVideos'
import EarningsChart from '@/components/dashboard/EarningsChart'
import FollowerGrowth from '@/components/dashboard/FollowerGrowth'
import QuickActions from '@/components/dashboard/QuickActions'

export default function DashboardPage() {
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('creator_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creators/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Icons.spinner className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard ✨</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your creator performance overview.
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.dollarSign className="h-5 w-5" />
              Earnings Overview
            </CardTitle>
            <CardDescription>
              Your earnings performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EarningsChart data={stats?.recentEarnings || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.trendingUp className="h-5 w-5" />
              Follower Growth
            </CardTitle>
            <CardDescription>
              Track your audience growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FollowerGrowth />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">Recent Videos</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Video</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.topVideo ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold">{stats.topVideo.title}</h4>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{formatNumber(stats.topVideo.views)} views</span>
                      <span>{formatNumber(stats.topVideo.likes)} likes</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No videos yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.engagementRate?.toFixed(1) || '0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Average across all videos
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <RecentVideos />
        </TabsContent>

        <TabsContent value="actions">
          <QuickActions />
        </TabsContent>
      </Tabs>
    </div>
  )
}