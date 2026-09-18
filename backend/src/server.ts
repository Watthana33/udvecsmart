import express, { Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { prisma } from './config/prisma.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);

// Healthcheck & Database connection test
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    // ทดสอบ query Database จริงใน Docker
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'UDPVECSmart API',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        type: 'PostgreSQL (Docker)',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      service: 'UDPVECSmart API',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to UDPVECSmart Backend API',
    docs: '/api/health',
  });
});

// Start Server
const server = app.listen(ENV.PORT, () => {
  console.log(`🚀 UDPVECSmart Server is running on http://localhost:${ENV.PORT}`);
  console.log(`🩺 Healthcheck available at: http://localhost:${ENV.PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and Prisma client...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server and Prisma closed.');
    process.exit(0);
  });
});

export default app;
