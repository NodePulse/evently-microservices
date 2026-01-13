import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8005,
  gatewaySecret: process.env.GATEWAY_SECRET || 'gateway-secret',
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  nodeEnv: process.env.NODE_ENV || 'development',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  databaseUrl: process.env.DATABASE_URL,
};

export default config;
