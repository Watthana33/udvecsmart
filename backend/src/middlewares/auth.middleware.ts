import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.js';
import { Role } from '@prisma/client';

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

  try {
    const decoded = verifyToken(token);
    // แนบข้อมูลผู้ใช้เข้ากับ req เพื่อให้ Controller ใช้งานต่อได้
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      status: 'error',
      message: 'บัตรผ่านหมดอายุหรือไม่ถูกต้อง (Invalid or expired token)',
      detail: error.message,
    });
  }
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
