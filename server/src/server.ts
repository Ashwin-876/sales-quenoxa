import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/environment.js';
import { initDatabase } from './db/database.js';
import { apiRouter } from './routes/api.js';

const app = express();

// Initialize DB schema & seeds
initDatabase();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Quenoxa AI Business Intelligence & Sales Automation Platform',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Mount versioned API routes
app.use('/api/v1', apiRouter);
// Fallback alias for unversioned /api calls
app.use('/api', apiRouter);

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: err?.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(config.port, () => {
  console.log(`================================================================`);
  console.log(`🚀 QUENOXA AI BUSINESS INTELLIGENCE PLATFORM RUNNING`);
  console.log(`📡 Backend API: http://localhost:${config.port}/api/v1`);
  console.log(`🏥 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`📁 Uploads Directory: ${config.uploadsDir}`);
  console.log(`💾 SQLite Database: ${config.dbPath}`);
  console.log(`================================================================`);
});

export default app;
