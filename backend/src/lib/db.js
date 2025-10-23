import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const { MONGO_URI } = process.env;
    if (!MONGO_URI) throw new Error("MONGO_URI is not set")
    await mongoose.connect(MONGO_URI);
    console.info("Mongodb connected");
  } catch (error) {
    console.error(`Mongodb connecting error: ${error}`);
    process.exit(1); // 1 status code means fail, 0 means success
  }
};
