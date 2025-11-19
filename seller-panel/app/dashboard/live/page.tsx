'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import {
  Play,
  Square,
  Eye,
  Users,
  MessageCircle,
  DollarSign,
  Video,
  Plus,
  Settings,
  Share2
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
  products: any[]
  scheduledAt?: string
  startedAt?: string
  endedAt?: string
  createdAt: string
}

export default function LivePage() {
  const t = useTranslations('live')
  const { data: session } = useSession()
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchStreams()
  }, [])

  // Helper function to calculate time remaining
  const getCountdown = (scheduledAt: string) => {
    const now = new Date().getTime()
    const scheduledTime = new Date(scheduledAt).getTime()
    const diff = scheduledTime - now

    if (diff <= 0) return 'Starting soon...'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `In ${days} day${days > 1 ? 's' : ''}`
    }
    if (hours > 0) {
      return `In ${hours}h ${minutes}m`
    }
    return `In ${minutes} min`
  }

  const fetchStreams = async () => {
    try {
      const response = await fetch('/api/live/streams', {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStreams(data)
        const live = data.find((s: LiveStream) => s.status === 'live')
        if (live) setActiveStream(live)
      }
    } catch (error) {
      console.error('Error fetching streams:', error)
    } finally {
      setLoading(false)
    }
  }

  const startStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/live/streams/${streamId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (response.ok) {
        fetchStreams()
      }
    } catch (error) {
      console.error('Error starting stream:', error)
    }
  }

  const endStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/live/streams/${streamId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })
      if (response.ok) {
        fetchStreams()
        setActiveStream(null)
      }
    } catch (error) {
      console.error('Error ending stream:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-600">{t('manageStreams')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>{t('createStream')}</span>
        </button>
      </div>

      {/* Active Stream Card */}
      {activeStream && (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold">{t('liveIndicator')}</span>
              <h3 className="text-xl font-bold">{activeStream.title}</h3>
            </div>
            <button
              onClick={() => endStream(activeStream.id)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Square className="h-4 w-4" />
              <span>{t('endStream')}</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-80">{t('viewers')}</p>
                <p className="font-bold">{activeStream.viewerCount}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-80">{t('peak')}</p>
                <p className="font-bold">{activeStream.peakViewers}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-80">{t('sales')}</p>
                <p className="font-bold">${activeStream.totalSales}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-80">{t('productsLabel')}</p>
                <p className="font-bold">{activeStream.products?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streams List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t('recentStreams')}</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {streams.map((stream) => (
            <div key={stream.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      stream.status === 'live' ? 'bg-red-500' :
                      stream.status === 'scheduled' ? 'bg-yellow-500' :
                      stream.status === 'ended' ? 'bg-gray-500' :
                      'bg-red-300'
                    }`}></div>
                    <h4 className="text-lg font-medium text-gray-900">{stream.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      stream.status === 'live' ? 'bg-red-100 text-red-800' :
                      stream.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      stream.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {stream.status.toUpperCase()}
                    </span>
                  </div>

                  {stream.description && (
                    <p className="mt-2 text-gray-600">{stream.description}</p>
                  )}

                  {stream.status === 'scheduled' && stream.scheduledAt && (
                    <div className="mt-2 inline-flex items-center px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                      <span className="text-xs font-medium text-yellow-800">
                        📅 {new Date(stream.scheduledAt).toLocaleString()} • {getCountdown(stream.scheduledAt)}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{stream.viewerCount} {t('viewersLower')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${stream.totalSales} {t('salesLower')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Video className="h-4 w-4" />
                      <span>{stream.products?.length || 0} {t('productsLower')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {stream.status === 'scheduled' && (
                    <button
                      onClick={() => startStream(stream.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center space-x-1"
                    >
                      <Play className="h-4 w-4" />
                      <span>{t('startStream')}</span>
                    </button>
                  )}

                  {stream.status === 'live' && (
                    <button
                      onClick={() => endStream(stream.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center space-x-1"
                    >
                      <Square className="h-4 w-4" />
                      <span>{t('endStreamShort')}</span>
                    </button>
                  )}

                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <Settings className="h-4 w-4" />
                  </button>

                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {streams.length === 0 && (
            <div className="p-12 text-center">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noStreams')}</h3>
              <p className="text-gray-600 mb-4">{t('createFirstStream')}</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {t('createStream')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Stream Modal */}
      {showCreateModal && (
        <CreateStreamModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchStreams()
          }}
        />
      )}
    </div>
  )
}

// Create Stream Modal Component
function CreateStreamModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const t = useTranslations('live')
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string>('')
  const [isScheduled, setIsScheduled] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First create the stream
      const streamData: any = {
        title,
        description,
        hostType: 'seller'
      }

      if (category) streamData.category = category
      if (tags) streamData.tags = tags.split(',').map(t => t.trim())
      if (isScheduled && scheduledAt) streamData.scheduledAt = new Date(scheduledAt).toISOString()

      const response = await fetch('/api/live/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(streamData)
      })

      if (response.ok) {
        const stream = await response.json()

        // Add selected products to the stream
        if (selectedProducts.length > 0) {
          await Promise.all(
            selectedProducts.map(productId =>
              fetch(`/api/live/streams/${stream.id}/products`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({
                  productId,
                  isActive: true
                })
              })
            )
          )
        }

        // TODO: Upload thumbnail if provided (requires upload endpoint)
        // This would typically upload to S3/CDN and update stream.thumbnailUrl

        onSuccess()
      }
    } catch (error) {
      console.error('Error creating stream:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('createLiveStream')}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('streamTitle')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('streamTitlePlaceholder')}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('streamDescription')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('streamDescriptionPlaceholder')}
              rows={3}
            />
          </div>

          {/* Schedule Toggle */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="schedule-toggle"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="schedule-toggle" className="text-sm font-medium text-gray-700 cursor-pointer">
              Schedule for later
            </label>
          </div>

          {/* Scheduled Date/Time */}
          {isScheduled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={isScheduled}
              />
              <p className="text-xs text-gray-500 mt-1">
                Your stream will be available to start at this time
              </p>
            </div>
          )}

          {/* Category & Tags Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                <option value="fashion">Fashion</option>
                <option value="electronics">Electronics</option>
                <option value="beauty">Beauty</option>
                <option value="home">Home & Living</option>
                <option value="food">Food & Beverage</option>
                <option value="sports">Sports</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="trending, sale, new (comma separated)"
              />
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail Image
            </label>
            <div className="flex items-center space-x-4">
              {thumbnailPreview && (
                <img
                  src={thumbnailPreview}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <label className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
                <span className="text-sm text-gray-600">
                  {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}
                </span>
              </label>
            </div>
          </div>

          {/* Products Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Products to Feature
            </label>
            <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
              {products.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">No products available</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProduct(product.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <img
                        src={product.images?.[0] || '/placeholder.jpg'}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded ml-3"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">${product.price}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedProducts.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Buttons */}
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t('creating') : t('createStream')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}