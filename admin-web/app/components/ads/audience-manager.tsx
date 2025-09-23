'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Users, RefreshCw, Edit, Trash } from 'lucide-react'

interface Audience {
  id: string
  name: string
  type: 'pixel_based' | 'customer_list' | 'lookalike' | 'custom'
  description: string
  size: number
  isActive: boolean
  rules: any
  createdAt: string
}

export function AudienceManager() {
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    rules: {},
  })

  useEffect(() => {
    fetchAudiences()
  }, [])

  const fetchAudiences = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/audiences')
      if (response.ok) {
        const data = await response.json()
        setAudiences(data)
      }
    } catch (error) {
      console.error('Failed to fetch audiences:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAudience = async () => {
    try {
      const response = await fetch('/api/audiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setFormData({ name: '', type: '', description: '', rules: {} })
        fetchAudiences()
      }
    } catch (error) {
      console.error('Failed to create audience:', error)
    }
  }

  const rebuildAudience = async (audienceId: string) => {
    try {
      const response = await fetch(`/api/audiences/${audienceId}/rebuild`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchAudiences()
      }
    } catch (error) {
      console.error('Failed to rebuild audience:', error)
    }
  }

  const deleteAudience = async (audienceId: string) => {
    if (!confirm('Are you sure you want to delete this audience?')) {
      return
    }

    try {
      const response = await fetch(`/api/audiences/${audienceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAudiences()
      }
    } catch (error) {
      console.error('Failed to delete audience:', error)
    }
  }

  const getTypeBadge = (type: string) => {
    const labels = {
      pixel_based: 'Pixel Based',
      customer_list: 'Customer List',
      lookalike: 'Lookalike',
      custom: 'Custom',
    }

    const variants = {
      pixel_based: 'default',
      customer_list: 'secondary',
      lookalike: 'outline',
      custom: 'secondary',
    } as const

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'secondary'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    )
  }

  const renderRulesForm = () => {
    switch (formData.type) {
      case 'pixel_based':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Events to Track</Label>
              <div className="space-y-2">
                {['page_view', 'product_view', 'add_to_cart', 'purchase'].map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={formData.rules.events?.includes(event)}
                      onCheckedChange={(checked) => {
                        const events = formData.rules.events || []
                        const newEvents = checked
                          ? [...events, event]
                          : events.filter((e: string) => e !== event)
                        setFormData({
                          ...formData,
                          rules: { ...formData.rules, events: newEvents }
                        })
                      }}
                    />
                    <Label htmlFor={event} className="capitalize">
                      {event.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe (days)</Label>
              <Input
                id="timeframe"
                type="number"
                min="1"
                max="365"
                value={formData.rules.timeframe || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  rules: { ...formData.rules, timeframe: parseInt(e.target.value) }
                })}
                placeholder="30"
              />
            </div>
          </div>
        )

      case 'customer_list':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userIds">User IDs (one per line)</Label>
              <Textarea
                id="userIds"
                value={formData.rules.userIds?.join('\n') || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  rules: {
                    ...formData.rules,
                    userIds: e.target.value.split('\n').filter(Boolean)
                  }
                })}
                placeholder="user-123&#10;user-456&#10;user-789"
                rows={6}
              />
            </div>
          </div>
        )

      case 'lookalike':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceAudience">Source Audience</Label>
              <Select
                value={formData.rules.sourceAudienceId || ''}
                onValueChange={(value) => setFormData({
                  ...formData,
                  rules: { ...formData.rules, sourceAudienceId: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source audience" />
                </SelectTrigger>
                <SelectContent>
                  {audiences.map((audience) => (
                    <SelectItem key={audience.id} value={audience.id}>
                      {audience.name} ({audience.size} users)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="similarity">Similarity (0.1 = 10%)</Label>
              <Input
                id="similarity"
                type="number"
                step="0.1"
                min="0.1"
                max="1"
                value={formData.rules.similarity || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  rules: { ...formData.rules, similarity: parseFloat(e.target.value) }
                })}
                placeholder="0.1"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading audiences...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Audiences</h3>
          <p className="text-sm text-muted-foreground">
            Create targeted audiences based on user behavior and customer data
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Audience
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Custom Audience</DialogTitle>
              <DialogDescription>
                Define rules to automatically include users in this audience
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Audience Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter audience name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Audience Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value, rules: {} })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pixel_based">Pixel Based</SelectItem>
                    <SelectItem value="customer_list">Customer List</SelectItem>
                    <SelectItem value="lookalike">Lookalike</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this audience"
                  rows={2}
                />
              </div>

              {formData.type && renderRulesForm()}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createAudience} disabled={!formData.name || !formData.type}>
                Create Audience
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {audiences.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No audiences yet</h3>
            <p className="text-muted-foreground mt-2">
              Create custom audiences to target specific user segments with your campaigns.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audience</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audiences.map((audience) => (
                <TableRow key={audience.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{audience.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {audience.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(audience.type)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{audience.size.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">users</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={audience.isActive ? 'default' : 'secondary'}>
                      {audience.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(audience.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rebuildAudience(audience.id)}
                        title="Rebuild audience"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAudience(audience.id)}
                        title="Delete audience"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}