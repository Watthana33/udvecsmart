import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.js';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';

// ขยาย Request ของ Express ให้มีฟิลด์ user เพื่อส่งต่อให้ controller ใช้งานได้
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware ตรวจสอบบัตรผ่าน (JWT Token) ใน Header: Authorization: Bearer <token>
 */
export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      status: 'error',
      message: 'ไม่พบบัตรผ่าน (Authorization header missing)',
    });
    return;
  }

  // รูปแบบต้องเป็น "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      status: 'error',
      message: 'รูปแบบบัตรผ่านไม่ถูกต้อง (Format must be: Bearer <token>)',
    });
    return;
  }

  const token = parts[1];

  let decoded: JwtPayload;
  try {
    decoded = verifyToken(token);
  } catch {
    res.status(401).json({
      status: 'error',
      message: 'บัตรผ่านหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่',
    });
    return;
  }

  // ตรวจกับฐานข้อมูลทุกครั้ง: บัญชีที่ถูกลบ/เปลี่ยนสิทธิ์/ย้ายสถานศึกษา จะใช้บัตรผ่านเดิมต่อไม่ได้ (ใช้สิทธิ์ล่าสุดจากฐานข้อมูล)
  prisma.user
    .findUnique({ where: { id: decoded.userId }, select: { id: true, email: true, role: true, institutionId: true, passwordChangedAt: true } })
    .then((account) => {
      if (!account) {
        res.status(401).json({ status: 'error', message: 'บัญชีนี้ไม่มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบใหม่' });
        return;
      }
      // เปลี่ยนรหัสผ่านแล้ว → บัตรผ่านที่ออกก่อนเปลี่ยนใช้ไม่ได้ (iat เป็นวินาทีปัดลง จึงเทียบระดับวินาที)
      const iat = (decoded as any).iat as number | undefined;
      if (account.passwordChangedAt && iat !== undefined && iat < Math.floor(account.passwordChangedAt.getTime() / 1000)) {
        res.status(401).json({ status: 'error', message: 'รหัสผ่านของบัญชีนี้ถูกเปลี่ยนแล้ว กรุณาเข้าสู่ระบบใหม่' });
        return;
      }
      req.user = { ...decoded, email: account.email, role: account.role, institutionId: account.institutionId };
      next();
    })
    .catch((err) => {
      console.error('authenticateJWT lookup error:', err);
      res.status(500).json({ status: 'error', message: 'ไม่สามารถตรวจสอบบัญชีผู้ใช้ได้' });
    });
}

/**
 * Middleware ตรวจสอบสิทธิ์ (Role) ว่าผู้ใช้มีสิทธิ์เข้าถึงเส้นทางนี้หรือไม่
 * @param allowedRoles รายการ Role ที่ได้รับอนุญาต เช่น [Role.SUPER_ADMIN]
 */
export function requireRole(allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้ (Forbidden)',
      });
      return;
    }

    next();
  };
}
