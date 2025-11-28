---
description: Deploy user-service to production
---

# Deploy User Service

This workflow guides you through deploying the user-service to a hosting platform.

## Prerequisites

Before deploying, ensure you have:

- A PostgreSQL database (e.g., Neon, Supabase, Railway, or AWS RDS)
- Environment variables configured
- A hosting platform account (e.g., Render, Railway, Vercel, AWS, or DigitalOcean)

## Step 1: Verify Environment Configuration

Ensure your `.env` file has all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 8001)
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_ACCESS_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Firebase admin email
- `FIREBASE_PRIVATE_KEY` - Firebase private key
- `INTERNAL_API_SECRET` - Internal API secret

## Step 2: Run Database Migrations

// turbo

```bash
cd /home/sachin-int179/Desktop/evently-microservices/user-service
npx prisma migrate deploy
```

## Step 3: Build the Application

// turbo

```bash
npm run build
```

## Step 4: Test Production Build Locally

// turbo

```bash
npm run start:prod
```

## Deployment Options

### Option A: Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure the service:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment**: Node
4. Add all environment variables from your `.env` file
5. Deploy!

### Option B: Deploy to Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize project: `railway init`
4. Add environment variables: `railway variables set KEY=VALUE`
5. Deploy: `railway up`

### Option C: Deploy to AWS EC2

1. Launch an EC2 instance (Ubuntu 20.04 or later)
2. SSH into the instance
3. Install Node.js and npm
4. Clone your repository
5. Install dependencies: `npm install`
6. Set up environment variables
7. Run migrations: `npx prisma migrate deploy`
8. Build: `npm run build`
9. Use PM2 to manage the process:
   ```bash
   npm install -g pm2
   pm2 start dist/main.js --name user-service
   pm2 save
   pm2 startup
   ```

### Option D: Deploy with Docker

1. Create a Dockerfile (if not exists)
2. Build image: `docker build -t user-service .`
3. Run container: `docker run -p 8001:8001 --env-file .env user-service`
4. Or use docker-compose for easier management

## Step 5: Verify Deployment

After deployment, test your endpoints:

- Health check: `GET https://your-domain.com/health`
- API documentation: `GET https://your-domain.com/api`

## Post-Deployment

1. Set up monitoring (e.g., Sentry, LogRocket)
2. Configure SSL/TLS certificates
3. Set up CI/CD pipeline
4. Configure auto-scaling if needed
5. Set up database backups
