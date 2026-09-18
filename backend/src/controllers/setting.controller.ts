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

export interface AcademicPeriodItem {
  id: string;
  year: number;
  semester: number;
  isCurrent: boolean;
}

const DEFAULT_ACADEMIC_PERIODS: AcademicPeriodItem[] = [
  { id: '2568-1', year: 2568, semester: 1, isCurrent: true },
  { id: '2568-2', year: 2568, semester: 2, isCurrent: false },
  { id: '2567-2', year: 2567, semester: 2, isCurrent: false },
  { id: '2567-1', year: 2567, semester: 1, isCurrent: false },
];

/**
 * ดึงรายการรอบปีการศึกษาและภาคเรียนทั้งหมด
 * GET /api/settings/academic-periods
 */
export async function getAcademicPeriods(_req: Request, res: Response): Promise<void> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'academic_periods' },
    });

    let periods: AcademicPeriodItem[] = DEFAULT_ACADEMIC_PERIODS;
    if (setting?.value) {
      try {
        periods = JSON.parse(setting.value);
      } catch {
        periods = DEFAULT_ACADEMIC_PERIODS;
      }
    }

    res.json({
      status: 'success',
      data: periods,
    });
  } catch (error: any) {
    console.error('getAcademicPeriods error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลรอบปีการศึกษาได้' });
  }
}

/**
 * เพิ่มรอบปีการศึกษาและภาคเรียนใหม่ (เฉพาะ SUPER_ADMIN)
 * POST /api/settings/academic-periods
 */
export async function createAcademicPeriod(req: Request, res: Response): Promise<void> {
  try {
    const { year, semester, isCurrent = false } = req.body;
    const numYear = Number(year);
    const numSemester = Number(semester);

    if (!numYear || (numSemester !== 1 && numSemester !== 2)) {
      res.status(400).json({ status: 'error', message: 'กรุณาระบุปีการศึกษา (พ.ศ.) และภาคเรียน (1 หรือ 2) ให้ถูกต้อง' });
      return;
    }

    const setting = await prisma.siteSetting.findUnique({ where: { key: 'academic_periods' } });
    let periods: AcademicPeriodItem[] = DEFAULT_ACADEMIC_PERIODS;
    if (setting?.value) {
      try { periods = JSON.parse(setting.value); } catch { periods = DEFAULT_ACADEMIC_PERIODS; }
    }

    const id = `${numYear}-${numSemester}`;
    if (periods.some((p) => p.id === id || (p.year === numYear && p.semester === numSemester))) {
      res.status(400).json({ status: 'error', message: `รอบปีการศึกษา ${numYear} ภาคเรียนที่ ${numSemester} มีอยู่ในระบบแล้ว` });
      return;
    }

    if (isCurrent) {
      periods = periods.map((p) => ({ ...p, isCurrent: false }));
    }

    const newPeriod: AcademicPeriodItem = {
      id,
      year: numYear,
      semester: numSemester,
      isCurrent: Boolean(isCurrent),
    };

    periods.push(newPeriod);
    periods.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.semester - a.semester));

    await prisma.siteSetting.upsert({
      where: { key: 'academic_periods' },
      update: { value: JSON.stringify(periods) },
      create: { key: 'academic_periods', value: JSON.stringify(periods), description: 'รอบปีการศึกษาและภาคเรียนที่เปิดให้กรอกข้อมูล' },
    });

    res.status(201).json({
      status: 'success',
      message: `เพิ่มรอบปีการศึกษา ${numYear} ภาคเรียนที่ ${numSemester} สำเร็จ`,
      data: periods,
    });
  } catch (error: any) {
    console.error('createAcademicPeriod error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถเพิ่มรอบปีการศึกษาได้' });
  }
}

/**
 * ลบรอบปีการศึกษา (เฉพาะ SUPER_ADMIN)
 * DELETE /api/settings/academic-periods/:id
 */
export async function deleteAcademicPeriod(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const setting = await prisma.siteSetting.findUnique({ where: { key: 'academic_periods' } });
    let periods: AcademicPeriodItem[] = DEFAULT_ACADEMIC_PERIODS;
    if (setting?.value) {
      try { periods = JSON.parse(setting.value); } catch { periods = DEFAULT_ACADEMIC_PERIODS; }
    }

    if (periods.length <= 1) {
      res.status(400).json({ status: 'error', message: 'ระบบต้องมีรอบปีการศึกษาอย่างน้อย 1 รายการ ไม่สามารถลบทั้งหมดได้' });
      return;
    }

    const target = periods.find((p) => p.id === id);
    if (!target) {
      res.status(404).json({ status: 'error', message: 'ไม่พบรอบปีการศึกษาที่ต้องการลบ' });
      return;
    }

    periods = periods.filter((p) => p.id !== id);
    if (target.isCurrent && periods.length > 0) {
      periods[0].isCurrent = true;
    }

    await prisma.siteSetting.upsert({
      where: { key: 'academic_periods' },
      update: { value: JSON.stringify(periods) },
      create: { key: 'academic_periods', value: JSON.stringify(periods), description: 'รอบปีการศึกษาและภาคเรียนที่เปิดให้กรอกข้อมูล' },
    });

    res.json({
      status: 'success',
      message: `ลบรอบปีการศึกษา ${target.year} ภาคเรียนที่ ${target.semester} เรียบร้อยแล้ว`,
      data: periods,
    });
  } catch (error: any) {
    console.error('deleteAcademicPeriod error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถลบรอบปีการศึกษาได้' });
  }
}

/**
 * ตั้งรอบปีการศึกษาปัจจุบัน (เฉพาะ SUPER_ADMIN)
 * PUT /api/settings/academic-periods/:id/current
 */
export async function setCurrentAcademicPeriod(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const setting = await prisma.siteSetting.findUnique({ where: { key: 'academic_periods' } });
    let periods: AcademicPeriodItem[] = DEFAULT_ACADEMIC_PERIODS;
    if (setting?.value) {
      try { periods = JSON.parse(setting.value); } catch { periods = DEFAULT_ACADEMIC_PERIODS; }
    }

    const target = periods.find((p) => p.id === id);
    if (!target) {
      res.status(404).json({ status: 'error', message: 'ไม่พบรอบปีการศึกษาที่ระบุ' });
      return;
    }

    periods = periods.map((p) => ({
      ...p,
      isCurrent: p.id === id,
    }));

    await prisma.siteSetting.upsert({
      where: { key: 'academic_periods' },
      update: { value: JSON.stringify(periods) },
      create: { key: 'academic_periods', value: JSON.stringify(periods), description: 'รอบปีการศึกษาและภาคเรียนที่เปิดให้กรอกข้อมูล' },
    });

    res.json({
      status: 'success',
      message: `ตั้งรอบปีการศึกษา ${target.year} ภาคเรียนที่ ${target.semester} เป็นรอบปัจจุบันสำเร็จ`,
      data: periods,
    });
  } catch (error: any) {
    console.error('setCurrentAcademicPeriod error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถตั้งรอบปัจจุบันได้' });
  }
}



