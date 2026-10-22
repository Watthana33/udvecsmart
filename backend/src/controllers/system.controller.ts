import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { getStatus, checkForUpdate, healthChecks, startUpgrade, startRollback } from '../services/selfUpdate.js';

// ระบบอัปเดตเวอร์ชันเว็บ (เฉพาะ SUPER_ADMIN) — ตรรกะอยู่ที่ services/selfUpdate.ts
function fail(res: Response, error: any, fallback: string, code = 500): void {
  console.error(`${fallback}:`, error);
  res.status(code).json({ status: 'error', message: error?.message ? `${fallback}: ${error.message}` : fallback });
}

export async function getSystemStatus(_req: AuthRequest, res: Response): Promise<void> {
  try {
    res.json({ status: 'success', ...(await getStatus()) });
  } catch (error) {
    fail(res, error, 'อ่านสถานะระบบอัปเดตไม่สำเร็จ');
  }
}

export async function checkSystemUpdate(_req: AuthRequest, res: Response): Promise<void> {
  try {
    res.json({ status: 'success', ...(await checkForUpdate()) });
  } catch (error) {
    fail(res, error, 'ตรวจเวอร์ชันใหม่ไม่สำเร็จ', 400);
  }
}

export async function getSystemHealth(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const checks = await healthChecks();
    res.json({ status: 'success', checks, ready: checks.every((c) => c.ok || c.key === 'current') });
  } catch (error) {
    fail(res, error, 'ตรวจสุขภาพระบบไม่สำเร็จ');
  }
}

export async function startSystemUpgrade(req: AuthRequest, res: Response): Promise<void> {
  try {
    const tag = typeof req.body?.tag === 'string' ? req.body.tag : '';
    await startUpgrade(tag);
    res.status(202).json({ status: 'success', message: 'เริ่มอัปเดตแล้ว' });
  } catch (error) {
    fail(res, error, 'เริ่มอัปเดตไม่สำเร็จ', 400);
  }
}

export async function startSystemRollback(req: AuthRequest, res: Response): Promise<void> {
  try {
    await startRollback(req.body?.restoreDb === true);
    res.status(202).json({ status: 'success', message: 'เริ่มย้อนคืนแล้ว' });
  } catch (error) {
    fail(res, error, 'เริ่มย้อนคืนไม่สำเร็จ', 400);
  }
}
