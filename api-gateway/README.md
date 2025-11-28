# API Gateway Service

API Gateway for the Evently Microservices Platform. Acts as a single entry point for all client requests, handling routing, authentication, rate limiting, and request forwarding.

## Features

- **Request Routing**: Routes requests to appropriate microservices based on URL path
- **JWT Authentication**: Validates JWT tokens for protected routes
- **Rate Limiting**: Prevents abuse with configurable rate limits
- **Health Checks**: Monitors gateway and downstream service health
- **CORS Support**: Configurable cross-origin resource sharing

## Architecture

### Routing Strategy

- `/api/v1/auth/*` → User Service (public)
- `/api/v1/users/*` → User Service (protected)
- `/api/v1/events/*` → Event Service (public)
- `/api/v1/tickets/*` → Ticket Service (protected)
- `/api/v1/payments/*` → Payment Service (protected)

### Technology Stack

- **Framework**: NestJS 11
- **HTTP Client**: Axios
- **Authentication**: Passport JWT
- **Rate Limiting**: @nestjs/throttler
- **Health Checks**: @nestjs/terminus

## Setup

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3100
NODE_ENV=development

# Service URLs
USER_SERVICE_URL=http://localhost:3000
EVENT_SERVICE_URL=http://localhost:8000
TICKET_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Running the Service

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

## API Endpoints

### Health Checks

- `GET /health` - Check gateway and downstream services
- `GET /health/gateway` - Check gateway only

### Proxied Routes

All `/api/v1/*` routes are proxied to their respective microservices.

## Authentication

Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Public routes (e.g., `/api/v1/auth/*`) do not require authentication.

## Rate Limiting

- **Global**: 100 requests per minute per IP
- **Auth endpoints**: Configurable via environment variables

## Project Structure

```
api-gateway/
├── src/
│   ├── main.ts              # Application entry point
│   ├── app.module.ts        # Root module
│   ├── proxy/               # Request proxying
│   │   ├── proxy.module.ts
│   │   ├── proxy.controller.ts
│   │   └── proxy.service.ts
│   ├── auth/                # JWT authentication
│   │   ├── auth.module.ts
│   │   ├── jwt.strategy.ts
│   │   └── jwt-auth.guard.ts
│   ├── health/              # Health checks
│   │   ├── health.module.ts
│   │   └── health.controller.ts
│   └── config/              # Configuration
│       └── services.config.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## Troubleshooting

### Service Unavailable Errors

- Ensure all downstream services are running
- Check service URLs in `.env` file
- Verify network connectivity

### Authentication Failures

- Verify JWT_SECRET matches the auth service
- Check token expiration
- Ensure Authorization header is properly formatted

## License

MIT
