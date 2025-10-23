import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.info("Mongodb connected");
  } catch (error) {
    console.error(`Mongodb connecting error: ${error}`);
    process.exit(1); // 1 status code means fail, 0 means success
  }
};
