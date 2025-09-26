'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  startedAt?: string
  endedAt?: string
  createdAt: string
}

export default function LivePage() {
  const { data: session } = useSession()
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchStreams()
  }, [])

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
          <h1 className="text-2xl font-bold text-gray-900">Live Streaming</h1>
          <p className="text-gray-600">Manage your live shopping streams</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Stream</span>
        </button>
      </div>

      {/* Active Stream Card */}
      {activeStream && (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold">LIVE</span>
              <h3 className="text-xl font-bold">{activeStream.title}</h3>
            </div>
            <button
              onClick={() => endStream(activeStream.id)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Square className="h-4 w-4" />
              <span>End Stream</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-80">Viewers</p>
                <p className="font-bold">{activeStream.viewerCount}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-80">Peak</p>
                <p className="font-bold">{activeStream.peakViewers}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-80">Sales</p>
                <p className="font-bold">${activeStream.totalSales}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <div>
                <p className="text-sm opacity-80">Products</p>
                <p className="font-bold">{activeStream.products?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streams List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Streams</h3>
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

                  <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{stream.viewerCount} viewers</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${stream.totalSales} sales</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Video className="h-4 w-4" />
                      <span>{stream.products?.length || 0} products</span>
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
                      <span>Start</span>
                    </button>
                  )}

                  {stream.status === 'live' && (
                    <button
                      onClick={() => endStream(stream.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center space-x-1"
                    >
                      <Square className="h-4 w-4" />
                      <span>End</span>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No streams yet</h3>
              <p className="text-gray-600 mb-4">Create your first live shopping stream to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Stream
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
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/live/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({
          title,
          description,
          hostType: 'seller'
        })
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating stream:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Live Stream</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stream Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter stream title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your live stream"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Stream'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}