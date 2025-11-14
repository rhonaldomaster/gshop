'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { useToast } from '@/components/ui/use-toast'

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateCampaignDialog({ open, onOpenChange, onSuccess }: CreateCampaignDialogProps) {
  const t = useTranslations('ads')
  const { toast } = useToast()
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required'
    }

    if (!formData.type) {
      newErrors.type = 'Campaign type is required'
    }

    const budget = parseFloat(formData.budget)
    if (!formData.budget || isNaN(budget) || budget <= 0) {
      newErrors.budget = 'Budget must be greater than 0'
    }

    const dailyBudget = parseFloat(formData.dailyBudget)
    if (!formData.dailyBudget || isNaN(dailyBudget) || dailyBudget <= 0) {
      newErrors.dailyBudget = 'Daily budget must be greater than 0'
    }

    if (budget > 0 && dailyBudget > 0 && dailyBudget > budget) {
      newErrors.dailyBudget = 'Daily budget cannot exceed total budget'
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        variant: 'destructive',
      })
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
        toast({
          title: 'Success',
          description: 'Campaign created successfully!',
        })
        onSuccess()
        resetForm()
      } else {
        const errorData = await response.json().catch(() => null)
        toast({
          title: 'Error',
          description: errorData?.message || 'Failed to create campaign. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: 'Error',
        description: 'Failed to create campaign. Please check your connection.',
        variant: 'destructive',
      })
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
    setErrors({})
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
      label: t('dpaLabel'),
      description: t('dpaSubtitle'),
      recommended: true,
    },
    {
      value: 'retargeting',
      label: t('retargetingLabel'),
      description: t('retargetingSubtitle'),
      recommended: false,
    },
    {
      value: 'custom',
      label: t('customLabel'),
      description: t('customSubtitle'),
      recommended: false,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('createNewCampaign')}</DialogTitle>
          <DialogDescription>
            {t('setupCampaign')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Type Selection */}
          <div className="space-y-4">
            <Label>{t('campaignType')}</Label>
            {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
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
                        <Badge variant="secondary">{t('recommended')}</Badge>
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
              <Label htmlFor="name">{t('campaignTypeRequired')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('enterCampaignName')}
                required
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">{t('totalBudget')}</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="1"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
                required
                className={errors.budget ? 'border-red-500' : ''}
              />
              {errors.budget && <p className="text-sm text-red-500">{errors.budget}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('describeGoals')}
              rows={3}
            />
          </div>

          {/* Budget and Scheduling */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dailyBudget">{t('dailyBudget')}</Label>
              <Input
                id="dailyBudget"
                type="number"
                step="0.01"
                min="1"
                value={formData.dailyBudget}
                onChange={(e) => setFormData({ ...formData, dailyBudget: e.target.value })}
                placeholder="0.00"
                required
                className={errors.dailyBudget ? 'border-red-500' : ''}
              />
              {errors.dailyBudget && <p className="text-sm text-red-500">{errors.dailyBudget}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('startDateLabel')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, 'PPP') : t('pickDate')}
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
              <Label>{t('endDateLabel')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, 'PPP') : t('pickDate')}
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
                <CardTitle className="text-base">{t('campaignConfiguration')}</CardTitle>
                <CardDescription>
                  {formData.type === 'dpa' && t('dpaDescription')}
                  {formData.type === 'retargeting' && t('retargetingDescription')}
                  {formData.type === 'custom' && t('customDescription')}
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
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('creating') : t('createCampaignButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}