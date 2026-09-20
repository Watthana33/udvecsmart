import { Router } from 'express';
import {
  getPublicSettings,
  updateSubmissionToggle,
  updateSubmissionPermissions,
  getAcademicPeriods,
  createAcademicPeriod,
  deleteAcademicPeriod,
  setCurrentAcademicPeriod,
  getVisitorCount,
  incrementVisitorCount,
} from '../controllers/setting.controller.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/settings/public - ดึงค่าตั้งค่าระบบสาธารณะ
router.get('/public', getPublicSettings);

// Visitor Count (สถิติผู้เข้าชมเว็บไซต์)
router.get('/visitor-count', getVisitorCount);
router.post('/visitor-count/increment', incrementVisitorCount);

// PUT /api/settings/submission-toggle - สลับสถานะเปิด-ปิดรับข้อมูล (เฉพาะ SUPER_ADMIN)
router.put('/submission-toggle', authenticateJWT, requireRole([Role.SUPER_ADMIN]), updateSubmissionToggle);

// PUT /api/settings/submission-permissions - ตั้งค่าเปิด-ปิดรายหมวด & แสงกระพริบ (เฉพาะ SUPER_ADMIN)
router.put('/submission-permissions', authenticateJWT, requireRole([Role.SUPER_ADMIN]), updateSubmissionPermissions);

// Academic Periods Management (รอบปีการศึกษาและภาคเรียน)
router.get('/academic-periods', getAcademicPeriods);
router.post('/academic-periods', authenticateJWT, requireRole([Role.SUPER_ADMIN]), createAcademicPeriod);
router.delete('/academic-periods/:id', authenticateJWT, requireRole([Role.SUPER_ADMIN]), deleteAcademicPeriod);
router.put('/academic-periods/:id/current', authenticateJWT, requireRole([Role.SUPER_ADMIN]), setCurrentAcademicPeriod);

export default router;



