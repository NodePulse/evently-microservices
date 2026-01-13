import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middleware/error.middleware';
import { validateGatewayRequest } from './middleware/gateway.middleware';

const app = express();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Gateway validation - Only allow requests from API Gateway
app.use(validateGatewayRequest);

// Routes
app.use('/', notificationRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 200,
    message: 'Notification Service is running',
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

export default app;
