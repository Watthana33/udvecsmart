import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { loginThrottle } from '../middlewares/rateLimit.js';
import { checkPasswordLink, usePasswordLink } from '../controllers/passwordLink.controller.js';

const router = Router();

// POST /api/auth/login - เข้าสู่ระบบ
router.post('/login', loginThrottle, login);

// ลิงก์ตั้งรหัสผ่าน (สาธารณะ ไม่จำกัดต่อ IP — โทเคนสุ่ม 256 บิต เดาไม่ได้อยู่แล้ว)
router.post('/password-link/check', checkPasswordLink);
router.post('/password-link/use', usePasswordLink);

// GET /api/auth/me - ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน (ต้องมี Bearer Token)
router.get('/me', authenticateJWT, getMe);

export default router;
