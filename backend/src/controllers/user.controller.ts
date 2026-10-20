import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

/**
 * ดึงรายชื่อผู้ใช้งานทั้งหมด (สำหรับ SUPER_ADMIN)
 * GET /api/users
 */
const MIN_PASSWORD_LENGTH = 8;

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
    const { email, password, fullName, role, institutionId } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกข้อมูล Username/Email, รหัสผ่าน และ ชื่อ-นามสกุล ให้ครบถ้วน',
      });
      return;
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ status: 'error', message: `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร` });
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

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
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

    res.status(201).json({
      status: 'success',
      message: 'สร้างบัญชีผู้ใช้งานสำเร็จ',
      data: newUser,
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
    if (password && typeof password === 'string' && password.trim() !== '' && password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ status: 'error', message: `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร` });
      return;
    }

    const updateData: any = {};
    if (email) updateData.email = normalizeEmail(email);
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role === 'SUPER_ADMIN' ? Role.SUPER_ADMIN : Role.SCHOOL_ADMIN;
    if (institutionId !== undefined) updateData.institutionId = institutionId || null;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
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

    res.json({
      status: 'success',
      message: 'แก้ไขข้อมูลผู้ใช้งานสำเร็จ',
      data: updatedUser,
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
