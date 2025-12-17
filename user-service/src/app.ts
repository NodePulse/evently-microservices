import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import { errorHandler } from './middleware/error.middleware';
import { validateGatewayRequest } from './middleware/gateway.middleware';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
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

export default app;
