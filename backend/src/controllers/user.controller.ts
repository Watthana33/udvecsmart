import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';
import crypto from 'crypto';
import { signToken } from '../utils/jwt.js';
import { issuePasswordToken } from './passwordLink.controller.js';
import { hashPassword, validatePassword } from '../utils/password.js';

/**
 * ดึงรายชื่อผู้ใช้งานทั้งหมด (สำหรับ SUPER_ADMIN)
 * GET /api/users
 */
// ล็อกอินแปลงอีเมลเป็นตัวเล็กเสมอ จึงต้องเก็บแบบตัวเล็กตั้งแต่สร้าง ไม่งั้นเข้าสู่ระบบไม่ได้
function normalizeEmail(email: string): string {
  return String(email).toLowerCase().trim();
}

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        institutionId: true,
        institution: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { email: 'asc' },
      ],
    });

    res.json({
      status: 'success',
      total: users.length,
      data: users,
    });
  } catch (error: any) {
    console.error('getUsers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงรายชื่อผู้ใช้งานได้',
    });
  }
}

/**
 * สร้างผู้ใช้งานใหม่ (สำหรับ SUPER_ADMIN)
 * POST /api/users
 */
export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password, fullName, role, institutionId, useLink } = req.body;

    if (!email || !fullName || (!password && !useLink)) {
      res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกข้อมูล Username/Email, รหัสผ่าน และ ชื่อ-นามสกุล ให้ครบถ้วน',
      });
      return;
    }
    const pwError = useLink ? null : validatePassword(password);
    if (pwError) {
      res.status(400).json({ status: 'error', message: pwError });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (existing) {
      res.status(400).json({
        status: 'error',
        message: `มีผู้ใช้งาน ${email} อยู่ในระบบแล้ว`,
      });
      return;
    }

    // ให้ผู้ใช้ตั้งรหัสเองผ่านลิงก์ → ใส่รหัสสุ่มที่ไม่มีใครรู้ไว้ก่อน (เข้าสู่ระบบไม่ได้จนกว่าจะตั้งรหัส)
    const passwordHash = await hashPassword(useLink ? crypto.randomBytes(32).toString('hex') : password);

    // โหมดส่งลิงก์: สร้างบัญชีกับลิงก์ในคำขอเดียว (ลิงก์ล้ม = ไม่สร้างบัญชี ไม่เหลือบัญชีที่ล็อกอินไม่ได้)
    const { newUser, link } = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: normalizeEmail(email),
        passwordHash,
        fullName,
        role: role === 'SUPER_ADMIN' ? Role.SUPER_ADMIN : Role.SCHOOL_ADMIN,
        institutionId: institutionId || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });
    const link = useLink ? await issuePasswordToken(tx, newUser.id, req.user?.userId ?? null) : null;
    return { newUser, link };
    });

    res.status(201).json({
      status: 'success',
      message: 'สร้างบัญชีผู้ใช้งานสำเร็จ',
      data: newUser,
      passwordLink: link,
    });
  } catch (error: any) {
    console.error('createUser error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถสร้างผู้ใช้งานได้',
    });
  }
}

/**
 * อัปเดตข้อมูลผู้ใช้งาน (สำหรับ SUPER_ADMIN)
 * PUT /api/users/:id
 */
export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { email, password, fullName, role, institutionId } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        status: 'error',
        message: 'ไม่พบบัญชีผู้ใช้งานนี้',
      });
      return;
    }

    // ไม่ให้ระบบเหลือแอดมิน สอจ. เป็นศูนย์ (ลดสิทธิ์ตัวสุดท้าย = ไม่มีใครเข้าหลังบ้านส่วนกลางได้)
    if (existing.role === Role.SUPER_ADMIN && role && role !== 'SUPER_ADMIN') {
      const supers = await prisma.user.count({ where: { role: Role.SUPER_ADMIN } });
      if (supers <= 1) {
        res.status(400).json({ status: 'error', message: 'ไม่สามารถลดสิทธิ์แอดมิน สอจ. คนสุดท้ายได้ ต้องมีแอดมิน สอจ. อย่างน้อย 1 บัญชี' });
        return;
      }
    }
    const pwError = password && typeof password === 'string' && password.trim() !== '' ? validatePassword(password) : null;
    if (pwError) {
      res.status(400).json({ status: 'error', message: pwError });
      return;
    }

    const updateData: any = {};
    if (email) updateData.email = normalizeEmail(email);
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role === 'SUPER_ADMIN' ? Role.SUPER_ADMIN : Role.SCHOOL_ADMIN;
    if (institutionId !== undefined) updateData.institutionId = institutionId || null;

    if (password && password.trim() !== '') {
      updateData.passwordHash = await hashPassword(password);
      updateData.passwordChangedAt = new Date(); // เซสชันเดิมของบัญชีนี้หลุด
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedAt: true,
      },
    });

    // แอดมินเปลี่ยนรหัสของตัวเอง → ออกบัตรผ่านใหม่ให้ ไม่ต้องล็อกอินซ้ำ
    const accessToken =
      updateData.passwordHash && req.user?.userId === id
        ? signToken({ userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role, institutionId: updatedUser.institutionId })
        : undefined;

    res.json({
      status: 'success',
      message: 'แก้ไขข้อมูลผู้ใช้งานสำเร็จ',
      data: updatedUser,
      accessToken,
    });
  } catch (error: any) {
    console.error('updateUser error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถแก้ไขข้อมูลผู้ใช้งานได้',
    });
  }
}

/**
 * ลบบัญชีผู้ใช้งาน (สำหรับ SUPER_ADMIN)
 * DELETE /api/users/:id
 */
export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (req.user?.userId === id) {
      res.status(400).json({
        status: 'error',
        message: 'ไม่สามารถลบบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้',
      });
      return;
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === Role.SUPER_ADMIN && (await prisma.user.count({ where: { role: Role.SUPER_ADMIN } })) <= 1) {
      res.status(400).json({ status: 'error', message: 'ไม่สามารถลบแอดมิน สอจ. คนสุดท้ายได้' });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      status: 'success',
      message: 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('deleteUser error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถลบบัญชีผู้ใช้งานได้',
    });
  }
}
