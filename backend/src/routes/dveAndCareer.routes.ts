import { Router } from 'express';
import {
  getDveDepartments,
  saveDveDepartments,
  getCareerClassrooms,
  saveCareerClassrooms,
  getDveAndCareerSummary,
} from '../controllers/dveAndCareer.controller.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// สาธารณะ: ดึงข้อมูลสรุปทวิภาคีและห้องเรียนอาชีพสำหรับแดชบอร์ด
router.get('/summary', getDveAndCareerSummary);

// แผนกวิชาทวิภาคี (DVE Departments)
router.get('/departments', getDveDepartments);
router.post(
  '/departments',
  authenticateJWT,
  requireRole([Role.SCHOOL_ADMIN, Role.SUPER_ADMIN]),
  saveDveDepartments
);

// ห้องเรียนอาชีพ (Career Classrooms)
router.get('/career-classrooms', getCareerClassrooms);
router.post(
  '/career-classrooms',
  authenticateJWT,
  requireRole([Role.SCHOOL_ADMIN, Role.SUPER_ADMIN]),
  saveCareerClassrooms
);

export default router;
