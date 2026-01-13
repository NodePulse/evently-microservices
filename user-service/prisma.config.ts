import dotenv from 'dotenv';
dotenv.config({ path: '.env.dev' });
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
