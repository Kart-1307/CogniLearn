import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './db';
import authRoutes from './routes/auth';
import studentRoutes from './routes/student';
import baselineRoutes from './routes/baseline';
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and high-limit JSON parsing for Base64 profile photo uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Cognilearn Backend API', timestamp: new Date() });
});

// Middleware to ensure DB connection is ready before processing API routes
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB Middleware Error]:', err);
    res.status(500).json({
      message: 'Database connection failed. Check MONGODB_URI & Atlas Network Access (0.0.0.0/0).',
      error: (err as Error).message,
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/baseline', baselineRoutes);
app.use('/api/user', userRoutes);

// Export Express app for Vercel Serverless deployment
export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Cognilearn Server] API running on http://localhost:${PORT}`);
  });
}
