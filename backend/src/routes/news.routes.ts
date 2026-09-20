import { Router } from 'express';
import { getNewsList, getNewsById, createNews, updateNews, deleteNews, reorderNews, incrementNewsView } from '../controllers/news.controller.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/news - รายการข่าวสาร (รองรับ ?category=, ?page=, ?limit=)
router.get('/', getNewsList);

// PUT /api/news/reorder - ปรับลำดับการแสดงผลของข่าวสาร (เฉพาะ Super Admin)
router.put('/reorder', authenticateJWT, requireRole([Role.SUPER_ADMIN]), reorderNews);

// PATCH /api/news/:id/view - เพิ่มยอดวิวข่าว (+1)
router.patch('/:id/view', incrementNewsView);

// GET /api/news/:id - รายละเอียดข่าว และเพิ่มยอดวิวอัตโนมัติ
router.get('/:id', getNewsById);

// POST /api/news - เพิ่มข่าวสารใหม่ (เฉพาะ Super Admin)
router.post('/', authenticateJWT, requireRole([Role.SUPER_ADMIN]), createNews);

// PUT /api/news/:id - แก้ไขข้อมูลข่าวสาร (เฉพาะ Super Admin)
router.put('/:id', authenticateJWT, requireRole([Role.SUPER_ADMIN]), updateNews);

// DELETE /api/news/:id - ลบข่าวสาร (เฉพาะ Super Admin)
router.delete('/:id', authenticateJWT, requireRole([Role.SUPER_ADMIN]), deleteNews);

export default router;

