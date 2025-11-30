import mongoose from "mongoose";
import logger from "../utils/logger.js";

export const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected successfully");
    return connection;
  } catch (error) {
    logger.error("MongoDB connection error", error);
    process.exit(1);
  }
};