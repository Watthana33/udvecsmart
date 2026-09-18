import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// POST /api/auth/login - เข้าสู่ระบบ
router.post('/login', login);

// GET /api/auth/me - ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน (ต้องมี Bearer Token)
router.get('/me', authenticateJWT, getMe);

export default router;
