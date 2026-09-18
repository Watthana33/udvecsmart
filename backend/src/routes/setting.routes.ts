import { Router } from 'express';
import { getPublicSettings } from '../controllers/setting.controller.js';

const router = Router();

// GET /api/settings/public - ดึงค่าตั้งค่าระบบสาธารณะ
router.get('/public', getPublicSettings);

export default router;
