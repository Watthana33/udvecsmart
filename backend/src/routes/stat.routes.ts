import { Router } from 'express';
import { getStatsOverview, getStatsByInstitution } from '../controllers/stat.controller.js';

const router = Router();

// GET /api/stats/overview - สถิติภาพรวมทั้งจังหวัด
router.get('/overview', getStatsOverview);

// GET /api/stats/by-institution - สถิติเปรียบเทียบแยกรายสถานศึกษา
router.get('/by-institution', getStatsByInstitution);

export default router;
