import dotenv from "dotenv";
// Load environment variables FIRST before any other imports
dotenv.config();

import express from "express";
import morgan from "morgan";

import {
  initializeDatabase,
  checkDatabaseHealth,
  testDatabaseConnection,
} from "./config/d1.config";
import eventRoutes from "./routes/event.routes";
import { validateGatewayRequest } from "./middleware/gateway.middleware";
import { rabbitMQService } from "./services/rabbitmq.service";
import { startTicketWorker } from "./services/ticketWorker";
import ticketRoutes from "./routes/ticket.routes";
import { userRepository } from "./repositories/user.repository";

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Gateway validation - Only allow requests from API Gateway
app.use(validateGatewayRequest);

// Initialize D1 database and test connection
const initializeApp = async () => {
  try {
    console.log("🔧 Initializing Event Service...\n");

    // Initialize D1 client
    initializeDatabase();

    // Test database connectivity
    await testDatabaseConnection();

    // Initialize RabbitMQ
    await rabbitMQService.connect().catch((err) => {
      console.error("⚠️ Failed to connect to RabbitMQ:", err.message);
    });

    // Start background workers
    // Dynamic import to avoid circular dependency issues if any, or just standard import
    // Assuming startTicketWorker is imported at the top
    await startTicketWorker();

    await rabbitMQService.consume("user-creation", async (message: any) => {
      await userRepository.addNewUser(message);
    });

    console.log("\n✅ Database & Messaging initialization complete!");
  } catch (error) {
    console.error("\n❌ Failed to initialize database:", error);
    console.error("\n⚠️  Server will start but database operations will fail.");
    console.error("Please check your .env file has correct D1 credentials:\n");
    console.error("  - CLOUDFLARE_ACCOUNT_ID");
    console.error("  - D1_DATABASE_ID");
    console.error("  - CLOUDFLARE_API_TOKEN\n");
  }
};

// Health Check (defined before routes to ensure it's accessible)
app.get("/health", async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 200 : 503,
    message: dbHealthy
      ? "Event Service is running"
      : "Event Service degraded - Database unavailable",
    database: dbHealthy ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/event", eventRoutes);
app.use("/ticket", ticketRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`\n🎉 Event Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health\n`);

  // Initialize database connection
  await initializeApp();
});
