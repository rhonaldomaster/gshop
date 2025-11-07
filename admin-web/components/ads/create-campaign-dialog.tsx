'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateCampaignDialog({ open, onOpenChange, onSuccess }: CreateCampaignDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    budget: '',
    dailyBudget: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.type || !formData.budget || !formData.dailyBudget) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/ads/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          description: formData.description,
          budget: parseFloat(formData.budget),
          dailyBudget: parseFloat(formData.dailyBudget),
          startDate: formData.startDate?.toISOString(),
          endDate: formData.endDate?.toISOString(),
          targetAudience: getDefaultTargetAudience(formData.type),
          creative: getDefaultCreative(formData.type),
        }),
      })

      if (response.ok) {
        onSuccess()
        resetForm()
      } else {
        console.error('Failed to create campaign')
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      description: '',
      budget: '',
      dailyBudget: '',
      startDate: undefined,
      endDate: undefined,
    })
  }

  const getDefaultTargetAudience = (type: string) => {
    switch (type) {
      case 'dpa':
        return {
          events: ['product_view', 'add_to_cart'],
          timeframe: 30,
          conditions: {}
        }
      case 'retargeting':
        return {
          events: ['product_view'],
          timeframe: 7,
          conditions: {
            purchaseCompleted: false
          }
        }
      default:
        return {}
    }
  }

  const getDefaultCreative = (type: string) => {
    switch (type) {
      case 'dpa':
        return {
          format: 'dynamic',
          template: 'product_showcase',
          autoGenerate: true
        }
      case 'retargeting':
        return {
          format: 'static',
          template: 'reminder',
          message: 'Complete your purchase'
        }
      default:
        return {}
    }
  }

  const campaignTypes = [
    {
      value: 'dpa',
      label: 'Dynamic Product Ads',
      description: 'Automatically show relevant products from your catalog',
      recommended: true,
    },
    {
      value: 'retargeting',
      label: 'Retargeting Campaign',
      description: 'Re-engage users who have shown interest in your products',
      recommended: false,
    },
    {
      value: 'custom',
      label: 'Custom Campaign',
      description: 'Create a custom advertising campaign with specific targeting',
      recommended: false,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up a new advertising campaign to reach your target audience
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Type Selection */}
          <div className="space-y-4">
            <Label>Campaign Type</Label>
            <div className="grid gap-3">
              {campaignTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-colors ${
                    formData.type === type.value
                      ? 'ring-2 ring-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setFormData({ ...formData, type: type.value })}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{type.label}</CardTitle>
                      {type.recommended && (
                        <Badge variant="secondary">Recommended</Badge>
                      )}
                    </div>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter campaign name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Total Budget *</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="1"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your campaign goals and target audience"
              rows={3}
            />
          </div>

          {/* Budget and Scheduling */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dailyBudget">Daily Budget *</Label>
              <Input
                id="dailyBudget"
                type="number"
                step="0.01"
                min="1"
                value={formData.dailyBudget}
                onChange={(e) => setFormData({ ...formData, dailyBudget: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData({ ...formData, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData({ ...formData, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Campaign Type Specific Info */}
          {formData.type && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Configuration</CardTitle>
                <CardDescription>
                  {formData.type === 'dpa' && 'This campaign will automatically show products from your catalog to users based on their browsing behavior.'}
                  {formData.type === 'retargeting' && 'This campaign will target users who have previously visited your store but haven\'t made a purchase.'}
                  {formData.type === 'custom' && 'You can customize targeting, creative, and other settings after creating the campaign.'}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}