import express, { Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { prisma } from './config/prisma.js';
import authRoutes from './routes/auth.routes.js';
import institutionRoutes from './routes/institution.routes.js';
import statRoutes from './routes/stat.routes.js';
import newsRoutes from './routes/news.routes.js';
import settingRoutes from './routes/setting.routes.js';
import contactRoutes from './routes/contact.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);

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
