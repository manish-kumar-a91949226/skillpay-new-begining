import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    console.log(`[db] connected -> ${mongoose.connection.name}`);
  } catch (err) {
    console.error("[db] connection failed:", err.message);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] disconnected");
  });
}
