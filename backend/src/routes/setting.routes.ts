import { Router } from 'express';
import { getPublicSettings, updateSubmissionToggle } from '../controllers/setting.controller.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/settings/public - ดึงค่าตั้งค่าระบบสาธารณะ
router.get('/public', getPublicSettings);

// PUT /api/settings/submission-toggle - สลับสถานะเปิด-ปิดรับข้อมูล (เฉพาะ SUPER_ADMIN)
router.put('/submission-toggle', authenticateJWT, requireRole([Role.SUPER_ADMIN]), updateSubmissionToggle);

export default router;

