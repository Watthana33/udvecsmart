import express, { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { getImage, uploadImage } from '../controllers/image.controller.js';
import { MAX_IMAGE_BYTES } from '../services/image.service.js';
import { uploadLimiter } from '../middlewares/rateLimit.js';

const router = Router();

// POST /api/images - อัปโหลดรูป (ไฟล์ดิบ ไม่เกิน 30MB) เฉพาะแอดมิน
router.post(
  '/',
  authenticateJWT,
  requireRole([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN]),
  uploadLimiter,
  express.raw({ type: () => true, limit: MAX_IMAGE_BYTES }),
  uploadImage
);

// GET /api/images/:id/:variant - แสดงรูป (thumb | display | original)
router.get('/:id/:variant', getImage);

export default router;
