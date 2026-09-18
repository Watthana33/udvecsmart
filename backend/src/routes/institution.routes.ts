import { Router } from 'express';
import {
  getInstitutions,
  getInstitutionById,
  updateInstitutionDirector,
  createInstitution,
} from '../controllers/institution.controller.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/institutions - รายชื่อสถานศึกษาทั้งหมด (รองรับ ?search= และ ?type=)
router.get('/', getInstitutions);

// GET /api/institutions/:id - รายละเอียดสถานศึกษา 1 แห่ง
router.get('/:id', getInstitutionById);

// PATCH /api/institutions/:id/director - อัปเดตข้อมูลผู้บริหาร / ภาพถ่าย / ข้อมูลติดต่อ (SUPER_ADMIN หรือเจ้าของสถานศึกษา)
router.patch('/:id/director', authenticateJWT, updateInstitutionDirector);

// POST /api/institutions - เพิ่มสถานศึกษาใหม่ (เฉพาะ SUPER_ADMIN)
router.post('/', authenticateJWT, requireRole([Role.SUPER_ADMIN]), createInstitution);

export default router;
