import mongoose from "mongoose";
import { ENV } from './env.js'

export const connectDB = async () => {
  try {
    const { MONGO_URI } = ENV;
    if (!MONGO_URI) throw new Error("MONGO_URI is not set")
    await mongoose.connect(MONGO_URI);
    console.info("Mongodb connected");
  } catch (error) {
    console.error(`Mongodb connecting error: ${error}`);
    process.exit(1); // 1 status code means fail, 0 means success
  }
};
