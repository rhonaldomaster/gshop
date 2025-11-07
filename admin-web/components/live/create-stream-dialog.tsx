'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock, Radio, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'

interface CreateStreamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateStreamDialog({ open, onOpenChange, onSuccess }: CreateStreamDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: undefined as Date | undefined,
  })
  const [loading, setLoading] = useState(false)
  const [createdStream, setCreatedStream] = useState<any>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/live/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          scheduledAt: formData.scheduledAt?.toISOString(),
        }),
      })

      if (response.ok) {
        const stream = await response.json()
        setCreatedStream(stream)
      } else {
        console.error('Failed to create stream')
      }
    } catch (error) {
      console.error('Error creating stream:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduledAt: undefined,
    })
    setCreatedStream(null)
  }

  const handleClose = () => {
    if (createdStream) {
      onSuccess()
    }
    onOpenChange(false)
    resetForm()
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (createdStream) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-green-600" />
              Stream Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Your live stream has been created. Use the streaming details below to start broadcasting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Stream Title</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{createdStream.title}</p>
                  {createdStream.description && (
                    <p className="text-sm text-muted-foreground mt-1">{createdStream.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>RTMP Server URL</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
                    {createdStream.rtmpUrl}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdStream.rtmpUrl, 'rtmp')}
                  >
                    {copiedField === 'rtmp' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Stream Key</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
                    {createdStream.streamKey}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdStream.streamKey, 'key')}
                  >
                    {copiedField === 'key' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>HLS Playback URL</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
                    {createdStream.hlsUrl}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdStream.hlsUrl, 'hls')}
                  >
                    {copiedField === 'hls' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Getting Started</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open your streaming software (OBS, Streamlabs, etc.)</li>
                <li>Set the RTMP server URL and stream key in your streaming settings</li>
                <li>Add your products to the stream from the Live Streams page</li>
                <li>Click "Start Streaming" in your software to go live</li>
                <li>Monitor your stream performance in real-time</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Live Stream</DialogTitle>
          <DialogDescription>
            Set up a new live shopping stream to showcase your products in real-time
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Stream Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter stream title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you'll be showcasing in this stream"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Schedule Stream (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.scheduledAt ? (
                    format(formData.scheduledAt, 'PPP p')
                  ) : (
                    'Stream immediately or pick a date'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.scheduledAt}
                  onSelect={(date) => setFormData({ ...formData, scheduledAt: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Leave blank to create a stream that can be started immediately
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Stream'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}