import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8001,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'secret',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
  jwtResetSecret: process.env.JWT_RESET_SECRET || 'reset_secret',
};
