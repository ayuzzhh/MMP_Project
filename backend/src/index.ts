import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import apiRouter from './routes/apiRoutes';
import { testDbConnection } from './config/db';
import { initializeDatabaseSchema } from './config/initDb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

if (process.env.CORS_ORIGIN && !allowedOrigins.includes(process.env.CORS_ORIGIN)) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static File Storage for Uploaded Property Documents
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// System Health & Diagnostics
app.get('/api/health', async (req, res) => {
  const dbStatus = await testDbConnection();
  res.json({
    status: 'ONLINE',
    service: 'e-Stahl – Land Verification & Intelligence Platform',
    version: '1.0.0-prototype',
    environment: process.env.NODE_ENV || 'development',
    coverage: {
      state: 'Rajasthan',
      district: 'Kota',
      tehsil: 'Ladpura',
      village: 'Ranpur',
      pin_code: '325003',
      census_code: '03807600'
    },
    database: {
      engine: 'PostgreSQL + PostGIS',
      connected: dbStatus.connected,
      postgis_active: dbStatus.postgis,
      fallback_mode: !dbStatus.connected ? 'Active in-memory spatial fallback' : 'None'
    },
    timestamp: new Date().toISOString()
  });
});

// Mount Central API Router
app.use('/api', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.url}`
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(Number(PORT), '0.0.0.0', async () => {
    console.log(`=======================================================`);
    console.log(`🛡️  E-STAHL BACKEND SERVER ACTIVE ON PORT ${PORT}`);
    console.log(`📍 Scope: Ranpur Village, Ladpura, Kota (PIN 325003)`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
    await testDbConnection();
    await initializeDatabaseSchema();
  });
}

export default app;
