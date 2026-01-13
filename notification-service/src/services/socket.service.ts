import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';

class SocketService {
  private io: Server | null = null;

  initialize(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // Customize this based on your frontend URL or env var
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      logger.info(`New socket client connected: ${socket.id}`);

      // Auto-join if userId is provided in query params
      const queryUserId = socket.handshake.query.userId as string;
      if (queryUserId) {
        logger.info(
          `User ${queryUserId} auto-joined room user:${queryUserId} via query param`,
        );
        socket.join(`user:${queryUserId}`);
      }

      // Allow users to join a private room based on their User ID
      socket.on('join', (data: any) => {
        let userId: string | null = null;

        try {
          if (typeof data === 'object' && data !== null && data.userId) {
            userId = data.userId;
          } else if (typeof data === 'string') {
            // Try to parse string as JSON in case client sent json-string
            const trimmed = data.trim();
            if (trimmed.startsWith('{')) {
              const parsed = JSON.parse(trimmed);
              if (parsed.userId) {
                userId = parsed.userId;
              } else {
                userId = trimmed;
              }
            } else {
              userId = trimmed;
            }
          }
        } catch (e) {
          // data is likely just a string ID
          if (typeof data === 'string') {
            userId = data;
          }
        }

        if (userId) {
          logger.info(`User ${userId} joined room user:${userId}`);
          socket.join(`user:${userId}`);
        } else {
          logger.warn(`Invalid join request received: ${JSON.stringify(data)}`);
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Socket client disconnected: ${socket.id}`);
      });
    });

    logger.info('✅ Socket.io initialized');
  }

  /**
   * Emit event to all connected clients
   */
  emit(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    } else {
      logger.warn('Socket.io not initialized, cannot emit event');
    }
  }

  /**
   * Emit event to a specific user (joined via 'join' event)
   */
  emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      const room = this.io.sockets.adapter.rooms.get(`user:${userId}`);
      if (!room || room.size === 0) {
        logger.warn(
          `⚠️ User ${userId} is not connected or hasn't joined room 'user:${userId}'. Notification might be missed.`,
        );
      } else {
        logger.info(
          `📢 Emitting '${event}' to user ${userId} (Sessions: ${room.size})`,
        );
        console.log(data);
      }
      this.io.to(`user:${userId}`).emit(event, data);
    } else {
      logger.warn('Socket.io not initialized, cannot emit to user');
    }
  }
}

export const socketService = new SocketService();
