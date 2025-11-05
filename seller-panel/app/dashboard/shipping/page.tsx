'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import DashboardLayout from '@/components/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Truck, MapPin, Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface ShippingConfig {
  shippingLocalPrice: number
  shippingNationalPrice: number
  shippingFreeEnabled: boolean
  shippingFreeMinAmount?: number
  locations: Location[]
}

interface Location {
  id: string
  city: string
  state: string
  isPrimary: boolean
  address?: string
  createdAt: string
}

interface NewLocation {
  city: string
  state: string
  address?: string
  isPrimary?: boolean
}

export default function ShippingPage() {
  const t = useTranslations('shipping')
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [localPrice, setLocalPrice] = useState<string>('0')
  const [nationalPrice, setNationalPrice] = useState<string>('0')
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false)
  const [freeShippingMin, setFreeShippingMin] = useState<string>('0')

  const [newLocation, setNewLocation] = useState<NewLocation>({
    city: '',
    state: '',
    address: '',
    isPrimary: false
  })
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Fetch shipping config
  const { data: shippingConfig, isLoading } = useQuery<ShippingConfig>({
    queryKey: ['shipping-config', session?.seller?.id],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sellers/${session?.seller?.id}/shipping-config`,
        {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
          },
        }
      )
      if (!response.ok) throw new Error('Failed to fetch shipping config')
      return response.json()
    },
    enabled: !!session?.accessToken && !!session?.seller?.id,
  })

  // Set form values when data loads
  useEffect(() => {
    if (shippingConfig) {
      setLocalPrice(shippingConfig.shippingLocalPrice?.toString() || '0')
      setNationalPrice(shippingConfig.shippingNationalPrice?.toString() || '0')
      setFreeShippingEnabled(shippingConfig.shippingFreeEnabled || false)
      setFreeShippingMin(shippingConfig.shippingFreeMinAmount?.toString() || '0')
    }
  }, [shippingConfig])

  // Update shipping config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sellers/${session?.seller?.id}/shipping-config`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update shipping config')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-config'] })
      toast.success(t('success'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('error'))
    }
  })

  // Add location mutation
  const addLocationMutation = useMutation({
    mutationFn: async (location: NewLocation) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sellers/${session?.seller?.id}/locations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify(location),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add location')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-config'] })
      toast.success(t('locationAdded'))
      setIsAddLocationOpen(false)
      setNewLocation({ city: '', state: '', address: '', isPrimary: false })
    },
    onError: (error: any) => {
      toast.error(error.message || t('locationError'))
    }
  })

  // Remove location mutation
  const removeLocationMutation = useMutation({
    mutationFn: async (locationId: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/sellers/${session?.seller?.id}/locations/${locationId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
          },
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove location')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-config'] })
      toast.success(t('locationRemoved'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('locationRemoveError'))
    }
  })

  const handleSaveConfig = () => {
    updateConfigMutation.mutate({
      shippingLocalPrice: parseFloat(localPrice),
      shippingNationalPrice: parseFloat(nationalPrice),
      shippingFreeEnabled: freeShippingEnabled,
      shippingFreeMinAmount: freeShippingEnabled ? parseFloat(freeShippingMin) : null,
    })
  }

  const handleAddLocation = () => {
    if (!newLocation.city || !newLocation.state) {
      toast.error(t('cityStateRequired'))
      return
    }
    addLocationMutation.mutate(newLocation)
  }

  const handleRemoveLocation = (locationId: string) => {
    if (confirm(t('confirmRemoveLocation'))) {
      removeLocationMutation.mutate(locationId)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('description')}
          </p>
        </div>

        {/* Shipping Prices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {t('shippingPrices')}
            </CardTitle>
            <CardDescription>
              {t('shippingPricesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="localPrice">{t('localShipping')}</Label>
                <Input
                  id="localPrice"
                  type="number"
                  value={localPrice}
                  onChange={(e) => setLocalPrice(e.target.value)}
                  placeholder="5000"
                />
                <p className="text-xs text-gray-500">
                  {t('localShippingDesc')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationalPrice">{t('nationalShipping')}</Label>
                <Input
                  id="nationalPrice"
                  type="number"
                  value={nationalPrice}
                  onChange={(e) => setNationalPrice(e.target.value)}
                  placeholder="15000"
                />
                <p className="text-xs text-gray-500">
                  {t('nationalShippingDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 border-t pt-4">
              <Switch
                id="freeShipping"
                checked={freeShippingEnabled}
                onCheckedChange={setFreeShippingEnabled}
              />
              <div className="flex-1">
                <Label htmlFor="freeShipping" className="cursor-pointer">
                  {t('enableFreeShipping')}
                </Label>
                <p className="text-xs text-gray-500">
                  {t('freeShippingDesc')}
                </p>
              </div>
            </div>

            {freeShippingEnabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="freeShippingMin">{t('freeShippingMin')}</Label>
                <Input
                  id="freeShippingMin"
                  type="number"
                  value={freeShippingMin}
                  onChange={(e) => setFreeShippingMin(e.target.value)}
                  placeholder="100000"
                />
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveConfig}
                disabled={updateConfigMutation.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {updateConfigMutation.isPending ? t('saving') : t('saveConfig')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('myLocations')}
                </CardTitle>
                <CardDescription>
                  {t('myLocationsDesc')}
                </CardDescription>
              </div>
              <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('addLocation')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('newLocation')}</DialogTitle>
                    <DialogDescription>
                      {t('newLocationDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('city')} *</Label>
                      <Input
                        id="city"
                        value={newLocation.city}
                        onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                        placeholder="Bogotá"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">{t('department')} *</Label>
                      <Input
                        id="state"
                        value={newLocation.state}
                        onChange={(e) => setNewLocation({ ...newLocation, state: e.target.value })}
                        placeholder="Cundinamarca"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('address')}</Label>
                      <Input
                        id="address"
                        value={newLocation.address}
                        onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                        placeholder="Calle 72 #10-07"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddLocationOpen(false)}
                      disabled={addLocationMutation.isPending}
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      onClick={handleAddLocation}
                      disabled={addLocationMutation.isPending}
                    >
                      {addLocationMutation.isPending ? t('adding') : t('add')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {shippingConfig?.locations && shippingConfig.locations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('city')}</TableHead>
                    <TableHead>{t('department')}</TableHead>
                    <TableHead>{t('address')}</TableHead>
                    <TableHead>{t('primary')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shippingConfig.locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.city}</TableCell>
                      <TableCell>{location.state}</TableCell>
                      <TableCell>{location.address || '-'}</TableCell>
                      <TableCell>
                        {location.isPrimary && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {t('primary')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLocation(location.id)}
                          disabled={removeLocationMutation.isPending || shippingConfig.locations.length === 1}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noLocations')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t('noLocationsDesc')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
