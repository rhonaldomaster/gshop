'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'

export default function QuickActions() {
  const actions = [
    {
      title: "Upload Video",
      description: "Create new content for your audience",
      icon: Icons.upload,
      href: "/dashboard/content/create",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Go Live",
      description: "Start a live stream to engage followers",
      icon: Icons.radio,
      href: "/dashboard/live/create",
      color: "bg-red-500 hover:bg-red-600",
    },
    {
      title: "View Analytics",
      description: "Check your performance metrics",
      icon: Icons.barChart,
      href: "/dashboard/analytics",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Manage Profile",
      description: "Update your creator profile",
      icon: Icons.user,
      href: "/dashboard/profile",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {actions.map((action, index) => (
        <Card key={index} className="group hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-lg">{action.title}</CardTitle>
            <CardDescription>{action.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full">
              <a href={action.href}>
                Get Started
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}