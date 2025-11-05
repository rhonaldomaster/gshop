'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Package, Eye, CheckCircle2, X, MapPin } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  shippingCarrier?: string
  courierService?: string
  trackingNumber?: string
  shippingCost?: number
  customerDocument?: {
    type: string
    number: string
  }
  returnReason?: string
  createdAt: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  items: Array<{
    quantity: number
    price: number
    product: {
      name: string
      image?: string
    }
  }>
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  in_transit: 'bg-orange-100 text-orange-800',
  shipped: 'bg-green-100 text-green-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  return_requested: 'bg-amber-100 text-amber-800',
  refunded: 'bg-gray-100 text-gray-800',
}

export default function OrdersPage() {
  const t = useTranslations('orders')
  const tCommon = useTranslations('common')
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [returnNotes, setReturnNotes] = useState('')
  const [isAddTrackingOpen, setIsAddTrackingOpen] = useState(false)
  const [trackingData, setTrackingData] = useState({
    trackingUrl: '',
    trackingNumber: '',
    carrier: '',
    notes: ''
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'GS-001',
          status: 'confirmed',
          totalAmount: 150000,
          createdAt: new Date().toISOString(),
          user: {
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@example.com'
          },
          items: [
            {
              quantity: 2,
              price: 75000,
              product: {
                name: 'Smartphone Samsung'
              }
            }
          ]
        },
        {
          id: '2',
          orderNumber: 'GS-002',
          status: 'in_transit',
          totalAmount: 85000,
          shippingCarrier: 'Servientrega',
          courierService: 'Standard',
          trackingNumber: 'SERV123456789',
          shippingCost: 8500,
          createdAt: new Date().toISOString(),
          user: {
            firstName: 'María',
            lastName: 'González',
            email: 'maria@example.com'
          },
          items: [
            {
              quantity: 1,
              price: 85000,
              product: {
                name: 'Auriculares Bluetooth'
              }
            }
          ]
        },
        {
          id: '3',
          orderNumber: 'GS-003',
          status: 'return_requested',
          totalAmount: 120000,
          returnReason: 'Producto defectuoso: La pantalla llegó rayada',
          shippingCarrier: 'Coordinadora',
          trackingNumber: 'COORD987654321',
          createdAt: new Date().toISOString(),
          user: {
            firstName: 'Carlos',
            lastName: 'Rodríguez',
            email: 'carlos@example.com'
          },
          items: [
            {
              quantity: 1,
              price: 120000,
              product: {
                name: 'Tablet Android 10 pulgadas'
              }
            }
          ]
        }
      ]
      setOrders(mockOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturnDecision = async (orderId: string, approved: boolean) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/process-return`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved,
          sellerNotes: returnNotes
        })
      })

      if (response.ok) {
        await fetchOrders()
        setSelectedOrder(null)
        setReturnNotes('')
      }
    } catch (error) {
      console.error('Error processing return:', error)
    }
  }

  const handleAddTracking = async (orderId: string) => {
    if (!trackingData.trackingUrl || !trackingData.trackingNumber || !trackingData.carrier) {
      toast.error(t('fillRequiredFields'))
      return
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/tracking`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({
            shippingTrackingUrl: trackingData.trackingUrl,
            shippingTrackingNumber: trackingData.trackingNumber,
            shippingCarrier: trackingData.carrier,
            shippingNotes: trackingData.notes || undefined,
          })
        }
      )

      if (response.ok) {
        toast.success(t('successTracking'))
        await fetchOrders()
        setIsAddTrackingOpen(false)
        setSelectedOrder(null)
        setTrackingData({
          trackingUrl: '',
          trackingNumber: '',
          carrier: '',
          notes: ''
        })
      } else {
        const error = await response.json()
        toast.error(error.message || t('errorAddTracking'))
      }
    } catch (error) {
      console.error('Error adding tracking:', error)
      toast.error(t('errorAddTracking'))
    }
  }

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.accessToken}`,
          },
          body: JSON.stringify({
            status: 'delivered'
          })
        }
      )

      if (response.ok) {
        toast.success(t('orderDelivered'))
        await fetchOrders()
      } else {
        const error = await response.json()
        toast.error(error.message || t('errorAddTracking'))
      }
    } catch (error) {
      console.error('Error marking as delivered:', error)
      toast.error(t('errorAddTracking'))
    }
  }

  if (loading) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="text-sm text-gray-500">
          {orders.length} pedidos en total
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pedidos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('orderNumber')}</TableHead>
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('total')}</TableHead>
                <TableHead>{t('shipping')}</TableHead>
                <TableHead>{t('tracking')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {order.user.firstName} {order.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{order.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                      {order.status === 'in_transit' ? t('inTransit') :
                       order.status === 'confirmed' ? t('confirmed') :
                       order.status === 'return_requested' ? t('returnRequested') :
                       order.status === 'delivered' ? t('delivered') :
                       order.status === 'shipped' ? t('shipped') :
                       order.status === 'cancelled' ? t('cancelled') :
                       order.status === 'refunded' ? t('refunded') :
                       order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${order.totalAmount.toLocaleString('es-CO')}</TableCell>
                  <TableCell>
                    {order.shippingCarrier ? (
                      <div className="text-sm">
                        <div className="font-medium">{order.shippingCarrier}</div>
                        <div className="text-gray-500">{order.courierService}</div>
                        {order.shippingCost && (
                          <div className="text-green-600">
                            ${order.shippingCost.toLocaleString('es-CO')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.trackingNumber ? (
                      <div className="text-sm">
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {order.trackingNumber}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No disponible</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{t('orderDetails')} {order.orderNumber}</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">{t('customer')}</h4>
                                  <p className="text-sm text-gray-600">
                                    {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">{selectedOrder.user.email}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium">{t('status')}</h4>
                                  <Badge className={statusColors[selectedOrder.status]}>
                                    {selectedOrder.status}
                                  </Badge>
                                </div>
                              </div>

                              {selectedOrder.returnReason && (
                                <div>
                                  <h4 className="font-medium text-red-600">{t('returnReason')}</h4>
                                  <p className="text-sm bg-red-50 p-3 rounded border border-red-200">
                                    {selectedOrder.returnReason}
                                  </p>
                                </div>
                              )}

                              <div>
                                <h4 className="font-medium">{t('products')}</h4>
                                <div className="space-y-2">
                                  {selectedOrder.items.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                      <span>{item.product.name} x {item.quantity}</span>
                                      <span>${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {selectedOrder.status === 'return_requested' && (
                                <div className="space-y-4 border-t pt-4">
                                  <h4 className="font-medium">{t('processReturn')}</h4>
                                  <Textarea
                                    placeholder={t('notesPlaceholder')}
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleReturnDecision(selectedOrder.id, false)}
                                      className="flex items-center gap-2"
                                    >
                                      <X className="h-4 w-4" />
                                      {t('rejectReturn')}
                                    </Button>
                                    <Button
                                      variant="default"
                                      onClick={() => handleReturnDecision(selectedOrder.id, true)}
                                      className="flex items-center gap-2"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                      {t('approveReturn')}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {(order.status === 'confirmed' || order.status === 'processing') && !order.trackingNumber && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsAddTrackingOpen(true)
                          }}
                          className="flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4" />
                          {t('addTracking')}
                        </Button>
                      )}

                      {(order.status === 'in_transit' || order.status === 'shipped') && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleMarkAsDelivered(order.id)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {t('markAsDelivered')}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Tracking Dialog */}
      <Dialog open={isAddTrackingOpen} onOpenChange={setIsAddTrackingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addTracking')}</DialogTitle>
            <DialogDescription>
              Completa la información de rastreo para el pedido {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trackingUrl">{t('trackingUrl')} *</Label>
              <Input
                id="trackingUrl"
                type="url"
                value={trackingData.trackingUrl}
                onChange={(e) => setTrackingData({ ...trackingData, trackingUrl: e.target.value })}
                placeholder={t('trackingUrlPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">{t('guideNumber')} *</Label>
              <Input
                id="trackingNumber"
                value={trackingData.trackingNumber}
                onChange={(e) => setTrackingData({ ...trackingData, trackingNumber: e.target.value })}
                placeholder={t('guideNumberPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier">{t('courierCompany')} *</Label>
              <Input
                id="carrier"
                value={trackingData.carrier}
                onChange={(e) => setTrackingData({ ...trackingData, carrier: e.target.value })}
                placeholder={t('courierPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notesOptional')}</Label>
              <Textarea
                id="notes"
                value={trackingData.notes}
                onChange={(e) => setTrackingData({ ...trackingData, notes: e.target.value })}
                placeholder={t('notesPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddTrackingOpen(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={() => selectedOrder && handleAddTracking(selectedOrder.id)}
            >
              {t('saveTracking')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  )
}