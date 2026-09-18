import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

/**
 * ดึงการตั้งค่าระบบสำหรับหน้าสาธารณะ
 * GET /api/settings/public
 */
export async function getPublicSettings(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await prisma.siteSetting.findMany({
      select: {
        key: true,
        value: true,
        description: true,
      },
    });

    // แปลงอาร์เรย์ให้อยู่ในรูป Object { key: value } เพื่อง่ายต่อการเรียกใช้ใน React
    const settingsMap: Record<string, any> = {};
    for (const item of settings) {
      // แปลงค่า 'true'/'false' เป็น boolean และตัวเลขเป็น number
      if (item.value === 'true') {
        settingsMap[item.key] = true;
      } else if (item.value === 'false') {
        settingsMap[item.key] = false;
      } else if (!isNaN(Number(item.value)) && item.value.trim() !== '') {
        settingsMap[item.key] = Number(item.value);
      } else {
        settingsMap[item.key] = item.value;
      }
    }

    res.json({
      status: 'success',
      data: settingsMap,
    });
  } catch (error: any) {
    console.error('getPublicSettings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงการตั้งค่าระบบได้',
      detail: error.message,
    });
  }
}

/**
 * สลับ/ตั้งค่าสถานะเปิด-ปิดระบบกรอกข้อมูล (เฉพาะ SUPER_ADMIN)
 * PUT /api/settings/submission-toggle
 * Body: { isOpen: boolean }
 */
export async function updateSubmissionToggle(req: Request, res: Response): Promise<void> {
  try {
    const { isOpen } = req.body;
    if (typeof isOpen !== 'boolean') {
      res.status(400).json({
        status: 'error',
        message: 'กรุณาระบุสถานะ isOpen เป็น boolean (true หรือ false)',
      });
      return;
    }

    const updated = await prisma.siteSetting.upsert({
      where: { key: 'is_data_submission_open' },
      update: { value: String(isOpen) },
      create: {
        key: 'is_data_submission_open',
        value: String(isOpen),
        description: 'สถานะเปิดรับการบันทึกข้อมูลสถิติจากวิทยาลัย',
      },
    });

    res.json({
      status: 'success',
      message: isOpen ? 'เปิดระบบรับการกรอกข้อมูลเรียบร้อยแล้ว' : 'ปิดระบบรับการกรอกข้อมูลเรียบร้อยแล้ว',
      data: {
        is_data_submission_open: updated.value === 'true',
      },
    });
  } catch (error: any) {
    console.error('updateSubmissionToggle error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถอัปเดตสถานะระบบได้',
      detail: error.message,
    });
  }
}

/**
 * ตั้งค่าเปิด-ปิดการกรอกข้อมูลแยกตามหมวด และเลือกเอฟเฟกต์ไฟกระพริบเน้นย้ำ (สำหรับ SUPER_ADMIN)
 * PUT /api/settings/submission-permissions
 */
export async function updateSubmissionPermissions(req: Request, res: Response): Promise<void> {
  try {
    const {
      allowSectionGeneral,
      allowSectionGrades,
      allowSectionGraduates,
      glowSection,
    } = req.body;

    const upsertPromises = [];

    if (allowSectionGeneral !== undefined) {
      upsertPromises.push(
        prisma.siteSetting.upsert({
          where: { key: 'allow_section_general' },
          update: { value: String(allowSectionGeneral) },
          create: { key: 'allow_section_general', value: String(allowSectionGeneral), description: 'อนุญาตให้แก้ไขข้อมูลทั่วไปและผู้บริหาร' },
        })
      );
    }

    if (allowSectionGrades !== undefined) {
      upsertPromises.push(
        prisma.siteSetting.upsert({
          where: { key: 'allow_section_grades' },
          update: { value: String(allowSectionGrades) },
          create: { key: 'allow_section_grades', value: String(allowSectionGrades), description: 'อนุญาตให้แก้ไขสถิตินักเรียนแยกชั้นปี' },
        })
      );
    }

    if (allowSectionGraduates !== undefined) {
      upsertPromises.push(
        prisma.siteSetting.upsert({
          where: { key: 'allow_section_graduates' },
          update: { value: String(allowSectionGraduates) },
          create: { key: 'allow_section_graduates', value: String(allowSectionGraduates), description: 'อนุญาตให้แก้ไขผู้สำเร็จการศึกษาและการมีงานทำ' },
        })
      );
    }

    if (glowSection !== undefined) {
      upsertPromises.push(
        prisma.siteSetting.upsert({
          where: { key: 'glow_section' },
          update: { value: String(glowSection) },
          create: { key: 'glow_section', value: String(glowSection), description: 'แท็บที่มีไฟกระพริบวิบวับเน้นย้ำ' },
        })
      );
    }

    await Promise.all(upsertPromises);

    res.json({
      status: 'success',
      message: 'บันทึกการตั้งค่าสิทธิ์และการเน้นย้ำเรียบร้อยแล้ว',
      data: {
        allowSectionGeneral,
        allowSectionGrades,
        allowSectionGraduates,
        glowSection,
      },
    });
  } catch (error: any) {
    console.error('updateSubmissionPermissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกการตั้งค่าสิทธิ์ได้',
      detail: error.message,
    });
  }
}


