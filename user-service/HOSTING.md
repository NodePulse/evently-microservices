# User Service Hosting Guide

This guide provides comprehensive instructions for hosting the user-service microservice.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Deployment Options](#deployment-options)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Testing](#testing)
7. [Monitoring](#monitoring)

---

## Prerequisites

Before deploying, ensure you have:

- Node.js 20+ and npm 10+
- PostgreSQL database (cloud or self-hosted)
- Firebase project (for OAuth)
- Git repository (for automated deployments)

---

## Quick Start

### Local Testing

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and configure:

   ```bash
   cp .env.example .env
   ```

3. **Run database migrations:**

   ```bash
   npx prisma migrate deploy
   ```

4. **Build the application:**

   ```bash
   npm run build
   ```

5. **Start in production mode:**

   ```bash
   npm run start:prod
   ```

6. **Test the health endpoint:**
   ```bash
   curl http://localhost:8001/health
   ```

---

## Deployment Options

### Option 1: Render (Recommended for Quick Deployment)

**Pros:** Easy setup, automatic SSL, free tier available
**Cons:** Cold starts on free tier

**Steps:**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** user-service
   - **Environment:** Node
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Instance Type:** Free or Starter ($7/month)
5. Add environment variables (see Environment Configuration section)
6. Click "Create Web Service"

**Estimated Time:** 5-10 minutes

---

### Option 2: Railway

**Pros:** Simple deployment, PostgreSQL included, generous free tier
**Cons:** Pricing can increase with usage

**Steps:**

1. Install Railway CLI:

   ```bash
   npm install -g @railway/cli
   ```

2. Login:

   ```bash
   railway login
   ```

3. Initialize project:

   ```bash
   cd /home/sachin-int179/Desktop/evently-microservices/user-service
   railway init
   ```

4. Add PostgreSQL:

   ```bash
   railway add --database postgresql
   ```

5. Set environment variables:

   ```bash
   railway variables set PORT=8001
   railway variables set JWT_SECRET=your-secret-here
   # Add all other variables
   ```

6. Deploy:
   ```bash
   railway up
   ```

**Estimated Time:** 10-15 minutes

---

### Option 3: AWS EC2 (For Production)

**Pros:** Full control, scalable, reliable
**Cons:** More complex setup, requires AWS knowledge

**Steps:**

1. **Launch EC2 Instance:**
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t3.small or larger
   - Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 8001 (API)

2. **SSH into instance:**

   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Node.js:**

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install Git and clone repository:**

   ```bash
   sudo apt-get install -y git
   git clone https://github.com/your-username/evently-microservices.git
   cd evently-microservices/user-service
   ```

5. **Install dependencies:**

   ```bash
   npm install
   ```

6. **Set up environment variables:**

   ```bash
   nano .env
   # Paste your environment variables
   ```

7. **Run migrations:**

   ```bash
   npx prisma migrate deploy
   ```

8. **Build application:**

   ```bash
   npm run build
   ```

9. **Install PM2 for process management:**

   ```bash
   sudo npm install -g pm2
   ```

10. **Start application with PM2:**

    ```bash
    pm2 start dist/main.js --name user-service
    pm2 save
    pm2 startup
    ```

11. **Set up Nginx as reverse proxy:**

    ```bash
    sudo apt-get install -y nginx
    sudo nano /etc/nginx/sites-available/user-service
    ```

    Add configuration:

    ```nginx
    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://localhost:8001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

    Enable site:

    ```bash
    sudo ln -s /etc/nginx/sites-available/user-service /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

12. **Set up SSL with Let's Encrypt:**
    ```bash
    sudo apt-get install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

**Estimated Time:** 30-45 minutes

---

### Option 4: Docker Deployment

**Pros:** Consistent environments, easy scaling
**Cons:** Requires Docker knowledge

**Steps:**

1. **Build Docker image:**

   ```bash
   docker build -t user-service:latest .
   ```

2. **Run container:**

   ```bash
   docker run -d \
     --name user-service \
     -p 8001:8001 \
     --env-file .env \
     user-service:latest
   ```

3. **Or use Docker Compose:**
   ```bash
   docker-compose up -d
   ```

**For Docker Hub:**

```bash
docker tag user-service:latest your-username/user-service:latest
docker push your-username/user-service:latest
```

**Estimated Time:** 15-20 minutes

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=8001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your-jwt-secret-key-here
JWT_ACCESS_SECRET=your-access-token-secret-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here

# Internal API Secret
INTERNAL_API_SECRET=your-internal-api-secret

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

### Generating Secrets

Use these commands to generate secure secrets:

```bash
# For JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 64
```

---

## Database Setup

### Option 1: Neon (Serverless PostgreSQL)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create new project
3. Copy connection string
4. Update `DATABASE_URL` in `.env`

**Free Tier:** 3 GB storage, 1 compute unit

### Option 2: Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create new project
3. Go to Settings → Database
4. Copy connection string (use "Connection Pooling" for production)
5. Update `DATABASE_URL` in `.env`

**Free Tier:** 500 MB database, 2 GB bandwidth

### Option 3: Railway PostgreSQL

1. In Railway dashboard, click "New" → "Database" → "PostgreSQL"
2. Copy `DATABASE_URL` from variables
3. Update `.env`

### Running Migrations

After setting up the database:

```bash
npx prisma migrate deploy
```

To generate Prisma client:

```bash
npx prisma generate
```

---

## Testing

### Health Check

```bash
curl https://your-domain.com/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-11-28T03:57:58.000Z",
  "service": "user-service",
  "uptime": 123.456
}
```

### API Documentation

Visit the root endpoint:

```bash
curl https://your-domain.com/
```

### Test Registration

```bash
curl -X POST https://your-domain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePassword123!"
  }'
