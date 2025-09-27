'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { formatNumber, formatDate, getVideoThumbnail } from '@/lib/utils'
import { AffiliateVideo } from '@/types'

export default function RecentVideos() {
  const [videos, setVideos] = useState<AffiliateVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentVideos()
  }, [])

  const fetchRecentVideos = async () => {
    try {
      const token = localStorage.getItem('creator_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/creators/videos?limit=6`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Icons.spinner className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Videos</CardTitle>
        <Button size="sm" asChild>
          <a href="/dashboard/content">
            <Icons.plus className="h-4 w-4 mr-2" />
            Create Video
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <div className="text-center py-8">
            <Icons.video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
            <p className="text-muted-foreground mb-4">Start creating content to grow your audience</p>
            <Button asChild>
              <a href="/dashboard/content/create">
                <Icons.plus className="h-4 w-4 mr-2" />
                Create Your First Video
              </a>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div key={video.id} className="group cursor-pointer">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={video.thumbnailUrl || getVideoThumbnail(video.videoUrl)}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icons.play className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 space-y-1">
                  <h4 className="font-medium line-clamp-2">{video.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icons.eye className="h-3 w-3" />
                      {formatNumber(video.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icons.heart className="h-3 w-3" />
                      {formatNumber(video.likes)}
                    </span>
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}