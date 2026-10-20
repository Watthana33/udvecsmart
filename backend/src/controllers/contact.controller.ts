import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

/**
 * บันทึกข้อความติดต่อจากประชาชน / นักเรียน
 * POST /api/contact
 */
export async function submitContactMessage(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({
        status: 'error',
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, อีเมล, เรื่อง, ข้อความ)',
      });
      return;
    }

    const limits: Array<[unknown, number, string]> = [
      [name, 120, 'ชื่อ-นามสกุล'],
      [email, 200, 'อีเมล'],
      [subject, 200, 'เรื่องที่ติดต่อ'],
      [message, 5000, 'ข้อความ'],
      [phone ?? '', 40, 'เบอร์โทรศัพท์'],
    ];
    for (const [v, max, label] of limits) {
      if (typeof v !== 'string' || v.length > max) {
        res.status(400).json({ status: 'error', message: `${label}ต้องเป็นข้อความยาวไม่เกิน ${max} ตัวอักษร` });
        return;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ status: 'error', message: 'รูปแบบอีเมลไม่ถูกต้อง' });
      return;
    }

    const newMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'ส่งข้อความติดต่อเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด',
      data: { id: newMessage.id, createdAt: newMessage.createdAt },
    });
  } catch (error: any) {
    console.error('submitContactMessage error:', error);
    res.status(500).json({
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง',
    });
  }
}
