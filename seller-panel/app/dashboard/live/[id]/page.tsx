'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
  Settings
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

export default function LiveStreamDetailPage() {
  const t = useTranslations('live')
  const { id } = useParams()
  const { data: session } = useSession()
  const [stream, setStream] = useState<LiveStream | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (id) {
      fetchStream()
      fetchProducts()
    }
  }, [id])

  const fetchStream = async () => {
    try {
      const response = await fetch(`/api/live/streams/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStream(data)
      }
    } catch (error) {
      console.error('Error fetching stream:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
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
      const response = await fetch(`/api/live/streams/${id}/start`, {
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
      const response = await fetch(`/api/live/streams/${id}/end`, {
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
      const response = await fetch(`/api/live/streams/${id}/products`, {
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
      const response = await fetch(`/api/live/streams/${id}/products/${productId}`, {
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Stream not found</h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>

            {stream.status === 'scheduled' && (
              <button
                onClick={startStream}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Play className="h-4 w-4" />
                <span>Go Live</span>
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
                <p className="text-sm text-blue-600">Current Viewers</p>
                <p className="text-2xl font-bold text-blue-900">{stream.viewerCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600">Peak Viewers</p>
                <p className="text-2xl font-bold text-green-900">{stream.peakViewers}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600">Total Sales</p>
                <p className="text-2xl font-bold text-yellow-900">${stream.totalSales}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600">Products</p>
                <p className="text-2xl font-bold text-purple-900">{stream.products?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Configuration */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Stream Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">RTMP URL</label>
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
              <label className="text-sm font-medium text-gray-700">Stream Key</label>
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
                  <img
                    src={streamProduct.product.images?.[0] || '/placeholder.jpg'}
                    alt={streamProduct.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{streamProduct.product.name}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>Regular: ${streamProduct.product.price}</span>
                      {streamProduct.specialPrice && (
                        <span className="text-red-600 font-medium">
                          Live Price: ${streamProduct.specialPrice}
                        </span>
                      )}
                      <span>Stock: {streamProduct.product.quantity}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Orders</p>
                    <p className="font-bold text-lg">{streamProduct.orderCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="font-bold text-lg">${streamProduct.revenue}</p>
                  </div>
                  <button
                    onClick={() => removeProductFromStream(streamProduct.productId)}
                    className="p-2 text-red-400 hover:text-red-600"
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