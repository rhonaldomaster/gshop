'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface LivePurchaseNotification {
  orderId: string
  streamId: string
  streamTitle: string
  productName: string
  amount: number
  buyerName: string
  timestamp: Date
}

interface StreamEndedStats {
  streamId: string
  streamTitle: string
  totalViewers: number
  peakViewers: number
  totalSales: number
  ordersCount: number
  duration: number
  endedAt: Date
}

interface DashboardStats {
  totalStreams: number
  liveStreams: number
  totalViewers: number
  totalSales: number
  avgViewTime: number
  conversionRate: number
  totalMessages: number
  engagementRate: number
}

interface UseLiveWebSocketOptions {
  onPurchase?: (purchase: LivePurchaseNotification) => void
  onStreamEnded?: (stats: StreamEndedStats) => void
  onDashboardUpdate?: (stats: DashboardStats) => void
  autoConnect?: boolean
}

export function useLiveWebSocket(options: UseLiveWebSocketOptions = {}) {
  const {
    onPurchase,
    onStreamEnded,
    onDashboardUpdate,
    autoConnect = true,
  } = options

  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return
    }

    try {
      // Get backend URL from environment or default to localhost
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000'

      // Connect to live namespace
      const socket = io(`${backendUrl}/live`, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      socket.on('connect', () => {
        console.log('Live WebSocket connected')
        setIsConnected(true)
        setError(null)

        // Subscribe to admin updates
        socket.emit('subscribeToAdminUpdates')
      })

      socket.on('disconnect', () => {
        console.log('Live WebSocket disconnected')
        setIsConnected(false)
      })

      socket.on('error', (err: any) => {
        console.error('Live WebSocket error:', err)
        setError(err.message || 'Connection error')
      })

      socket.on('subscribedToAdmin', (data: { message: string }) => {
        console.log('Subscribed to admin updates:', data.message)
      })

      // Listen to purchase notifications
      socket.on('livePurchaseNotification', (data: LivePurchaseNotification) => {
        console.log('Live purchase notification:', data)
        onPurchase?.(data)
      })

      // Listen to stream ended notifications
      socket.on('streamEndedWithStats', (data: StreamEndedStats) => {
        console.log('Stream ended with stats:', data)
        onStreamEnded?.(data)
      })

      // Listen to dashboard stats updates
      socket.on('dashboardStatsUpdate', (data: DashboardStats) => {
        console.log('Dashboard stats update:', data)
        onDashboardUpdate?.(data)
      })

      socketRef.current = socket
    } catch (err: any) {
      console.error('Failed to connect to live WebSocket:', err)
      setError(err.message || 'Failed to connect')
    }
  }, [onPurchase, onStreamEnded, onDashboardUpdate])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribeFromAdminUpdates')
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    socket: socketRef.current,
    isConnected,
    error,
    connect,
    disconnect,
  }
}
