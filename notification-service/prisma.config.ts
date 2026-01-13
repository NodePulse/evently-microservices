import { defineConfig } from '@prisma/config';

// @ts-ignore
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
