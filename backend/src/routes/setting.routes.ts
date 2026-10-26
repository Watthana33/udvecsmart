import { Router } from 'express';
import {
  getPublicSettings,
  updateSubmissionToggle,
  updateSubmissionPermissions,
  updateAppearanceSettings,
  getAcademicPeriods,
  createAcademicPeriod,
  deleteAcademicPeriod,
  setCurrentAcademicPeriod,
  getVisitorCount,
  incrementVisitorCount,
  setVisitorCount,
  getWelcomeImage,
  getBannerImage,
  updateBanner,
  updateBanners,
  updateContactInfo,
  updateOicStructure,
} from '../controllers/setting.controller.js';
import { getFacebook, updateFacebook, clearFacebookToken, syncFacebook, testFacebook } from '../controllers/facebook.controller.js';
import { authenticateJWT, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/settings/public - ดึงค่าตั้งค่าระบบสาธารณะ
router.get('/public', getPublicSettings);

// Visitor Count (สถิติผู้เข้าชมเว็บไซต์)
router.get('/visitor-count', getVisitorCount);
router.post('/visitor-count/increment', incrementVisitorCount);
router.put('/visitor-count', authenticateJWT, requireRole([Role.SUPER_ADMIN]), setVisitorCount);

// รูปหน้าข่าวสาร/แบนเนอร์ (ส่งเป็นไฟล์ภาพ แยกจาก /public เพื่อให้ cache ได้และไม่หนักทุกครั้งที่เปิดเว็บ)
router.get('/welcome-image', getWelcomeImage);
router.get('/banner-image', getBannerImage);

// ตั้งแบนเนอร์ / ข้อมูลติดต่อ (เฉพาะ SUPER_ADMIN)
router.put('/banner', authenticateJWT, requireRole([Role.SUPER_ADMIN]), updateBanner);
router.put('/banners', authenticateJWT, requireRole([Role.SUPER_ADMIN]), updateBanners);
router.put('/contact-info', authenticateJWT, requireRole([Role.SUPER_ADMIN]), updateContactInfo);
// หน้าโครงสร้าง สอจ.: เปิดให้แก้ได้โดยไม่ต้องล็อกอินและไม่จำกัดจำนวนครั้ง (ผู้ใช้สั่ง; เว็บยังไม่เผยแพร่)
router.put('/oic-structure', updateOicStructure);

// Facebook Page: ตั้งค่า / ดึงข่าว (เฉพาะ SUPER_ADMIN)
const superAdminOnly = [authenticateJWT, requireRole([Role.SUPER_ADMIN])];
router.get('/facebook', ...superAdminOnly, getFacebook);
router.put('/facebook', ...superAdminOnly, updateFacebook);
router.delete('/facebook/token', ...superAdminOnly, clearFacebookToken);
router.post('/facebook/sync', ...superAdminOnly, syncFacebook);
router.post('/facebook/test', ...superAdminOnly, testFacebook);

// PUT /api/settings/submission-toggle - สลับสถานะเปิด-ปิดรับข้อมูล (เฉพาะ SUPER_ADMIN)
router.put('/submission-toggle', authenticateJWT, requireRole([Role.SUPER_ADMIN]), updateSubmissionToggle);

// PUT /api/settings/submission-permissions - ตั้งค่าเปิด-ปิดรายหมวด & แสงกระพริบ (เฉพาะ SUPER_ADMIN)
router.put('/submission-permissions', authenticateJWT, requireRole([Role.SUPER_ADMIN]), updateSubmissionPermissions);

// PUT /api/settings/appearance - ธีมไว้อาลัย & หน้าข่าวสารก่อนเข้าเว็บ (เฉพาะ SUPER_ADMIN)
router.put('/appearance', authenticateJWT, requireRole([Role.SUPER_ADMIN]), updateAppearanceSettings);

// Academic Periods Management (รอบปีการศึกษาและภาคเรียน)
router.get('/academic-periods', getAcademicPeriods);
router.post('/academic-periods', authenticateJWT, requireRole([Role.SUPER_ADMIN]), createAcademicPeriod);
router.delete('/academic-periods/:id', authenticateJWT, requireRole([Role.SUPER_ADMIN]), deleteAcademicPeriod);
router.put('/academic-periods/:id/current', authenticateJWT, requireRole([Role.SUPER_ADMIN]), setCurrentAcademicPeriod);

export default router;



