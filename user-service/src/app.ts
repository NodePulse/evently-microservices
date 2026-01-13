import express from 'express';

import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import { errorHandler } from './middleware/error.middleware';
import { validateGatewayRequest } from './middleware/gateway.middleware';
import { rabbitMQService } from './services/rabbitmq.service';
import { startEventWorker } from './workers/event.worker';

const app = express();

// Middleware
app.use(helmet());

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Gateway validation - Only allow requests from API Gateway
app.use(validateGatewayRequest);

// ... (existing imports)

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'User Service is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: 'Route not found',
  });
});

// Error Handler
app.use(errorHandler);

const initializeApp = async () => {
  try {
    console.log('🔧 Initializing Event Service...\n');

    // Initialize RabbitMQ
    await rabbitMQService.connect().catch((err) => {
      console.error('⚠️ Failed to connect to RabbitMQ:', err.message);
    });

    startEventWorker.eventCreationWorker();

    console.log('\n✅ Messaging initialization complete!');
  } catch (error) {
    console.error('\n❌ Failed to initialize database:', error);
    console.error('\n⚠️  Server will start but database operations will fail.');
    console.error('Please check your .env file has correct D1 credentials:\n');
    console.error('  - CLOUDFLARE_ACCOUNT_ID');
    console.error('  - D1_DATABASE_ID');
    console.error('  - CLOUDFLARE_API_TOKEN\n');
  }
};

initializeApp();

export default app;