```

---

## Monitoring

### Application Logs

**With PM2:**

```bash
pm2 logs user-service
pm2 monit
```

**With Docker:**

```bash
docker logs -f user-service
```

### Health Monitoring

Set up automated health checks:

**Using cron:**

```bash
*/5 * * * * curl -f https://your-domain.com/health || echo "Service down"
```

**Using UptimeRobot:**

1. Go to [UptimeRobot](https://uptimerobot.com/)
2. Add new monitor
3. URL: `https://your-domain.com/health`
4. Interval: 5 minutes

### Performance Monitoring

Consider integrating:

- **Sentry** for error tracking
- **LogRocket** for session replay
- **New Relic** for APM
- **Datadog** for infrastructure monitoring

---

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy User Service

on:
  push:
    branches: [main]
    paths:
      - 'user-service/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./user-service
        run: npm ci

      - name: Generate Prisma Client
        working-directory: ./user-service
        run: npx prisma generate

      - name: Build
        working-directory: ./user-service
        run: npm run build

      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST https://api.render.com/deploy/srv-xxxxx?key=$RENDER_API_KEY
```

---

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong JWT secrets
- [ ] Enable CORS only for trusted domains
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Use connection pooling for database
- [ ] Enable logging and monitoring
- [ ] Keep dependencies updated
- [ ] Use security headers (helmet.js)

---

## Troubleshooting

### Build Fails

**Issue:** Prisma client not generated
**Solution:**

```bash
npx prisma generate
npm run build
```

### Database Connection Fails

**Issue:** Cannot connect to database
**Solution:**

- Check `DATABASE_URL` format
- Ensure database is accessible
- Check firewall rules
- Verify SSL mode (`sslmode=require` for cloud databases)

### Port Already in Use

**Issue:** Port 8001 is already in use
**Solution:**

```bash
# Find process using port
lsof -i :8001
# Kill process
kill -9 <PID>
# Or change PORT in .env
```

---

## Support

For issues or questions:

- Check application logs
- Review environment variables
- Test database connectivity
- Verify Prisma migrations

---

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure automated backups
3. Implement rate limiting
4. Add API documentation (Swagger)
5. Set up staging environment
6. Configure auto-scaling
7. Implement caching (Redis)
8. Add comprehensive logging

---

**Last Updated:** 2025-11-28
**Version:** 1.0.0
