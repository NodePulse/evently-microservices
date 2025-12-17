import app from './app';
import { config } from './config';
import prisma from './prisma';

const PORT = config.port;

const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');

    app.listen(PORT, () => {
      console.log(`🚀 User Service running on port ${PORT}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
