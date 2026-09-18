import { Router } from 'express';
import { getNewsList, getNewsById } from '../controllers/news.controller.js';

const router = Router();

// GET /api/news - รายการข่าวสาร (รองรับ ?category=, ?page=, ?limit=)
router.get('/', getNewsList);

// GET /api/news/:id - รายละเอียดข่าว และเพิ่มยอดวิวอัตโนมัติ
router.get('/:id', getNewsById);

export default router;
