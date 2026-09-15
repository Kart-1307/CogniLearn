import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getSupabase } from './supabase';
import authRoutes from './routes/auth';
import studentRoutes from './routes/student';
import baselineRoutes from './routes/baseline';
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable CORS and high-limit JSON parsing for Base64 profile photo uploads
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Supabase backend or log in-memory mode
getSupabase();

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Cognilearn Backend API', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/baseline', baselineRoutes);
app.use('/api/user', userRoutes);

async function startServer() {
  // Vite middleware for development / Static serve for production
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n[Cognilearn Server] API & Frontend running:`);
      console.log(`  ➜  Local:   http://localhost:${PORT}/`);
      console.log(`  ➜  Network: http://127.0.0.1:${PORT}/\n`);
    });
  }
}

startServer();

export default app;
