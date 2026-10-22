import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import {
  getSystemStatus,
  checkSystemUpdate,
  getSystemHealth,
  startSystemUpgrade,
  startSystemRollback,
} from '../controllers/system.controller.js';

const router = Router();

// ทุกเส้นทางเฉพาะผู้ดูแลระบบ สอจ. (SUPER_ADMIN) เท่านั้น
router.use(authenticateJWT, requireRole([Role.SUPER_ADMIN]));

router.get('/status', getSystemStatus);
router.post('/check', checkSystemUpdate);
router.get('/health', getSystemHealth);
router.post('/upgrade', startSystemUpgrade);
router.post('/rollback', startSystemRollback);

export default router;
