import { Router } from 'express';
import { submitContactMessage } from '../controllers/contact.controller.js';

const router = Router();

// POST /api/contact - ส่งข้อความติดต่อ
router.post('/', submitContactMessage);

export default router;
