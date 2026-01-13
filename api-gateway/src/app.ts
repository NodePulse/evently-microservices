import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { setupProxies } from "./middleware/proxy";
import { loginRateLimiter, otpRateLimiter } from "./middleware/rateLimit";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { extractUserFromJWT } from "./middleware/auth.middleware";

const app = express();

import { v4 as uuidv4 } from "uuid";
import { responseBuilder } from "./utils/responseBuilder";
import path from "path";

// Middleware
app.use(helmet());

// Capture start time and generate request ID
app.use((req, res, next) => {
  req.startTime = process.hrtime();
  req.id = uuidv4();
  next();
});

// Cookie parser MUST come before auth middleware
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// JWT extraction - extracts user info from cookie if present
app.use(extractUserFromJWT);
app.use(
  morgan((tokens: any, req: any, res: any) => {
    const method = tokens.method(req, res);
    const url = tokens.url(req, res);
    const status = tokens.status(req, res);
    const responseTime = tokens["response-time"](req, res);
    const contentLength = tokens.res(req, res, "content-length");

    const statusCode = status ? parseInt(status, 10) : 0;
    const statusColor =
      statusCode >= 500
        ? 31 // Red
        : statusCode >= 400
        ? 33 // Yellow
        : statusCode >= 300
        ? 36 // Cyan
        : 32; // Green

    return [
      `\x1b[34m${method}\x1b[0m`,
      url,
      `\x1b[${statusColor}m${status}\x1b[0m`,
      `\x1b[35m${responseTime} ms\x1b[0m`,
      "-",
      contentLength,
    ].join(" ");
  })
);

// Health Check
app.get("/health", (req: any, res) => {
  const response = responseBuilder
    .createBuilder(req.id, req.startTime, req)
    .status(200)
    .withMessage("API Gateway is running")
    .withData({
      message: "healthy",
      timestamp: new Date().toISOString(),
    })
    .withRequestContext({
      path: req.path,
      method: req.method,
    })
    .build();

  res.status(200).json(response);
});

// Serve favicon
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "favicon.ico"));
});

// Swagger API Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: `
    .swagger-ui .topbar { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-bottom: 3px solid #5a67d8;
      padding: 20px 0;
    }
    .swagger-ui .topbar .topbar-wrapper { 
      max-width: 1460px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      flex-direction: row-reverse;
    }
    .swagger-ui .topbar .topbar-wrapper .link { 
      display: none;
    }
    .swagger-ui .topbar .topbar-wrapper::after {
      content: "🎉 Evently API Gateway";
      font-size: 24px;
      font-weight: bold;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
      display: block;
      padding: 10px 20px;
    }
    .swagger-ui .info .title {
      font-size: 36px;
      color: #667eea;
      font-weight: 700;
    }
    .swagger-ui .info .title small {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 14px;
      margin-left: 10px;
    }
    .swagger-ui .info .title small pre {
      color: white;
      background: transparent;
    }
    .swagger-ui .scheme-container {
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  `,
    customSiteTitle: "Evently API Documentation",
    customfavIcon: "/favicon.ico",
  })
);

// Rate Limiting
// Rate Limiting
app.use("/api/v1/user/auth/login", express.json(), loginRateLimiter);
app.use("/api/v1/user/auth/forgot-password", express.json(), otpRateLimiter);

// Setup Proxies
setupProxies(app);

// Global Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Gateway Error:", err);
    res.status(err.status || 500).json({
      status: err.status || 500,
      message: err.message || "Internal Server Error",
    });
  }
);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: "Route not found",
  });
});

export default app;
