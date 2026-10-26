import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';
import { createPasswordLink } from '../controllers/passwordLink.controller.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// ทุกเส้นทางของการจัดการผู้ใช้งานต้องเป็น SUPER_ADMIN เท่านั้น
router.use(authenticateJWT, requireRole([Role.SUPER_ADMIN]));

// GET /api/users - รายชื่อผู้ใช้งานทั้งหมด
router.get('/', getUsers);

// POST /api/users - เพิ่มผู้ใช้งานใหม่
router.post('/', createUser);

// PUT /api/users/:id - แก้ไขข้อมูลผู้ใช้งาน
router.put('/:id', updateUser);

// POST /api/users/:id/password-link - สร้างลิงก์ให้ผู้ใช้ตั้งรหัสผ่านเอง
router.post('/:id/password-link', createPasswordLink);

// DELETE /api/users/:id - ลบผู้ใช้งาน
router.delete('/:id', deleteUser);

export default router;
