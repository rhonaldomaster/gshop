'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { CreatorStats } from '@/types'

interface StatsCardsProps {
  stats: CreatorStats | null
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Followers",
      value: formatNumber(stats?.totalFollowers || 0),
      icon: Icons.users,
      color: "text-primary",
      bgColor: "bg-sky-50",
    },
    {
      title: "Total Views",
      value: formatNumber(stats?.totalViews || 0),
      icon: Icons.eye,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Videos",
      value: formatNumber(stats?.totalVideos || 0),
      icon: Icons.video,
      color: "text-secondary",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Earnings",
      value: formatCurrency(stats?.totalEarnings || 0),
      icon: Icons.dollarSign,
      color: "text-accent",
      bgColor: "bg-pink-50",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}