import mongoose from 'mongoose';
import dns from 'dns';

let cachedConn: typeof mongoose | null = null;

export const connectDB = async () => {
  // If connection is already established, reuse it (essential for serverless)
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedConn && mongoose.connection.readyState !== 0) {
    return cachedConn.connection;
  }

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('[MongoDB Atlas Error]: MONGODB_URI is not defined in environment variables.');
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  // Only apply custom DNS overrides in local development
  if (process.env.NODE_ENV !== 'production') {
    try {
      dns.setDefaultResultOrder?.('ipv4first');
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (e) {
      // Ignore local DNS override errors
    }
  }

  try {
    cachedConn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB Atlas] Connected successfully to host: ${cachedConn.connection.host}`);
    return cachedConn.connection;
  } catch (error) {
    console.error(`[MongoDB Atlas Connection Failed]: ${(error as Error).message}`);
    throw error;
  }
};
