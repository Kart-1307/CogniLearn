import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { getSupabase } from './supabase';
import authRoutes from './routes/auth';
import studentRoutes from './routes/student';
import baselineRoutes from './routes/baseline';
import userRoutes from './routes/user';
import reportRoutes from './routes/report';

const isProd = process.env.NODE_ENV === 'production';

// Fail-Fast: Refuse to boot in production with missing or default security secrets
if (isProd) {
  const missing: string[] = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('super_secret_jwt_key_2026')) {
    missing.push('JWT_SECRET (secure non-default key required)');
  }
  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    console.error('\n❌ [FATAL SECURITY MISCONFIGURATION]: Production boot halted. Missing required environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('In-memory fallback and default secrets are strictly prohibited in production.\n');
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable CORS and restrict JSON payload to 100KB to protect against payload-bloat DoS
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true }));

// Initialize Supabase backend
getSupabase();

// Rate Limiters to defend against brute force & API credit exhaustion
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour per IP
  message: { error: 'Diagnostic report rate limit reached (20/hour). Please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters to sensitive endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/report/generate-ai', aiReportLimiter);

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Cognilearn Backend API', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/baseline', baselineRoutes);
app.use('/api/user', userRoutes);
app.use('/api/report', reportRoutes);

async function startServer() {
  // Vite middleware for local development / Static serve for production Node
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('[Vite Dev Middleware Warning]:', e);
    }
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
