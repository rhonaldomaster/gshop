'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, TrendingUp, TrendingDown, BarChart3, DollarSign } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'

interface CampaignMetric {
  id: string
  campaignId: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  ctr: number
  cpa: number
  roas: number
  date: string
}

interface Campaign {
  id: string
  name: string
}

export function CampaignMetrics() {
  const t = useTranslations('ads.metrics')
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>('')
  const [metrics, setMetrics] = useState<CampaignMetric[]>([])
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  useEffect(() => {
    if (selectedCampaign) {
      fetchMetrics()
    }
  }, [selectedCampaign, dateRange])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/ads/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
        if (data.length > 0) {
          setSelectedCampaign(data[0].id)
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch campaigns.',
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
    }
  }

  const fetchMetrics = async () => {
    if (!selectedCampaign) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      })

      const response = await fetch(`/api/ads/campaigns/${selectedCampaign}/metrics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch campaign metrics.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      toast({
        title: 'Error',
        description: 'Failed to load metrics. Please check your connection.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = () => {
    return metrics.reduce(
      (acc, metric) => ({
        impressions: acc.impressions + metric.impressions,
        clicks: acc.clicks + metric.clicks,
        conversions: acc.conversions + metric.conversions,
        spend: acc.spend + metric.spend,
        revenue: acc.revenue + metric.revenue,
      }),
      { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
    )
  }

  const calculateAverages = () => {
    const totals = calculateTotals()
    const daysWithData = metrics.length

    if (daysWithData === 0) {
      return { ctr: 0, cpa: 0, roas: 0 }
    }

    return {
      ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
      cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
      roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
    }
  }

  const getPerformanceIcon = (current: number, target: number) => {
    if (current > target) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    }
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  const totals = calculateTotals()
  const averages = calculateAverages()

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder={t('selectCampaign')} />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to })
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={() => setDateRange({
            from: subDays(new Date(), 7),
            to: new Date()
          })}>
            {t('last7Days')}
          </Button>

          <Button variant="outline" onClick={() => setDateRange({
            from: subDays(new Date(), 30),
            to: new Date()
          })}>
            {t('last30Days')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalImpressions')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {(totals.impressions / Math.max(1, metrics.length)).toFixed(0)} {t('avgPerDay')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('clickThroughRate')}</CardTitle>
            {getPerformanceIcon(averages.ctr, 0.02)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(averages.ctr * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {totals.clicks.toLocaleString()} {t('totalClicks')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costPerAcquisition')}</CardTitle>
            {getPerformanceIcon(50, averages.cpa)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averages.cpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totals.conversions} {t('conversions')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('returnOnAdSpend')}</CardTitle>
            {getPerformanceIcon(averages.roas, 3)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averages.roas.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground">
              ${totals.revenue.toFixed(2)} {t('revenue')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dailyPerformance')}</CardTitle>
          <CardDescription>
            {t('performanceDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">{t('loadingMetrics')}</div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{t('noDataAvailable')}</h3>
              <p className="text-muted-foreground">
                {t('noMetricsFound')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simple table view - in a real app, you'd use a charting library */}
              <div className="rounded-md border">
                <div className="grid grid-cols-7 gap-4 p-4 text-sm font-medium border-b">
                  <div>{t('date')}</div>
                  <div>{t('impressions')}</div>
                  <div>{t('clicks')}</div>
                  <div>{t('ctr')}</div>
                  <div>{t('conversions')}</div>
                  <div>{t('spend')}</div>
                  <div>{t('roas')}</div>
                </div>
                {metrics.slice().reverse().map((metric) => (
                  <div key={metric.id} className="grid grid-cols-7 gap-4 p-4 text-sm border-b last:border-b-0">
                    <div>{format(new Date(metric.date), 'MMM dd')}</div>
                    <div>{metric.impressions.toLocaleString()}</div>
                    <div>{metric.clicks}</div>
                    <div>{(metric.ctr * 100).toFixed(2)}%</div>
                    <div>{metric.conversions}</div>
                    <div>${metric.spend.toFixed(2)}</div>
                    <div>{metric.roas.toFixed(2)}x</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}