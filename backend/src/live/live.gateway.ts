import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveService } from './live.service';
import { SendMessageDto } from './dto';

@WebSocketGateway({
  namespace: '/live',
  cors: {
    origin: '*',
  },
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeViewers = new Map<string, Set<string>>(); // streamId -> Set of socketIds

  constructor(private readonly liveService: LiveService) {}

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

      // Save message to database
      const message = await this.liveService.sendMessage(streamId, messageData);

      // Broadcast to all viewers in the stream
      this.server.to(streamId).emit('newMessage', {
        id: message.id,
        username: message.username,
        message: message.message,
        sentAt: message.sentAt,
        user: message.user,
      });

    } catch (error) {
      client.emit('error', { message: 'Failed to send message', error: error.message });
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

  // Method to send notifications to all viewers of a stream
  async notifyStreamViewers(streamId: string, event: string, data: any) {
    this.server.to(streamId).emit(event, data);
  }

  // Method to get current viewer count for a stream
  getCurrentViewerCount(streamId: string): number {
    return this.activeViewers.get(streamId)?.size || 0;
  }
}