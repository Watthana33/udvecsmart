import { Router } from 'express';
import { submitContactMessage } from '../controllers/contact.controller.js';
import { contactLimiter } from '../middlewares/rateLimit.js';

const router = Router();

// POST /api/contact - ส่งข้อความติดต่อ
router.post('/', contactLimiter, submitContactMessage);

export default router;
