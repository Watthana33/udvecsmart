import { Request, Response, NextFunction } from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { AuthRequest } from './auth.middleware.js';

// หมายเหตุ: เก็บสถิติในหน่วยความจำ (backend มีตัวเดียว) — รีสตาร์ตแล้วนับใหม่
// req.ip = IP จริงของผู้ใช้ (app.set('trust proxy', 1) ใน server.ts เพราะอยู่หลัง nginx)

const MINUTE = 60 * 1000;

function tooMany(res: Response, retryMs: number, message: string): void {
  const seconds = Math.max(1, Math.ceil(retryMs / 1000));
  res.setHeader('Retry-After', String(seconds));
  res.status(429).json({ status: 'error', message, retryAfterSeconds: seconds });
}

function waitText(ms: number): string {
  const minutes = Math.ceil(ms / MINUTE);
  return minutes <= 1 ? 'ประมาณ 1 นาที' : `${minutes} นาที`;
}

// ===================== เข้าสู่ระบบ =====================
// - อีเมลเดียวกันจาก IP เดียวกัน ผิด 5 ครั้งใน 15 นาที → ล็อก 15 นาที
// - IP เดียว ผิดรวม 20 ครั้งใน 15 นาที (ไม่ว่าอีเมลอะไร) → ล็อก 15 นาที
// - อีเมลเดียว ผิดรวม 50 ครั้งใน 15 นาที (จากหลาย IP) → ล็อก 15 นาที
//   (ไม่ล็อกอีเมลตั้งแต่ 5 ครั้งจากทุกที่ เพื่อไม่ให้ใครก็ได้กดผิดรัว ๆ แล้วล็อกบัญชีแอดมินตัวจริง)
// นับเฉพาะครั้งที่ตอบ 401 (รหัสผิด/ไม่มีผู้ใช้); เข้าสู่ระบบสำเร็จ → ล้างตัวนับของอีเมลนั้นจาก IP นั้น
const LOGIN_WINDOW_MS = 15 * MINUTE;
const LOGIN_LOCK_MS = 15 * MINUTE;
const LIMIT_EMAIL_IP = 5;
const LIMIT_IP = 20;
const LIMIT_EMAIL = 50;

interface FailRecord {
  fails: number;
  first: number;
  lockedUntil: number;
}

const byEmailIp = new Map<string, FailRecord>();
const byIp = new Map<string, FailRecord>();
const byEmail = new Map<string, FailRecord>();

function lockRemaining(map: Map<string, FailRecord>, key: string, now: number): number {
  const rec = map.get(key);
  return rec ? Math.max(0, rec.lockedUntil - now) : 0;
}

function recordFail(map: Map<string, FailRecord>, key: string, max: number, now: number): void {
  let rec = map.get(key);
  if (!rec || now - rec.first > LOGIN_WINDOW_MS) rec = { fails: 0, first: now, lockedUntil: rec?.lockedUntil ?? 0 };
  rec.fails += 1;
  if (rec.fails >= max) {
    rec.lockedUntil = now + LOGIN_LOCK_MS;
    rec.fails = 0;
    rec.first = now;
  }
  map.set(key, rec);
  if (map.size > 10_000) {
    for (const [k, r] of map) if (now - r.first > LOGIN_WINDOW_MS && r.lockedUntil < now) map.delete(k);
  }
}

export function loginThrottle(req: Request, res: Response, next: NextFunction): void {
  const now = Date.now();
  const ip = req.ip || 'unknown';
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim().slice(0, 200) : '';
  const emailIp = `${email}|${ip}`;

  const remaining = Math.max(
    lockRemaining(byIp, ip, now),
    email ? lockRemaining(byEmailIp, emailIp, now) : 0,
    email ? lockRemaining(byEmail, email, now) : 0
  );
  if (remaining > 0) {
    tooMany(res, remaining, `ลองเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอ ${waitText(remaining)} แล้วลองใหม่`);
    return;
  }

  res.on('finish', () => {
    const t = Date.now();
    if (res.statusCode === 401) {
      recordFail(byIp, ip, LIMIT_IP, t);
      if (email) {
        recordFail(byEmailIp, emailIp, LIMIT_EMAIL_IP, t);
        recordFail(byEmail, email, LIMIT_EMAIL, t);
      }
    } else if (res.statusCode === 200 && email) {
      byEmailIp.delete(emailIp);
    }
  });
  next();
}

// ===================== ช่องทางอื่น (express-rate-limit) =====================
function limiter(windowMs: number, limit: number, message: string, keyByUser = false) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const userId = keyByUser ? (req as AuthRequest).user?.userId : undefined;
      return userId ? `user:${userId}` : ipKeyGenerator(req.ip || 'unknown');
    },
    handler: (_req, res, _next, options) => tooMany(res, options.windowMs, message),
  });
}

/** ทั้ง /api: กันยิงถล่ม (ใช้งานปกติเปิดหน้าหนึ่งเรียก API ไม่กี่สิบครั้ง) */
export const apiLimiter = limiter(5 * MINUTE, 1500, 'มีการเรียกใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่');

/** ฟอร์มติดต่อเรา: 5 ข้อความต่อ 15 นาทีต่อ IP */
export const contactLimiter = limiter(15 * MINUTE, 5, 'ส่งข้อความถี่เกินไป กรุณารอประมาณ 15 นาทีแล้วลองใหม่');

/** อัปโหลดรูป: 100 รูปต่อชั่วโมงต่อผู้ใช้ */
export const uploadLimiter = limiter(60 * MINUTE, 100, 'อัปโหลดรูปถี่เกินไป (ไม่เกิน 100 รูปต่อชั่วโมง) กรุณารอแล้วลองใหม่', true);

// ===================== ยอดดูข่าว =====================
// IP เดียวกันดูข่าวเดิมซ้ำภายใน 30 นาที ไม่นับเพิ่ม (กันกดรีเฟรชปั่นยอด)
const VIEW_WINDOW_MS = 30 * MINUTE;
const recentViews = new Map<string, number>();

export function shouldCountNewsView(ip: string | undefined, newsId: string): boolean {
  const now = Date.now();
  const key = `${ip || 'unknown'}|${newsId}`;
  const last = recentViews.get(key);
  if (last !== undefined && now - last < VIEW_WINDOW_MS) return false;
  recentViews.set(key, now);
  if (recentViews.size > 20_000) {
    for (const [k, t] of recentViews) if (now - t > VIEW_WINDOW_MS) recentViews.delete(k);
  }
  return true;
}
