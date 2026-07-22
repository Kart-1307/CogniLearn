import mongoose from 'mongoose';
import dns from 'dns';

// Fix Windows / local ISP DNS SRV lookup failure for mongodb+srv://
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS fails
}

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cognilearn';
  
  try {
    // Disable Mongoose query buffering so operations fail instantly with clear error instead of hanging 10s
    mongoose.set('bufferCommands', false);

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Atlas Connection Failed]: ${(error as Error).message}`);
    console.warn(`--------------------------------------------------------------------------------`);
    console.warn(`[MongoDB Atlas Setup Check]:`);
    console.warn(`1. CLUSTER URI: In Atlas Dashboard -> Database -> Connect -> Drivers, double-check`);
    console.warn(`   that "cognilearn.lf4bd8r.mongodb.net" is the EXACT cluster string from Atlas.`);
    console.warn(`--------------------------------------------------------------------------------`);
  }
};
