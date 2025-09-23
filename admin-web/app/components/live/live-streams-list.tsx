'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Play, Square, MoreHorizontal, Edit, Trash, Users, DollarSign, Radio } from 'lucide-react'

interface LiveStream {
  id: string
  title: string
  description: string
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  viewerCount: number
  peakViewers: number
  totalSales: number
  scheduledAt: string | null
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  products: Array<{
    id: string
    product: {
      name: string
      price: number
    }
    orderCount: number
    revenue: number
  }>
}

interface LiveStreamsListProps {
  onRefresh?: () => void
}

export function LiveStreamsList({ onRefresh }: LiveStreamsListProps) {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStreams()
  }, [])

  const fetchStreams = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/live/streams')
      if (response.ok) {
        const data = await response.json()
        setStreams(data)
      }
    } catch (error) {
      console.error('Failed to fetch streams:', error)
    } finally {
      setLoading(false)
    }
  }

  const startStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/live/streams/${streamId}/start`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchStreams()
        onRefresh?.()
      }
    } catch (error) {
      console.error('Failed to start stream:', error)
    }
  }

  const endStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/live/streams/${streamId}/end`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchStreams()
        onRefresh?.()
      }
    } catch (error) {
      console.error('Failed to end stream:', error)
    }
  }

  const deleteStream = async (streamId: string) => {
    if (!confirm('Are you sure you want to delete this stream?')) {
      return
    }

    try {
      const response = await fetch(`/api/live/streams/${streamId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchStreams()
        onRefresh?.()
      }
    } catch (error) {
      console.error('Failed to delete stream:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'secondary',
      live: 'default',
      ended: 'outline',
      cancelled: 'destructive',
    } as const

    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      live: 'bg-red-100 text-red-800 animate-pulse',
      ended: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'live' && <Radio className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (startedAt: string | null, endedAt: string | null) => {
    if (!startedAt) return 'Not started'

    const start = new Date(startedAt)
    const end = endedAt ? new Date(endedAt) : new Date()
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000 / 60)

    return `${duration} min`
  }

  if (loading) {
    return <div className="text-center py-8">Loading streams...</div>
  }

  if (streams.length === 0) {
    return (
      <div className="text-center py-12">
        <Radio className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No live streams yet</h3>
        <p className="text-muted-foreground">
          Create your first live shopping stream to start engaging with customers in real-time.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stream</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Viewers</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {streams.map((stream) => (
              <TableRow key={stream.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{stream.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {stream.description || 'No description'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(stream.createdAt)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(stream.status)}
                  {stream.scheduledAt && stream.status === 'scheduled' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Scheduled: {formatDate(stream.scheduledAt)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{stream.viewerCount}</div>
                      <div className="text-xs text-muted-foreground">
                        Peak: {stream.peakViewers}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{stream.products.length}</div>
                    <div className="text-xs text-muted-foreground">
                      {stream.products.reduce((sum, p) => sum + p.orderCount, 0)} orders
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">${stream.totalSales.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        ${stream.products.reduce((sum, p) => sum + p.revenue, 0).toFixed(2)} products
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDuration(stream.startedAt, stream.endedAt)}
                  </div>
                  {stream.startedAt && (
                    <div className="text-xs text-muted-foreground">
                      Started: {new Date(stream.startedAt).toLocaleTimeString()}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {stream.status === 'scheduled' || stream.status === 'ended' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startStream(stream.id)}
                        disabled={stream.status === 'ended'}
                        title="Start stream"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : stream.status === 'live' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => endStream(stream.id)}
                        title="End stream"
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    ) : null}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Stream
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          View Analytics
                        </DropdownMenuItem>
                        {stream.status !== 'live' && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteStream(stream.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}