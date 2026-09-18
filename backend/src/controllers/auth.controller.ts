import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

/**
 * Controller สำหรับเข้าสู่ระบบ (Login)
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // 1. ตรวจสอบว่าส่ง email และ password มาครบหรือไม่
    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน',
      });
      return;
    }

    // 2. ค้นหาผู้ใช้ในฐานข้อมูลด้วยอีเมล
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        institution: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      });
      return;
    }

    // 3. ตรวจสอบรหัสผ่านว่าตรงกับ Hash ในฐานข้อมูลหรือไม่
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        status: 'error',
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      });
      return;
    }

    // 4. ออกบัตรผ่านดิจิทัล (JWT Token)
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    });

    // 5. ส่งผลลัพธ์กลับไปยังผู้ใช้ (ไม่ส่ง passwordHash กลับไปเด็ดขาด)
    res.json({
      status: 'success',
      message: 'เข้าสู่ระบบสำเร็จ',
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        institution: user.institution,
      },
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
      detail: error.message,
    });
  }
}

/**
 * Controller สำหรับดึงข้อมูลผู้ใช้ปัจจุบันจากบัตรผ่าน (Get Current User Profile)
 * GET /api/auth/me
 */
export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'ไม่พบข้อมูลการเข้าสู่ระบบ',
      });
      return;
    }

    // ดึงข้อมูลล่าสุดของผู้ใช้จากฐานข้อมูล
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        institution: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            logoUrl: true,
            website: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ',
      });
      return;
    }

    res.json({
      status: 'success',
      user,
    });
  } catch (error: any) {
    console.error('GetMe Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
      detail: error.message,
    });
  }
}
