import dotenv from "dotenv";
// Load environment variables FIRST before any other imports
dotenv.config();

import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/database";
import * as eventController from "./controller/eventController";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDatabase();

// Health check
app.get("/health", eventController.getHealth);

// Event routes
app.get("/count", eventController.getEventsCount);
app.get("/events", eventController.getAllEvents);
app.get("/events/:id", eventController.getEventById);
app.post("/events", eventController.createEvent);
app.get("/my-events", eventController.getMyEvents);

app.listen(PORT, () => {
  console.log(`🎉 Event Service running on port ${PORT}`);
});
