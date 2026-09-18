import { Router } from 'express';
import {
  getStatsOverview,
  getStatsByInstitution,
  getMySchoolStat,
  submitSchoolStat,
  getSubmissionStatusList,
} from '../controllers/stat.controller.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/stats/overview - สถิติภาพรวมทั้งจังหวัด
router.get('/overview', getStatsOverview);

// GET /api/stats/by-institution - สถิติเปรียบเทียบแยกรายสถานศึกษา
router.get('/by-institution', getStatsByInstitution);

// GET /api/stats/my-school - ข้อมูลสถิติของวิทยาลัยตนเอง (สำหรับ School Admin)
router.get('/my-school', authenticateJWT, getMySchoolStat);

// POST /api/stats/submit - บันทึก/แก้ไขข้อมูลสถิติของวิทยาลัย (สำหรับ School Admin หรือ Super Admin)
router.post('/submit', authenticateJWT, submitSchoolStat);

// GET /api/stats/submission-status - รายชื่อสถานะการส่งข้อมูลของ 29 วิทยาลัย (เฉพาะ Super Admin)
router.get('/submission-status', authenticateJWT, requireRole([Role.SUPER_ADMIN]), getSubmissionStatusList);

export default router;

