import { Request, Response } from 'express';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { hashPassword, validatePassword } from '../utils/password.js';

// ลิงก์ตั้งรหัสผ่าน: แอดมินสร้างแล้วส่งให้ผู้ใช้เอง (LINE/อีเมล) — ใช้ได้ครั้งเดียว หมดอายุ 24 ชม.
// เก็บเฉพาะ SHA-256 ของโทเคนในฐานข้อมูล (ฐานข้อมูลหลุดก็เอาไปใช้ตั้งรหัสไม่ได้)
const LINK_TTL_MS = 24 * 60 * 60 * 1000;

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

async function findValidToken(token: unknown) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  const row = await prisma.passwordToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, fullName: true } } },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  return row;
}

/** ออกโทเคนใหม่ให้บัญชี (ยกเลิกโทเคนเดิมที่ยังไม่ใช้) — ใช้ภายใน transaction ของผู้เรียก */
export async function issuePasswordToken(tx: Prisma.TransactionClient, userId: string, createdById: string | null) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + LINK_TTL_MS);
  await tx.passwordToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
  await tx.passwordToken.create({ data: { userId, tokenHash: hashToken(token), expiresAt, createdById } });
  return { token, expiresAt };
}

/**
 * สร้างลิงก์ตั้งรหัสผ่านให้ผู้ใช้ (SUPER_ADMIN) — ลิงก์เก่าที่ยังไม่ใช้ของบัญชีนี้ถูกยกเลิก
 * POST /api/users/:id/password-link
 */
export async function createPasswordLink(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, email: true } });
    if (!user) {
      res.status(404).json({ status: 'error', message: 'ไม่พบบัญชีผู้ใช้งานนี้' });
      return;
    }
    const { token, expiresAt } = await prisma.$transaction((tx) => issuePasswordToken(tx, user.id, req.user?.userId ?? null));
    res.json({ status: 'success', data: { token, expiresAt, email: user.email } });
  } catch (error: any) {
    console.error('createPasswordLink error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถสร้างลิงก์ตั้งรหัสผ่านได้' });
  }
}

/**
 * ตรวจลิงก์ก่อนแสดงฟอร์ม (สาธารณะ)
 * POST /api/auth/password-link/check  Body: { token }
 */
export async function checkPasswordLink(req: Request, res: Response): Promise<void> {
  try {
    const row = await findValidToken(req.body?.token);
    if (!row) {
      res.status(410).json({ status: 'error', message: 'ลิงก์นี้ใช้ไม่ได้แล้ว (หมดอายุ ถูกใช้ไปแล้ว หรือมีการสร้างลิงก์ใหม่) กรุณาขอลิงก์ใหม่จากแอดมิน สอจ.' });
      return;
    }
    res.json({ status: 'success', data: { email: row.user.email, fullName: row.user.fullName, expiresAt: row.expiresAt } });
  } catch (error: any) {
    console.error('checkPasswordLink error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถตรวจสอบลิงก์ได้' });
  }
}

/**
 * ตั้งรหัสผ่านใหม่ผ่านลิงก์ (สาธารณะ) — สำเร็จแล้วลิงก์ใช้ไม่ได้อีก และเซสชันเดิมของบัญชีนี้หลุดทั้งหมด
 * POST /api/auth/password-link/use  Body: { token, password }
 */
export async function usePasswordLink(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = req.body ?? {};
    const pwError = validatePassword(password);
    if (pwError) {
      res.status(400).json({ status: 'error', message: pwError });
      return;
    }
    const row = await findValidToken(token);
    if (!row) {
      res.status(410).json({ status: 'error', message: 'ลิงก์นี้ใช้ไม่ได้แล้ว กรุณาขอลิงก์ใหม่จากแอดมิน สอจ.' });
      return;
    }
    const passwordHash = await hashPassword(password);
    // ปิดลิงก์กับเปลี่ยนรหัสใน transaction เดียว (ล้มกลางทาง = ลิงก์ยังใช้ได้) และ usedAt = null กันกดซ้ำพร้อมกัน
    const claimed = await prisma.$transaction(async (tx) => {
      const r = await tx.passwordToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
      if (r.count === 0) return false;
      await tx.user.update({ where: { id: row.userId }, data: { passwordHash, passwordChangedAt: new Date() } });
      return true;
    });
    if (!claimed) {
      res.status(410).json({ status: 'error', message: 'ลิงก์นี้ถูกใช้ไปแล้ว' });
      return;
    }
    res.json({ status: 'success', message: 'ตั้งรหัสผ่านเรียบร้อยแล้ว เข้าสู่ระบบด้วยรหัสใหม่ได้เลย', data: { email: row.user.email } });
  } catch (error: any) {
    console.error('usePasswordLink error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถตั้งรหัสผ่านได้' });
  }
}
