import { config } from 'dotenv';
config();

export const env = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Firebase Admin SDK Configuration
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};
