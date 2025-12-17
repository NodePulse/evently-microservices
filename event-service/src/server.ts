import dotenv from "dotenv";
// Load environment variables FIRST before any other imports
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/database";
import eventRoutes from "./routes/event.routes";

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDatabase();

// Routes
app.use("/", eventRoutes);

app.listen(PORT, () => {
  console.log(`🎉 Event Service running on port ${PORT}`);
});
