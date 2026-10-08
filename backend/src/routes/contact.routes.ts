import { Router } from 'express';
import { submitContactMessage } from '../controllers/contact.controller.js';
import { contactLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// POST /api/contact - ส่งข้อความติดต่อ (พร้อมตัวดักจับ Spam Bot Rate Limiter)
router.post('/', contactLimiter, submitContactMessage);

export default router;
