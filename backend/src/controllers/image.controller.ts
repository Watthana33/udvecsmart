import { Request, Response } from 'express';
import fs from 'fs/promises';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import {
  IMAGE_VARIANTS,
  ImageUploadError,
  ImageVariant,
  imageUrls,
  resolveImageFile,
  saveUploadedImage,
} from '../services/image.service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * อัปโหลดรูป (ไฟล์ดิบเป็น request body; ชื่อไฟล์เดิมส่งใน header X-Filename แบบ encodeURIComponent)
 * POST /api/images   (SUPER_ADMIN / SCHOOL_ADMIN, ไม่เกิน 50MB)
 */
export async function uploadImage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const body = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      res.status(400).json({ status: 'error', message: 'ไม่พบไฟล์รูปภาพ (ต้องส่งไฟล์รูปเป็น request body ชนิด image/*)' });
      return;
    }

    let name: string | undefined;
    const header = req.headers['x-filename'];
    if (typeof header === 'string') {
      try {
        name = decodeURIComponent(header);
      } catch {
        name = undefined;
      }
    }

    const saved = await saveUploadedImage(body, name, req.user?.userId);
    res.status(201).json({ status: 'success', data: saved });
  } catch (error: any) {
    if (error instanceof ImageUploadError) {
      res.status(error.status).json({ status: 'error', message: error.message });
      return;
    }
    console.error('uploadImage error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถบันทึกรูปภาพได้' });
  }
}

/**
 * แสดงรูป (สาธารณะ แคชได้ยาว เพราะ id ไม่ซ้ำและไฟล์ไม่เปลี่ยน)
 * GET /api/images/:id/:variant   variant = thumb | display | original
 */
export async function getImage(req: Request, res: Response): Promise<void> {
  try {
    const { id, variant } = req.params;
    if (!UUID_RE.test(id) || !IMAGE_VARIANTS.includes(variant as ImageVariant)) {
      res.status(404).json({ status: 'error', message: 'ไม่พบรูปภาพ' });
      return;
    }

    const found = await resolveImageFile(id, variant as ImageVariant);
    if (!found) {
      res.status(404).json({ status: 'error', message: 'ไม่พบรูปภาพ' });
      return;
    }
    try {
      await fs.access(found.file);
    } catch {
      res.status(404).json({ status: 'error', message: 'ไม่พบไฟล์รูปภาพ' });
      return;
    }

    res.setHeader('Content-Type', found.mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // ให้ "บันทึกรูปภาพเป็น..." (คลิกขวา) ได้ชื่อไฟล์เดิมของต้นฉบับ
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(found.downloadName)}`);
    res.sendFile(found.file, { dotfiles: 'allow' });
  } catch (error: any) {
    console.error('getImage error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถแสดงรูปภาพได้' });
  }
}

// (ใช้ในสคริปต์/ทดสอบ) สร้างลิงก์รูปจาก id
export { imageUrls };
