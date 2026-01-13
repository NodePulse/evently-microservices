import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { rabbitMQService } from './services/rabbitmq.service';
import { NotificationService } from './services/notification.service';
import prisma from './prisma';
import { socketService } from './services/socket.service';

const PORT = config.port;

const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Create HTTP server from Express app
    const httpServer = createServer(app);

    // Initialize RabbitMQ
    await rabbitMQService.connect();

    // Setup Consumers
    await rabbitMQService.consume('event-registration', async (data) => {
      console.log('📨 Received event registration:', data);

      try {
        // Log the incoming event request to DB
        await NotificationService.logNotification({
          recipient: data.userId || 'unknown-user',
          type: 'EVENT_REGISTRATION',
          status: data.email ? 'PROCESSING' : 'PENDING_EMAIL',
          metadata: data,
          title: 'Event Registration',
        });
        // Emit Socket Notification to User
        if (data.userId) {
          socketService.emitToUser(data.userId, 'notification', {
            type: 'EVENT_REGISTRATION',
            title: 'Registration Successful!',
            message: `You’ve successfully registered for ${data.eventTitle}.`,
            details: {
              date: [data.startDate, data.endDate],
              time: [data.startTime, data.endTime],
              location: data.location,
              registeredAt: data.registeredAt,
            },
            footerMessage:
              'You can view your ticket and event updates from the Events section.',
            timestamp: new Date(),
          });
        }

        // If payload has email, try to send real email
        // if (data.email) {
        //   await NotificationService.sendEmail({
        //     to: data.email,
        //     subject: 'Registration Confirmed',
        //     text: `You have registered for event ID: ${data.eventId}`,
        //   });
        // }
      } catch (err) {
        console.error('Failed to process registration notification', err);
        // Log failure to DB
        await NotificationService.logNotification({
          recipient: data.userId || 'unknown-user',
          type: 'EVENT_REGISTRATION',
          status: 'FAILED',
          error: String(err),
          metadata: data,
        });
      }
    });

    // Start HTTP Server (which includes Socket.io)
    httpServer.listen(PORT, () => {
      console.log(`🚀 Notification Service running on port ${PORT}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);

      // Initialize Socket.io
      socketService.initialize(httpServer);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
