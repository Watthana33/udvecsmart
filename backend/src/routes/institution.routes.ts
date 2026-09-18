import { Router } from 'express';
import { getInstitutions, getInstitutionById } from '../controllers/institution.controller.js';

const router = Router();

// GET /api/institutions - รายชื่อสถานศึกษาทั้งหมด (รองรับ ?search= และ ?type=)
router.get('/', getInstitutions);

// GET /api/institutions/:id - รายละเอียดสถานศึกษา 1 แห่ง
router.get('/:id', getInstitutionById);

export default router;
