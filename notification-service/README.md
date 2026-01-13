# Notification Service

Microservice for sending notifications (email, push notifications) in the Evently platform.

## Features

- Email notifications (OTP, event updates, reminders)
- Firebase Push Notifications (FCM)
- Template-based messaging
- Gateway validation

## Tech Stack

- **Framework**: Express.js + TypeScript
- **Email**: Nodemailer
- **Push**: Firebase Cloud Messaging
- **Logging**: Winston

## Environment Variables

Create `.env` file:

```env
PORT=8003
NODE_ENV=development

# Gateway Secret (must match API Gateway)
GATEWAY_SECRET=your-gateway-secret

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Installation

```bash
npm install
npm run dev
```

## API Endpoints

### `POST /send-email`

Send an email notification

**Body:**

```json
{
  "to": "user@example.com",
  "subject": "Welcome to Evently",
  "text": "Plain text content",
  "html": "<h1>HTML content</h1>"
}
```

### `POST /send-push`

Send a push notification via FCM

**Body:**

```json
{
  "token": "firebase-device-token",
  "title": "New Event!",
  "body": "Check out this amazing event",
  "data": { "eventId": "123" }
}
```

### `GET /health`

Health check endpoint

## Scripts

```bash
npm run dev          # Development server
npm run build        # Build TypeScript
npm start           # Production server
```
