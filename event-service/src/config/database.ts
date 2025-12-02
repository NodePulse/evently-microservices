import mongoose from "mongoose";
import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

const MONGODB_URI = process.env.MONGODB_URI || "";
// console.log(MONGODB_URI);

export const connectDatabase = async (retries = 5) => {
  try {
    mongoose.connection.on("connected", () => {
      logger.info("✅ MongoDB connected");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("❌ MongoDB connection error", { error: err });
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("⚠️ MongoDB disconnected");
    });

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info("✅ Connected to MongoDB", { database: "event_db" });
  } catch (error) {
    logger.error("❌ MongoDB connection failed", { error });
    console.log(`Failed to connect to MongoDB. Retries left: ${retries}`);

    if (retries > 0) {
      console.log("Retrying in 5 seconds...");
      setTimeout(() => connectDatabase(retries - 1), 5000);
    } else {
      console.log("Could not connect to MongoDB after multiple attempts.");
      // process.exit(1); // Optional: Exit if you want the container to restart
    }
  }
};

export default mongoose;
