import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveService } from './live.service';
import { SendMessageDto } from './dto';
import { ReactionType } from './live.entity';

@WebSocketGateway({
  namespace: '/live',
  cors: {
    origin: '*',
  },
})
export class LiveGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeViewers = new Map<string, Set<string>>(); // streamId -> Set of socketIds

  constructor(private readonly liveService: LiveService) {}

  afterInit(server: Server) {
    // Set gateway reference in service for notifications
    this.liveService.setGateway(this);
    console.log('Live WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Remove from all streams
    for (const [streamId, viewers] of this.activeViewers.entries()) {
      if (viewers.has(client.id)) {
        viewers.delete(client.id);

        // Update viewer count
        this.server.to(streamId).emit('viewerCountUpdate', {
          streamId,
          count: viewers.size,
        });

        // Notify leave if we have user/session info
        const userData = client.data;
        if (userData?.userId || userData?.sessionId) {
          await this.liveService.leaveStream(streamId, userData.userId, userData.sessionId);
        }
      }
    }
  }

  @SubscribeMessage('joinStream')
  async handleJoinStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; userId?: string; sessionId?: string },
  ) {
    try {
      const { streamId, userId, sessionId } = data;

      // Store user data in socket
      client.data = { userId, sessionId };

      // Join socket room
      await client.join(streamId);

      // Add to active viewers
      if (!this.activeViewers.has(streamId)) {
        this.activeViewers.set(streamId, new Set());
      }
      this.activeViewers.get(streamId)?.add(client.id);

      // Record in database
      await this.liveService.joinStream(
        streamId,
        userId,
        sessionId,
        client.handshake.address,
        client.handshake.headers['user-agent'],
      );

      // Get current stream info
      const stream = await this.liveService.findLiveStreamById(streamId);

      // Notify all viewers of new join
      const viewerCount = this.activeViewers.get(streamId)?.size || 0;
      this.server.to(streamId).emit('viewerCountUpdate', {
        streamId,
        count: viewerCount,
      });

      // Send stream info to new viewer
      client.emit('streamInfo', {
        stream: {
          id: stream.id,
          title: stream.title,
          description: stream.description,
          status: stream.status,
          hlsUrl: stream.hlsUrl,
          seller: stream.seller,
          products: stream.products,
        },
        viewerCount,
      });

      // Send recent messages
      const recentMessages = await this.liveService.getStreamMessages(streamId, 20);
      client.emit('recentMessages', recentMessages.reverse());

    } catch (error) {
      client.emit('error', { message: 'Failed to join stream', error: error.message });
    }
  }

  @SubscribeMessage('hostJoinStream')
  async handleHostJoinStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; hostId?: string },
  ) {
    try {
      const { streamId, hostId } = data;

      // Store host data in socket
      client.data = { userId: hostId, isHost: true };

      // Join socket room
      await client.join(streamId);

      // Add to active viewers (host counts as viewer for room purposes)
      if (!this.activeViewers.has(streamId)) {
        this.activeViewers.set(streamId, new Set());
      }
      this.activeViewers.get(streamId)?.add(client.id);

      // Get current stream info
      const stream = await this.liveService.findLiveStreamById(streamId);

      // Get current viewer count
      const viewerCount = this.activeViewers.get(streamId)?.size || 0;

      // Send stream info to host
      client.emit('streamInfo', {
        stream: {
          id: stream.id,
          title: stream.title,
          description: stream.description,
          status: stream.status,
          hlsUrl: stream.hlsUrl,
          seller: stream.seller,
          affiliate: stream.affiliate,
          products: stream.products,
        },
        viewerCount,
        isHost: true,
      });

      // Send recent messages to host
      const recentMessages = await this.liveService.getStreamMessages(streamId, 50);
      client.emit('recentMessages', recentMessages.reverse());

      console.log(`Host joined stream ${streamId}`);

    } catch (error) {
      client.emit('error', { message: 'Failed to join stream as host', error: error.message });
    }
  }

  @SubscribeMessage('leaveStream')
  async handleLeaveStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    try {
      const { streamId } = data;
      const userData = client.data;

      // Leave socket room
      await client.leave(streamId);

      // Remove from active viewers
      if (this.activeViewers.has(streamId)) {
        this.activeViewers.get(streamId)?.delete(client.id);

        // Update viewer count
        const viewerCount = this.activeViewers.get(streamId)?.size || 0;
        this.server.to(streamId).emit('viewerCountUpdate', {
          streamId,
          count: viewerCount,
        });
      }

      // Record in database
      if (userData?.userId || userData?.sessionId) {
        await this.liveService.leaveStream(streamId, userData.userId, userData.sessionId);
      }

    } catch (error) {
      client.emit('error', { message: 'Failed to leave stream', error: error.message });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto & { streamId: string },
  ) {
    try {
      const { streamId, ...messageData } = data;
      const userData = client.data;

      // Check if user is banned or timed out
      if (userData?.userId) {
        const isBanned = await this.liveService.isUserBanned(streamId, userData.userId);
        if (isBanned) {
          client.emit('error', { message: 'You are banned from this stream' });
          return;
        }

        const isTimedOut = await this.liveService.isUserTimedOut(streamId, userData.userId);
        if (isTimedOut) {
          client.emit('error', { message: 'You are temporarily timed out' });
          return;
        }

        // Check rate limit (5 messages per 10 seconds)
        const canSend = await this.liveService.checkRateLimit(userData.userId, 5, 10);
        if (!canSend) {
          client.emit('error', { message: 'Slow down! You are sending messages too fast' });
          return;
        }
      }

      // Save message to database
      const message = await this.liveService.sendMessage(streamId, messageData);

      // Get user badge
      const badge = await this.liveService.getUserBadge(streamId, userData?.userId);

      // Broadcast to all viewers in the stream
      this.server.to(streamId).emit('newMessage', {
        id: message.id,
        username: message.username,
        message: message.message,
        sentAt: message.sentAt,
        user: message.user,
        badge, // Include badge in message
      });

    } catch (error) {
      client.emit('error', { message: 'Failed to send message', error: error.message });
    }
  }

  @SubscribeMessage('sendReaction')
  async handleSendReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; type: ReactionType },
  ) {
    try {
      const { streamId, type } = data;
      const userData = client.data;

      // Save reaction to database
      const reaction = await this.liveService.sendReaction(
        streamId,
        userData?.userId || null,
        userData?.sessionId || null,
        type,
      );

      // Broadcast reaction to all viewers
      this.server.to(streamId).emit('newReaction', {
        type,
        username: userData?.username || 'Guest',
        timestamp: reaction.createdAt,
      });

      // Send acknowledgment to sender
      client.emit('reactionSent', { type, timestamp: reaction.createdAt });

    } catch (error) {
      client.emit('error', { message: 'Failed to send reaction', error: error.message });
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; messageId: string },
  ) {
    try {
      const { streamId, messageId } = data;
      const userData = client.data;

      if (!userData?.userId) {
        client.emit('error', { message: 'Authentication required' });
        return;
      }

      // Get user badge to check if they can moderate
      const badge = await this.liveService.getUserBadge(streamId, userData.userId);

      if (badge !== 'seller' && badge !== 'affiliate') {
        client.emit('error', { message: 'Only hosts can delete messages' });
        return;
      }

      // Delete the message
      await this.liveService.deleteMessage(messageId, userData.userId);

      // Broadcast deletion to all viewers
      this.server.to(streamId).emit('messageDeleted', {
        messageId,
        deletedBy: userData.userId,
      });

      client.emit('messageDeleteSuccess', { messageId });

    } catch (error) {
      client.emit('error', { message: 'Failed to delete message', error: error.message });
    }
  }

  @SubscribeMessage('banUser')
  async handleBanUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; userId: string; reason: string },
  ) {
    try {
      const { streamId, userId, reason } = data;
      const userData = client.data;

      if (!userData?.userId) {
        client.emit('error', { message: 'Authentication required' });
        return;
      }

      // Get user badge to check if they can moderate
      const badge = await this.liveService.getUserBadge(streamId, userData.userId);

      if (badge !== 'seller' && badge !== 'affiliate') {
        client.emit('error', { message: 'Only hosts can ban users' });
        return;
      }

      // Ban the user
      await this.liveService.banUser(streamId, userId, userData.userId, reason);

      // Broadcast ban to all viewers
      this.server.to(streamId).emit('userBanned', {
        userId,
        bannedBy: userData.userId,
        reason,
      });

      // Notify the banned user and disconnect them
      const bannedUserSockets = await this.server.in(streamId).fetchSockets();
      for (const socket of bannedUserSockets) {
        if (socket.data?.userId === userId) {
          socket.emit('bannedFromStream', { reason });
          socket.leave(streamId);
        }
      }

      client.emit('banSuccess', { userId });

    } catch (error) {
      client.emit('error', { message: 'Failed to ban user', error: error.message });
    }
  }

  @SubscribeMessage('timeoutUser')
  async handleTimeoutUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; userId: string; timeoutMinutes: number },
  ) {
    try {
      const { streamId, userId, timeoutMinutes } = data;
      const userData = client.data;

      if (!userData?.userId) {
        client.emit('error', { message: 'Authentication required' });
        return;
      }

      // Get user badge to check if they can moderate
      const badge = await this.liveService.getUserBadge(streamId, userData.userId);

      if (badge !== 'seller' && badge !== 'affiliate') {
        client.emit('error', { message: 'Only hosts can timeout users' });
        return;
      }

      // Timeout the user
      await this.liveService.timeoutUser(streamId, userId, timeoutMinutes, userData.userId);

      // Broadcast timeout to all viewers
      this.server.to(streamId).emit('userTimedOut', {
        userId,
        timeoutMinutes,
        moderatorId: userData.userId,
      });

      // Notify the timed out user
      const timedOutUserSockets = await this.server.in(streamId).fetchSockets();
      for (const socket of timedOutUserSockets) {
        if (socket.data?.userId === userId) {
          socket.emit('timedOut', { timeoutMinutes });
        }
      }

      client.emit('timeoutSuccess', { userId, timeoutMinutes });

    } catch (error) {
      client.emit('error', { message: 'Failed to timeout user', error: error.message });
    }
  }

  @SubscribeMessage('streamHeartbeat')
  async handleStreamHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    // Update last seen time for the viewer
    // This could be used for more accurate viewer tracking
    const { streamId } = data;

    // Could implement heartbeat logic here to detect disconnected viewers
    // For now, just acknowledge
    client.emit('heartbeatAck', { timestamp: new Date() });
  }

  // Seller-specific events
  @SubscribeMessage('startStream')
  async handleStartStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; sellerId: string },
  ) {
    try {
      const { streamId, sellerId } = data;

      const stream = await this.liveService.startLiveStream(streamId, sellerId);

      // Notify all viewers that stream is now live
      this.server.to(streamId).emit('streamStatusUpdate', {
        streamId,
        status: 'live',
        startedAt: stream.startedAt,
      });

      client.emit('streamStarted', { stream });

    } catch (error) {
      client.emit('error', { message: 'Failed to start stream', error: error.message });
    }
  }

  @SubscribeMessage('endStream')
  async handleEndStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; sellerId: string },
  ) {
    try {
      const { streamId, sellerId } = data;

      const stream = await this.liveService.endLiveStream(streamId, sellerId);

      // Notify all viewers that stream has ended
      this.server.to(streamId).emit('streamStatusUpdate', {
        streamId,
        status: 'ended',
        endedAt: stream.endedAt,
      });

      // Clear active viewers for this stream
      this.activeViewers.delete(streamId);

      client.emit('streamEnded', { stream });

    } catch (error) {
      client.emit('error', { message: 'Failed to end stream', error: error.message });
    }
  }

  @SubscribeMessage('updateStreamProducts')
  async handleUpdateStreamProducts(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string; products: any[] },
  ) {
    try {
      const { streamId, products } = data;

      // Notify all viewers of product updates
      this.server.to(streamId).emit('streamProductsUpdate', {
        streamId,
        products,
        timestamp: new Date(),
      });

    } catch (error) {
      client.emit('error', { message: 'Failed to update products', error: error.message });
    }
  }

  // Pin a product during live stream (TikTok Shop style)
  @SubscribeMessage('pinProduct')
  async handlePinProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      streamId: string;
      productId: string;
      timerDuration?: number; // Duration in seconds for the special offer
    },
  ) {
    try {
      const { streamId, productId, timerDuration } = data;
      const userData = client.data;

      if (!userData?.userId) {
        client.emit('error', { message: 'Authentication required' });
        return;
      }

      // Verify user is the host (seller or affiliate)
      const badge = await this.liveService.getUserBadge(streamId, userData.userId);

      if (badge !== 'seller' && badge !== 'affiliate') {
        client.emit('error', { message: 'Only hosts can pin products' });
        return;
      }

      // Calculate timer end time if duration is provided
      const timerEndTime = timerDuration
        ? new Date(Date.now() + timerDuration * 1000)
        : null;

      // Broadcast pinned product to all viewers
      this.server.to(streamId).emit('productPinned', {
        productId,
        pinnedBy: userData.userId,
        timestamp: new Date(),
        timerEndTime,
      });

      // Notify admin dashboard
      this.server.to('admin-dashboard').emit('productPinnedInStream', {
        streamId,
        productId,
        pinnedBy: userData.userId,
        timestamp: new Date(),
      });

      client.emit('pinProductSuccess', { productId, timerEndTime });

    } catch (error) {
      client.emit('error', { message: 'Failed to pin product', error: error.message });
    }
  }

  // Unpin the currently pinned product
  @SubscribeMessage('unpinProduct')
  async handleUnpinProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    try {
      const { streamId } = data;
      const userData = client.data;

      if (!userData?.userId) {
        client.emit('error', { message: 'Authentication required' });
        return;
      }

      // Verify user is the host
      const badge = await this.liveService.getUserBadge(streamId, userData.userId);

      if (badge !== 'seller' && badge !== 'affiliate') {
        client.emit('error', { message: 'Only hosts can unpin products' });
        return;
      }

      // Broadcast unpin to all viewers
      this.server.to(streamId).emit('productUnpinned', {
        unpinnedBy: userData.userId,
        timestamp: new Date(),
      });

      client.emit('unpinProductSuccess');

    } catch (error) {
      client.emit('error', { message: 'Failed to unpin product', error: error.message });
    }
  }

  // Handle purchase made during live stream (for real-time notifications)
  @SubscribeMessage('purchaseMade')
  async handlePurchaseMade(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      streamId: string;
      productId: string;
      productName: string;
      quantity: number;
      amount: number;
    },
  ) {
    try {
      const { streamId, productId, productName, quantity, amount } = data;

      // Increment purchase counter for this stream
      const purchaseCount = await this.liveService.incrementStreamPurchaseCount(streamId, productId);

      // Broadcast new purchase notification to all viewers (anonymized)
      this.server.to(streamId).emit('newPurchase', {
        productId,
        productName,
        quantity,
        buyerName: 'Usuario***', // Anonymized buyer name
        timestamp: new Date(),
        purchaseCount, // Total purchases of this product during stream
      });

      // Play purchase animation for viewers
      this.server.to(streamId).emit('purchaseAnimation', {
        productName,
        timestamp: new Date(),
      });

    } catch (error) {
      client.emit('error', { message: 'Failed to broadcast purchase', error: error.message });
    }
  }

  // Get current purchase stats for a stream
  @SubscribeMessage('getStreamPurchaseStats')
  async handleGetStreamPurchaseStats(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    try {
      const { streamId } = data;

      const stats = await this.liveService.getStreamPurchaseStats(streamId);

      client.emit('streamPurchaseStats', {
        streamId,
        stats,
        timestamp: new Date(),
      });

    } catch (error) {
      client.emit('error', { message: 'Failed to get purchase stats', error: error.message });
    }
  }

  // Start a flash sale/special offer timer
  @SubscribeMessage('startFlashSale')
  async handleStartFlashSale(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      streamId: string;
      productId: string;
      durationSeconds: number;
      discountPercent: number;
    },
  ) {
    try {
      const { streamId, productId, durationSeconds, discountPercent } = data;
      const userData = client.data;

      if (!userData?.userId) {
        client.emit('error', { message: 'Authentication required' });
        return;
      }

      // Verify user is the host
      const badge = await this.liveService.getUserBadge(streamId, userData.userId);

      if (badge !== 'seller' && badge !== 'affiliate') {
        client.emit('error', { message: 'Only hosts can start flash sales' });
        return;
      }

      const endTime = new Date(Date.now() + durationSeconds * 1000);

      // Broadcast flash sale to all viewers
      this.server.to(streamId).emit('flashSaleStarted', {
        productId,
        discountPercent,
        endTime,
        startedBy: userData.userId,
        timestamp: new Date(),
      });

      // Schedule flash sale end notification
      setTimeout(() => {
        this.server.to(streamId).emit('flashSaleEnded', {
          productId,
          endTime: new Date(),
        });
      }, durationSeconds * 1000);

      client.emit('flashSaleStartSuccess', { productId, endTime });

    } catch (error) {
      client.emit('error', { message: 'Failed to start flash sale', error: error.message });
    }
  }

  // Method to send notifications to all viewers of a stream
  async notifyStreamViewers(streamId: string, event: string, data: any) {
    this.server.to(streamId).emit(event, data);
  }

  // Method to get current viewer count for a stream
  getCurrentViewerCount(streamId: string): number {
    return this.activeViewers.get(streamId)?.size || 0;
  }

  // Admin-specific events for dashboard real-time updates
  @SubscribeMessage('subscribeToAdminUpdates')
  async handleSubscribeToAdminUpdates(@ConnectedSocket() client: Socket) {
    // Join admin room for dashboard updates
    await client.join('admin-dashboard');
    client.emit('subscribedToAdmin', { message: 'Successfully subscribed to admin updates' });
  }

  @SubscribeMessage('unsubscribeFromAdminUpdates')
  async handleUnsubscribeFromAdminUpdates(@ConnectedSocket() client: Socket) {
    await client.leave('admin-dashboard');
    client.emit('unsubscribedFromAdmin', { message: 'Unsubscribed from admin updates' });
  }

  // Notify admin dashboard when a purchase happens during a live stream
  async notifyLivePurchase(streamId: string, purchaseData: {
    orderId: string;
    streamId: string;
    streamTitle: string;
    productName: string;
    amount: number;
    buyerName: string;
    timestamp: Date;
  }) {
    // Notify stream viewers
    this.server.to(streamId).emit('streamPurchase', {
      productName: purchaseData.productName,
      buyerName: purchaseData.buyerName,
      amount: purchaseData.amount,
      timestamp: purchaseData.timestamp,
    });

    // Notify admin dashboard
    this.server.to('admin-dashboard').emit('livePurchaseNotification', purchaseData);
  }

  // Notify admin dashboard when stream ends with final stats
  async notifyStreamEnded(streamId: string, finalStats: {
    streamId: string;
    streamTitle: string;
    totalViewers: number;
    peakViewers: number;
    totalSales: number;
    ordersCount: number;
    duration: number;
    endedAt: Date;
  }) {
    this.server.to('admin-dashboard').emit('streamEndedWithStats', finalStats);
  }

  // Broadcast dashboard stats update to all admin clients
  async broadcastDashboardStatsUpdate(stats: any) {
    this.server.to('admin-dashboard').emit('dashboardStatsUpdate', stats);
  }
}