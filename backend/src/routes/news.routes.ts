import { Router } from 'express';
import { getNewsList, getNewsById, createNews, deleteNews, reorderNews } from '../controllers/news.controller.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/news - รายการข่าวสาร (รองรับ ?category=, ?page=, ?limit=)
router.get('/', getNewsList);

// PUT /api/news/reorder - ปรับลำดับการแสดงผลของข่าวสาร (เฉพาะ Super Admin)
router.put('/reorder', authenticateJWT, requireRole([Role.SUPER_ADMIN]), reorderNews);

// GET /api/news/:id - รายละเอียดข่าว และเพิ่มยอดวิวอัตโนมัติ
router.get('/:id', getNewsById);

// POST /api/news - เพิ่มข่าวสารใหม่ (เฉพาะ Super Admin)
router.post('/', authenticateJWT, requireRole([Role.SUPER_ADMIN]), createNews);

// DELETE /api/news/:id - ลบข่าวสาร (เฉพาะ Super Admin)
router.delete('/:id', authenticateJWT, requireRole([Role.SUPER_ADMIN]), deleteNews);

export default router;

