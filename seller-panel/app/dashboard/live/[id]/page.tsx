'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Play,
  Square,
  Eye,
  Users,
  MessageCircle,
  DollarSign,
  Plus,
  Trash2,
  Package,
  Copy,
  Settings,
  TrendingUp,
  Activity,
  ArrowLeft,
  Edit,
  Check,
  ExternalLink,
  Video,
  ShoppingCart,
  Wifi,
  WifiOff
} from 'lucide-react'

interface LiveStream {
  id: string
  title: string
  description: string
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
  viewerCount: number
  peakViewers: number
  totalSales: number
  streamKey: string
  rtmpUrl: string
  hlsUrl: string
  products: LiveStreamProduct[]
  messages: LiveStreamMessage[]
  startedAt?: string
  endedAt?: string
  createdAt: string
}

interface LiveStreamProduct {
  id: string
  productId: string
  specialPrice?: number
  orderCount: number
  revenue: number
  isActive: boolean
  isHighlighted?: boolean
  position?: number
  product: {
    id: string
    name: string
    price: number
    images: string[]
    quantity: number
  }
}

interface LiveStreamMessage {
  id: string
  username: string
  message: string
  sentAt: string
}

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  quantity: number
}

interface PurchaseEvent {
  id: string
  productId: string
  productName: string
  buyerName: string
  quantity: number
  purchaseCount: number
  timestamp: string
}

