import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import { prisma } from './config/prisma.js';
import authRoutes from './routes/auth.routes.js';
import institutionRoutes from './routes/institution.routes.js';
import statRoutes from './routes/stat.routes.js';
import newsRoutes from './routes/news.routes.js';
import settingRoutes from './routes/setting.routes.js';
import contactRoutes from './routes/contact.routes.js';
import userRoutes from './routes/user.routes.js';
import dveAndCareerRoutes from './routes/dveAndCareer.routes.js';
import imageRoutes from './routes/image.routes.js';
import systemRoutes from './routes/system.routes.js';
import { reconcileOnBoot } from './services/selfUpdate.js';
import { apiLimiter } from './middlewares/rateLimit.js';

const app = express();

// อยู่หลัง nginx (frontend container) ให้ req.ip เป็น IP ผู้ใช้จาก X-Forwarded-For
app.set('trust proxy', 1);

// Middlewares
// Security headers สำหรับ API/รูป (ส่วนของหน้าเว็บตั้งที่ nginx ของ frontend) — ปิด HSTS เพราะตอนนี้ยังใช้ผ่าน HTTP ในวงแลน
app.use(
  helmet({
    hsts: false,
    // รูปที่ /api/images แสดงในหน้าเว็บเดียวกัน (same-origin) จึงไม่ต้องเปิดให้ฝังข้ามเว็บ
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

// CORS: หน้าเว็บเรียก API แบบ same-origin ผ่าน nginx (/api) จึง "ไม่ต้องใช้ CORS"
// อนุญาตข้ามที่มาเฉพาะ: โดเมนที่ระบุใน CORS_ORIGIN (คั่นด้วยจุลภาค) และเครือข่ายภายใน (localhost, วงแลน, Tailscale) ช่วงพัฒนา
// (ค่า '*' เดิมถูกตีความเป็น "เฉพาะเครือข่ายภายใน" ไม่ใช่เปิดทุกโดเมน)
const allowedOrigins = ENV.CORS_ORIGIN.split(',').map((o) => o.trim()).filter((o) => o && o !== '*');
const PRIVATE_HOST_RE =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d+\.\d+|[^.]+\.local|[^.]+\.ts\.net)$/i;

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  try {
    return PRIVATE_HOST_RE.test(new URL(origin).hostname);
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
    credentials: true,
  })
);
// ข้อมูล JSON ปกติเล็กมาก (รูปส่งผ่าน /api/images แยกต่างหาก) จึงจำกัด 2MB
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// กันการเรียก API ถี่ผิดปกติจาก IP เดียว (ช่องทางสำคัญมีตัวจำกัดเฉพาะของตัวเองเพิ่มเติม)
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dve-career', dveAndCareerRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/system', systemRoutes);


// Healthcheck & Database connection test
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    // ทดสอบ query Database จริงใน Docker
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'UDPVECSmart API',
      version: process.env.APP_VERSION || 'baked',
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

// จัดการ error ที่หลุดมา (เช่น ไฟล์ใหญ่เกินกำหนด) ให้ตอบเป็น JSON พร้อมสาเหตุ แทนหน้า HTML
app.use((err: any, _req: Request, res: Response, next: express.NextFunction) => {
  if (res.headersSent) return next(err);
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ status: 'error', message: 'ข้อมูลที่ส่งมาใหญ่เกินกำหนด (ข้อมูลทั่วไปไม่เกิน 2MB, รูปภาพอัปโหลดผ่านระบบรูปได้ไม่เกิน 50MB)' });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ status: 'error', message: 'รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดภายในระบบ' });
});

// Start Server
const server = app.listen(ENV.PORT, () => {
  console.log(`🚀 UDPVECSmart Server is running on http://localhost:${ENV.PORT}`);
  console.log(`🩺 Healthcheck available at: http://localhost:${ENV.PORT}/api/health`);
  // สรุปผลงานอัปเดต/ย้อนคืนที่ค้างข้ามการรีสตาร์ต (ไม่ทำอะไรถ้าไม่ได้เปิดโหมดอัปเดตตัวเอง)
  if (process.env.PORT === undefined || Number(process.env.PORT) !== 5099) void reconcileOnBoot();
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
