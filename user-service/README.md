# User Service

The **User Service** is a core microservice in the Evently architecture, responsible for user authentication, registration, profile management, and session handling. It is built with **Express.js** and uses **Prisma** for database interactions.

## 🚀 Tech Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: JWT (JSON Web Tokens)
- **Logging**: Winston

## 🛠️ Prerequisites

- Node.js (v18+)
- PostgreSQL
- npm or yarn

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=8001
NODE_ENV=development # or production

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/evently_user?schema=public"

# JWT Secrets
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Email Configuration (for OTPs)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# Frontend URL (for CORS/Cookies)
FRONTEND_URL=http://localhost:3000
```

## 📦 Installation & Running

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Generate Prisma Client:**

    ```bash
    npx prisma generate
    ```

3.  **Run Database Migrations:**

    ```bash
    npx prisma migrate dev
    ```

4.  **Start Development Server:**

    ```bash
    npm run dev
    ```

5.  **Build & Start Production:**
    ```bash
    npm run build
    npm start
    ```

## 🔌 API Endpoints

### Authentication (`/auth`)

| Method | Endpoint                  | Description                   | Auth Required |
| :----- | :------------------------ | :---------------------------- | :------------ |
| `POST` | `/register`               | Register a new user           | No            |
| `POST` | `/login`                  | Login user (sets cookies)     | No            |
| `POST` | `/logout`                 | Logout user (clears cookies)  | No            |
| `POST` | `/change-password`        | Change current password       | **Yes**       |
| `POST` | `/forgot-password`        | Request password reset OTP    | No            |
| `POST` | `/verify-otp`             | Verify OTP for password reset | No            |
| `POST` | `/change-forgot-password` | Reset password using OTP      | No            |

### Profile (`/profile`)

| Method | Endpoint   | Description              | Auth Required |
| :----- | :--------- | :----------------------- | :------------ |
| `GET`  | `/details` | Get current user profile | **Yes**       |

## 🔒 Authentication Flow

1.  **Login/Register**: The service validates credentials and sets two cookies:
    - `accessToken`: HTTP-only, contains the JWT.
    - `session`: Non-HTTP-only, contains user details (JSON) for frontend state.
2.  **Protected Routes**: The `authenticate` middleware checks for the JWT in the `Authorization` header or `accessToken`/`session` cookies.
3.  **Session Persistence**: The frontend reads the `session` cookie to maintain user state on reload.

## 📂 Project Structure

```
src/
├── config/         # Environment configuration
├── controllers/    # Request handlers (Auth, Profile)
├── middleware/     # Express middleware (Auth, Error, Logger)
├── routes/         # API route definitions
├── services/       # Business logic
├── utils/          # Utility functions (Logger, AppError)
├── app.ts          # Express app setup
└── server.ts       # Server entry point
```