export default function LiveStreamDetailPage() {
  const t = useTranslations('live')
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [stream, setStream] = useState<LiveStream | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showOBSInstructions, setShowOBSInstructions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showChatModeration, setShowChatModeration] = useState(false)
  const [purchaseLog, setPurchaseLog] = useState<PurchaseEvent[]>([])
  const [socketConnected, setSocketConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (id && session?.accessToken) {
      fetchStream()
      fetchProducts()
    }
  }, [id, session])

  // Auto-refresh stream when live (slower when WebSocket is connected)
  useEffect(() => {
    if (stream?.status === 'live') {
      const interval = setInterval(() => {
        fetchStream()
      }, socketConnected ? 60000 : 30000)

      return () => clearInterval(interval)
    }
  }, [stream?.status, id, socketConnected])

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (stream?.status !== 'live' || !session?.accessToken || !id) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
    const wsBaseUrl = apiUrl.replace(/\/api\/v1\/?$/, '')

    const socket = io(`${wsBaseUrl}/live`, {
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setSocketConnected(true)
      socket.emit('hostJoinStream', {
        streamId: id,
        hostId: (session as any).seller?.id || session.user?.id,
      })
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    socket.on('newPurchase', (data: {
      productId: string
      productName: string
      quantity: number
      buyerName: string
      timestamp: string
      purchaseCount: number
    }) => {
      const event: PurchaseEvent = {
        id: `${data.productId}-${Date.now()}-${Math.random()}`,
        ...data,
      }
      setPurchaseLog(prev => [event, ...prev].slice(0, 50))

      setStream(prev => {
        if (!prev) return prev
        const matchedProduct = prev.products.find(p => p.productId === data.productId)
        const price = matchedProduct
          ? (matchedProduct.specialPrice || matchedProduct.product.price)
          : 0
        const updatedProducts = prev.products.map(p => {
          if (p.productId === data.productId) {
            return {
              ...p,
              orderCount: p.orderCount + data.quantity,
              revenue: p.revenue + (price * data.quantity),
            }
          }
          return p
        })
        return {
          ...prev,
          products: updatedProducts,
          totalSales: prev.totalSales + (price * data.quantity),
        }
      })
    })

    socket.on('viewerCountUpdate', (data: { count: number }) => {
      setStream(prev => prev ? { ...prev, viewerCount: data.count } : prev)
    })

    socket.on('newMessage', (msg: LiveStreamMessage) => {
      setStream(prev => {
        if (!prev) return prev
        return {
          ...prev,
          messages: [...(prev.messages || []), msg],
        }
      })
    })

    return () => {
      socket.emit('leaveStream', { streamId: id })
      socket.disconnect()
      socketRef.current = null
      setSocketConnected(false)
    }
  }, [stream?.status, id, session?.accessToken])

  const fetchStream = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/live/streams/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStream(data)
      } else if (response.status === 404) {
        router.push('/dashboard/live')
      }
    } catch (error) {
      console.error('Error fetching stream:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/seller`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const startStream = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/live/streams/${id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (response.ok) {
        fetchStream()
      }
    } catch (error) {
      console.error('Error starting stream:', error)
    }
  }

  const endStream = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/live/streams/${id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (response.ok) {
        fetchStream()
      }
    } catch (error) {
      console.error('Error ending stream:', error)
    }
  }

  const addProductToStream = async (productId: string, specialPrice?: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/live/streams/${id}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          productId,
          specialPrice,
          isActive: true
        })
      })
      if (response.ok) {
        fetchStream()
        setShowAddProduct(false)
      }
    } catch (error) {
      console.error('Error adding product to stream:', error)
    }
  }

  const removeProductFromStream = async (productId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/live/streams/${id}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (response.ok) {
        fetchStream()
      }
    } catch (error) {
      console.error('Error removing product from stream:', error)
    }
  }

  const toggleProductHighlight = async (productId: string, isHighlighted: boolean) => {
    try {
      const endpoint = isHighlighted ? 'hide' : 'highlight'
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/live/streams/${id}/products/${productId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (response.ok) {
        fetchStream()
      }
    } catch (error) {
      console.error(`Error ${endpoint}ing product:`, error)
    }
  }

  const copyStreamUrl = () => {
    const streamUrl = `${window.location.origin}/watch/${id}`
    navigator.clipboard.writeText(streamUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyStreamKey = () => {
    if (stream?.streamKey) {
      navigator.clipboard.writeText(stream.streamKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!stream) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t('streamNotFound')}</h3>
          <button
            onClick={() => router.push('/dashboard/live')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            {t('back')}
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/live')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t('back')}</span>
        </button>
      {/* Stream Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              stream.status === 'live' ? 'bg-red-500 animate-pulse' :
              stream.status === 'scheduled' ? 'bg-yellow-500' :
              'bg-gray-500'
            }`}></div>
            <h1 className="text-2xl font-bold text-gray-900">{stream.title}</h1>
            <span className={`px-2 py-1 text-xs rounded-full ${
              stream.status === 'live' ? 'bg-red-100 text-red-800' :
              stream.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {stream.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={copyStreamUrl}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span>{copied ? t('copiedBtn') : t('share')}</span>
            </button>

            {stream.status === 'scheduled' && (
              <button
                onClick={startStream}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Play className="h-4 w-4" />
                <span>{t('goLiveBtn')}</span>
              </button>
            )}

            {stream.status === 'live' && (
              <button
                onClick={endStream}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Square className="h-4 w-4" />
                <span>{t('endStream')}</span>
              </button>
            )}
          </div>
        </div>

        {stream.description && (
          <p className="text-gray-600 mb-4">{stream.description}</p>
        )}

        {/* Stream Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600">{t('currentViewers')}</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stream.viewerCount}
                  {stream.status === 'live' && (
                    <span className={`inline-block w-2 h-2 rounded-full ml-2 ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">{t('peakViewersLabel')}</p>
                <p className="text-2xl font-bold text-green-900">{stream.peakViewers}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600">{t('totalSalesLabel')}</p>
                <p className="text-2xl font-bold text-yellow-900">${stream.totalSales}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">{t('productsCount')}</p>
                <p className="text-2xl font-bold text-purple-900">{stream.products?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Configuration */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{t('streamConfigTitle')}</h3>
            <button
              onClick={() => setShowOBSInstructions(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              <Settings className="h-4 w-4" />
              <span>{t('setupOBS')}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('rtmpUrlLabel')}</label>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="text"
                  value={stream.rtmpUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(stream.rtmpUrl)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('streamKeyLabel')}</label>
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="password"
                  value={stream.streamKey}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                />
                <button
                  onClick={copyStreamKey}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Activity Feed - Only shown during live streams */}
      {stream.status === 'live' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('purchaseActivity')}</h3>
              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full animate-pulse">
                {t('liveLabel')}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                {socketConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${socketConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {socketConnected ? t('connected') : t('disconnected')}
                </span>
              </div>
              <span className="px-2 py-1 text-sm font-medium bg-green-50 text-green-700 rounded-full">
                {purchaseLog.length} {t('totalPurchases')}
              </span>
            </div>
          </div>

          <div className="p-6">
            {purchaseLog.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {purchaseLog.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg p-3 animate-fade-in"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 rounded-full p-2">
                        <ShoppingCart className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {purchase.buyerName} - {purchase.quantity}x {purchase.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(purchase.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      #{purchase.purchaseCount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">{t('noPurchasesYet')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('purchasesWillAppear')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('streamProducts')}</h3>
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addProduct')}</span>
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {stream.products?.map((streamProduct) => (
            <div key={streamProduct.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={streamProduct.product.images?.[0] || '/placeholder.jpg'}
                      alt={streamProduct.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    {streamProduct.isHighlighted && (
                      <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{streamProduct.product.name}</h4>
                      {streamProduct.isHighlighted && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          {t('featured')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>{t('regularLabel')} ${streamProduct.product.price}</span>
                      {streamProduct.specialPrice && (
                        <span className="text-red-600 font-medium">
                          {t('livePriceLabel')} ${streamProduct.specialPrice}
                        </span>
                      )}
                      <span>{t('stockLabelShort')} {streamProduct.product.quantity}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{t('ordersLabel')}</p>
                    <p className="font-bold text-lg">{streamProduct.orderCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{t('revenueLabel')}</p>
                    <p className="font-bold text-lg">${streamProduct.revenue}</p>
                  </div>

                  {/* Live Controls - Show only when stream is live */}
                  {stream.status === 'live' && (
                    <div className="flex items-center space-x-2 border-l pl-4">
                      <button
                        onClick={() => toggleProductHighlight(streamProduct.productId, streamProduct.isHighlighted || false)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                          streamProduct.isHighlighted
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                        title={streamProduct.isHighlighted ? t('hideFromOverlay') : t('showInOverlay')}
                      >
                        {streamProduct.isHighlighted ? (
                          <span className="flex items-center space-x-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            <span>{t('hideBtn')}</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{t('showBtn')}</span>
                          </span>
                        )}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => removeProductFromStream(streamProduct.productId)}
                    className="p-2 text-red-400 hover:text-red-600"
                    title={t('removeFromStream')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {(!stream.products || stream.products.length === 0) && (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noProducts')}</h3>
              <p className="text-gray-600 mb-4">{t('noProductsDesc')}</p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {t('addProduct')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Moderation Section */}
      {stream.status === 'live' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">{t('chatModeration')}</h3>
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                {t('liveLabel')}
              </span>
            </div>
            <button
              onClick={() => setShowChatModeration(!showChatModeration)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className={`h-5 w-5 transform ${showChatModeration ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {showChatModeration && (
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{t('moderationActions')}</strong>
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• {t('moderationDelete')}</li>
                  <li>• {t('moderationTimeout')}</li>
                  <li>• {t('moderationBan')}</li>
                </ul>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stream.messages && stream.messages.length > 0 ? (
                  stream.messages.slice(-20).reverse().map((msg) => (
                    <div key={msg.id} className="flex items-start justify-between bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">{msg.username}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(msg.sentAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{msg.message}</p>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={async () => {
                            if (confirm(t('deleteMessageConfirm'))) {
                              try {
                                await fetch(`/api/live/streams/${id}/messages/${msg.id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${session?.accessToken}`
                                  }
                                })
                                fetchStream()
                              } catch (error) {
                                console.error('Error deleting message:', error)
                              }
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title={t('deleteMessageTitle')}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>

                        <button
                          onClick={async () => {
                            if (confirm(t('timeoutUserConfirm', { username: msg.username }))) {
                              try {
                                await fetch(`/api/live/streams/${id}/timeout`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session?.accessToken}`
                                  },
                                  body: JSON.stringify({
                                    username: msg.username,
                                    duration: 300 // 5 minutes in seconds
                                  })
                                })
                                alert(t('userTimedOut', { username: msg.username }))
                              } catch (error) {
                                console.error('Error timing out user:', error)
                              }
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                          title={t('timeoutTitle')}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        <button
                          onClick={async () => {
                            const reason = prompt(t('banUserPrompt', { username: msg.username }))
                            if (reason) {
                              try {
                                await fetch(`/api/live/streams/${id}/ban`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session?.accessToken}`
                                  },
                                  body: JSON.stringify({
                                    username: msg.username,
                                    reason
                                  })
                                })
                                alert(t('userBanned', { username: msg.username }))
                                fetchStream()
                              } catch (error) {
                                console.error('Error banning user:', error)
                              }
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title={t('banUserTitle')}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">{t('noChatMessages')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('chatMessagesWillAppear')}</p>
                  </div>
                )}
              </div>

              {stream.messages && stream.messages.length > 20 && (
                <p className="text-xs text-gray-500 text-center mt-4">
                  {t('showingLastMessages')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* OBS Setup Instructions Modal */}
      {showOBSInstructions && stream && (
        <OBSInstructionsModal
          rtmpUrl={stream.rtmpUrl}
          streamKey={stream.streamKey}
          onClose={() => setShowOBSInstructions(false)}
        />
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProductModal
          products={products}
          streamProducts={stream.products || []}
          onClose={() => setShowAddProduct(false)}
          onAdd={addProductToStream}
        />
      )}
      </div>
    </DashboardLayout>
  )
}

// OBS Setup Instructions Modal Component
function OBSInstructionsModal({
  rtmpUrl,
  streamKey,
  onClose
}: {
  rtmpUrl: string
  streamKey: string
  onClose: () => void
}) {
  const t = useTranslations('live')
  const [copied, setCopied] = useState<'url' | 'key' | null>(null)

  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">{t('obsGuideTitle')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-semibold text-lg text-gray-900 mb-2">
              {t('obsStep1Title')}
            </h4>
            <p className="text-gray-600 mb-2" dangerouslySetInnerHTML={{ __html: t.raw('obsStep1Desc') }} />
            <a
              href="https://obsproject.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
            >
              <span>{t('downloadOBS')}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Step 2 */}
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-semibold text-lg text-gray-900 mb-2">
              {t('obsStep2Title')}
            </h4>
            <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: t.raw('obsStep2Desc') }} />
          </div>

          {/* Step 3 */}
          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-semibold text-lg text-gray-900 mb-2">
              {t('obsStep3Title')}
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">{t('serviceLabel')}</p>
                <div className="bg-gray-50 px-3 py-2 rounded-md border border-gray-300">
                  <code className="text-sm">{t('customService')}</code>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">{t('serverLabel')}</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-50 px-3 py-2 rounded-md border border-gray-300">
                    <code className="text-sm break-all">{rtmpUrl}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(rtmpUrl, 'url')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copied === 'url' ? t('copiedBtn') : t('copyBtn')}</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">{t('streamKeyLabel')}</p>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-50 px-3 py-2 rounded-md border border-gray-300">
                    <code className="text-sm break-all">{streamKey}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(streamKey, 'key')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copied === 'key' ? t('copiedBtn') : t('copyBtn')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-semibold text-lg text-gray-900 mb-2">
              {t('obsStep4Title')}
            </h4>
            <p className="text-gray-600 mb-2" dangerouslySetInnerHTML={{ __html: t.raw('obsStep4Output') }} />
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li dangerouslySetInnerHTML={{ __html: t.raw('videoBitrate') }} />
              <li dangerouslySetInnerHTML={{ __html: t.raw('encoder') }} />
              <li dangerouslySetInnerHTML={{ __html: t.raw('keyframeInterval') }} />
            </ul>
            <p className="text-gray-600 mt-2" dangerouslySetInnerHTML={{ __html: t.raw('obsStep4Video') }} />
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li dangerouslySetInnerHTML={{ __html: t.raw('outputResolution') }} />
              <li dangerouslySetInnerHTML={{ __html: t.raw('fps') }} />
            </ul>
          </div>

          {/* Step 5 */}
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-semibold text-lg text-gray-900 mb-2">
              {t('obsStep5Title')}
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li dangerouslySetInnerHTML={{ __html: t.raw('obsStep5Item1') }} />
              <li dangerouslySetInnerHTML={{ __html: t.raw('obsStep5Item2') }} />
              <li dangerouslySetInnerHTML={{ __html: t.raw('obsStep5Item3') }} />
              <li dangerouslySetInnerHTML={{ __html: t.raw('obsStep5Item4') }} />
              <li dangerouslySetInnerHTML={{ __html: t.raw('obsStep5Item5') }} />
              <li dangerouslySetInnerHTML={{ __html: t.raw('obsStep5Item6') }} />
            </ol>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h5 className="font-semibold text-yellow-800 mb-1">{t('importantNotesTitle')}</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• {t('importantNote1')}</li>
                  <li>• {t('importantNote2')}</li>
                  <li>• {t('importantNote3')}</li>
                  <li>• {t('importantNote4')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('gotIt')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add Product Modal Component
function AddProductModal({
  products,
  streamProducts,
  onClose,
  onAdd
}: {
  products: Product[]
  streamProducts: LiveStreamProduct[]
  onClose: () => void
  onAdd: (productId: string, specialPrice?: number) => void
}) {
  const t = useTranslations('live')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [specialPrice, setSpecialPrice] = useState<string>('')

  const streamProductIds = streamProducts.map(sp => sp.productId)
  const availableProducts = products.filter(p => !streamProductIds.includes(p.id))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedProduct) {
      onAdd(selectedProduct, specialPrice ? parseFloat(specialPrice) : undefined)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('addProductToStream')}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('selectProduct')}
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t('chooseProduct')}</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('specialLivePrice')}
            </label>
            <input
              type="number"
              step="0.01"
              value={specialPrice}
              onChange={(e) => setSpecialPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('specialPricePlaceholder')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!selectedProduct}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {t('addProduct')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}