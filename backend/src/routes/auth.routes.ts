import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// POST /api/auth/login - เข้าสู่ระบบ (พร้อมตัวดักจับ Brute-Force Rate Limiter)
router.post('/login', authLimiter, login);

// GET /api/auth/me - ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน (ต้องมี Bearer Token)
router.get('/me', authenticateJWT, getMe);

export default router;
