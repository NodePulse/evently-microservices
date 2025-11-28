# 🚀 Quick Start Guide - User Service Hosting

## ⚡ Fastest Way to Deploy

### Option 1: One-Click Deploy (5 minutes)

#### Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

1. Click the button above or go to [Render Dashboard](https://dashboard.render.com/)
2. Create new **Web Service**
3. Connect your GitHub repository
4. Use these settings:
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Environment:** Node
5. Add environment variables from `.env.example`
6. Click **Create Web Service**

**Done!** Your service will be live at `https://your-service.onrender.com`

---

### Option 2: Deploy with Railway (10 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize and deploy
railway init
railway up
```

Add your environment variables in the Railway dashboard.

---

### Option 3: Local Testing (2 minutes)

```bash
# Quick deploy script
./deploy.sh
```

Or manually:

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Build
npm run build

# Start
npm run start:prod
```

Test: `curl http://localhost:8001/health`

---

## 📋 Pre-Deployment Checklist

- [ ] PostgreSQL database ready (Neon, Supabase, Railway, etc.)
- [ ] `.env` file configured with all variables
- [ ] Firebase project set up (for OAuth)
- [ ] Domain name (optional, for production)

---

## 🔑 Required Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
PORT=8001
JWT_SECRET=your-secret-here
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
INTERNAL_API_SECRET=your-internal-secret
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-email
FIREBASE_PRIVATE_KEY="your-firebase-key"
```

**Generate secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🗄️ Database Setup

### Quick Options:

1. **Neon** (Recommended): https://neon.tech
   - Serverless PostgreSQL
   - Free tier: 3 GB storage
   - Auto-scaling

2. **Supabase**: https://supabase.com
   - PostgreSQL + extras
   - Free tier: 500 MB
   - Built-in auth

3. **Railway**: https://railway.app
   - One-click PostgreSQL
   - Integrated with deployment

After creating database:

```bash
npx prisma migrate deploy
```

---

## ✅ Verify Deployment

### Health Check

```bash
curl https://your-domain.com/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-11-28T...",
  "service": "user-service",
  "uptime": 123.45
}
```

### API Info

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
    "password": "SecurePass123!"
  }'
```

---

## 🐳 Docker Deployment

### Quick Start

```bash
# Build
docker build -t user-service .

# Run
docker run -d -p 8001:8001 --env-file .env user-service
```

### With Docker Compose

```bash
docker-compose up -d
```

---

## 📊 Monitoring

### Set up monitoring (choose one):

1. **UptimeRobot** (Free): https://uptimerobot.com
   - Monitor: `https://your-domain.com/health`
   - Interval: 5 minutes

2. **Sentry** (Error tracking): https://sentry.io

   ```bash
   npm install @sentry/node
   ```

3. **LogRocket** (Session replay): https://logrocket.com

---

## 🔒 Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong, random JWT secrets
- [ ] Configure CORS for your frontend domain only
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Use environment variables (never commit secrets)
- [ ] Keep dependencies updated

---

## 🆘 Troubleshooting

### Build fails

```bash
npx prisma generate
npm run build
```

### Can't connect to database

- Check `DATABASE_URL` format
- Ensure `sslmode=require` for cloud databases
- Verify database is accessible

### Port already in use

```bash
# Find and kill process
lsof -i :8001
kill -9 <PID>
```

---

## 📚 Full Documentation

For detailed instructions, see:

- **[HOSTING.md](./HOSTING.md)** - Complete hosting guide
- **[README.md](./README.md)** - Project overview
- **[.agent/workflows/deploy-user-service.md](./.agent/workflows/deploy-user-service.md)** - Deployment workflow

---

## 🎯 Recommended Platforms

| Platform    | Best For         | Free Tier | Difficulty      |
| ----------- | ---------------- | --------- | --------------- |
| **Render**  | Quick deployment | ✅ Yes    | ⭐ Easy         |
| **Railway** | Full-stack apps  | ✅ Yes    | ⭐ Easy         |
| **AWS EC2** | Production       | ❌ No     | ⭐⭐⭐ Advanced |
| **Docker**  | Consistency      | N/A       | ⭐⭐ Medium     |

---

## 💡 Next Steps

After deployment:

1. ✅ Test all endpoints
2. 📊 Set up monitoring
3. 🔒 Configure SSL/HTTPS
4. 📝 Add API documentation (Swagger)
5. 🚀 Set up CI/CD
6. 💾 Configure database backups
7. 📈 Add performance monitoring

---

## 🤝 Support

Need help?

1. Check the logs
2. Review environment variables
3. Test database connection
4. See [HOSTING.md](./HOSTING.md) for detailed troubleshooting

---

**Last Updated:** 2025-11-28  
**Service Version:** 1.0.0  
**Node Version:** 20+
