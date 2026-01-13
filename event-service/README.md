# Event Service - Cloudflare D1

Event management microservice using Cloudflare D1 (remote database).

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables (see .env.example)
cp .env.example .env
# Edit .env with your Cloudflare credentials

# Apply database migrations
npm run d1:migrate

# Start development server
npm run dev
```

## Environment Variables

Required in `.env`:

```env
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
D1_DATABASE_ID=<your-database-id>
CLOUDFLARE_API_TOKEN=<your-api-token>
PORT=8002
GATEWAY_SECRET=<secret-matching-api-gateway>
```

## Scripts

```bash
npm run dev           # Start dev server with auto-reload
npm run build         # Build for production
npm start            # Start production server

npm run d1:migrate   # Apply D1 migrations
npm run d1:check     # Verify D1 tables
npm run d1:info      # Get D1 database info
```

## Database Tables

- **events**: Event data (title, dates, pricing, capacity, etc.)
- **event_registrations**: User registrations tracking

## API Endpoints

All endpoints available via API Gateway on port 8000:

- `GET /api/events/health` - Health check
- `GET /api/events/all-events` - List all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events/create` - Create new event (auth required)
- `POST /api/events/:id/join` - Join event (auth required)
- `GET /api/events/:id/registration` - Get user's registration (auth required)

## Architecture

- **Database**: Cloudflare D1 (remote SQLite)
- **ORM**: Raw SQL via D1 HTTP API
- **Features**: Automatic retries, error handling, logging

## Health Check

```bash
curl http://localhost:8002/health
```

Expected response:

```json
{
  "status": 200,
  "message": "Event Service is running",
  "database": "connected",
  "timestamp": "2026-01-07T..."
}
```
