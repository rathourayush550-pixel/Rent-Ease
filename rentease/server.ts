import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import authRoutes from './backend/routes/authRoutes.ts';
import propertyRoutes from './backend/routes/propertyRoutes.ts';
import bookingRoutes from './backend/routes/bookingRoutes.ts';
import rentalRoutes from './backend/routes/rentalRoutes.ts';
import paymentRoutes from './backend/routes/paymentRoutes.ts';
import maintenanceRoutes from './backend/routes/maintenanceRoutes.ts';
import reviewRoutes from './backend/routes/reviewRoutes.ts';
import messageRoutes from './backend/routes/messageRoutes.ts';
import notificationRoutes from './backend/routes/notificationRoutes.ts';
import adminRoutes from './backend/routes/adminRoutes.ts';
import { getDatabase, flushDatabaseSync } from './backend/database/db.ts';
import { corsMiddleware, securityHeaders } from './backend/middleware/security.ts';
import { apiRateLimiter } from './backend/middleware/rateLimiter.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize and warm up database persistence
  const db = getDatabase();

  // Trust proxy for secure headers behind Cloud Run / reverse proxies
  app.set('trust proxy', 1);

  // Core Security & CORS Middlewares
  app.use(securityHeaders);
  app.use(corsMiddleware);

  // Request body parsing with defensive limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // General API rate limiter
  app.use('/api', apiRateLimiter);

  // Production-Ready Comprehensive Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    const memory = process.memoryUsage();
    res.json({
      status: 'ok',
      service: 'RentEase Enterprise Property Management API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      system: {
        node_version: process.version,
        memory_mb: Math.round(memory.heapUsed / 1024 / 1024),
      },
      database: {
        status: 'healthy',
        persistence: 'atomic_filesystem_sync',
        metrics: {
          users: db.users.length,
          properties: db.properties.length,
          active_rentals: db.rentals.filter((r) => r.status === 'active').length,
          bookings: db.bookings.length,
          invoices: db.payments.length,
        },
      },
    });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/rentals', rentalRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/maintenance', maintenanceRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);

  // Fallback for unhandled /api/* endpoints
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `API route ${req.method} ${req.originalUrl} does not exist.`,
    });
  });

  // Global Error Handler for API routes
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err);
    const statusCode = typeof err.status === 'number' && err.status >= 400 ? err.status : 500;
    res.status(statusCode).json({
      success: false,
      message: statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error occurred.'
        : err.message || 'Internal server error.',
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RentEase] Server live and listening on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    console.log(`[RentEase] Received ${signal}. Gracefully flushing database and shutting down...`);
    try {
      flushDatabaseSync();
    } catch (err) {
      console.error('Error during database flush on shutdown:', err);
    }
    server.close(() => {
      console.log('[RentEase] HTTP server closed. Exiting process.');
      process.exit(0);
    });

    // Force exit if hanging
    setTimeout(() => {
      console.error('[RentEase] Forced shutdown after timeout.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  console.error('[RentEase] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[RentEase] Uncaught Exception:', err);
  try {
    flushDatabaseSync();
  } catch {
    // Ignore secondary errors
  }
});

startServer().catch((err) => {
  console.error('[RentEase] Critical failure during server start:', err);
});
