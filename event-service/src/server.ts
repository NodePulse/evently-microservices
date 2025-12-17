import dotenv from "dotenv";
// Load environment variables FIRST before any other imports
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/database";
import eventRoutes from "./routes/event.routes";
import { validateGatewayRequest } from "./middleware/gateway.middleware";

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Gateway validation - Only allow requests from API Gateway
app.use(validateGatewayRequest);

// Connect to MongoDB
connectDatabase();

// Health Check (defined before routes to ensure it's accessible)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Event Service is running",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/", eventRoutes);

app.listen(PORT, () => {
  console.log(`🎉 Event Service running on port ${PORT}`);
});
