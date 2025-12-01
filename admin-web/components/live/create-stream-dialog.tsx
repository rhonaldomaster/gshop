'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('live.createDialog')
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
              {t('successTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('successDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>{t('streamTitleLabel')}</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{createdStream.title}</p>
                  {createdStream.description && (
                    <p className="text-sm text-muted-foreground mt-1">{createdStream.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('rtmpServerUrl')}</Label>
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
                <Label>{t('streamKey')}</Label>
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
                <Label>{t('hlsPlaybackUrl')}</Label>
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
              <h4 className="font-medium text-blue-900 mb-2">{t('gettingStarted')}</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>{t('step1')}</li>
                <li>{t('step2')}</li>
                <li>{t('step3')}</li>
                <li>{t('step4')}</li>
                <li>{t('step5')}</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>
              {t('close')}
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
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('streamTitle')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('streamTitlePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('descriptionLabel')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('scheduleStream')}</Label>
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
                    t('streamImmediately')
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
              {t('scheduleHelp')}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('creating') : t('createStream')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}