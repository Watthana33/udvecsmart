import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

// คีย์ที่ต้องแปลงเป็นตัวเลข (ที่เหลือคงเป็นข้อความ — กันเบอร์โทร/หัวข้อที่เป็นตัวเลขล้วนถูกแปลงจนเลข 0 นำหน้าหาย)
const NUMERIC_SETTING_KEYS = new Set(['current_academic_year', 'current_semester', 'welcome_version']);

// คีย์ที่เก็บรูป (data URL ขนาดใหญ่) — ไม่ส่งในการตั้งค่าสาธารณะ ให้โหลดผ่าน endpoint รูปแยก (cache ได้)
const IMAGE_SETTING_KEYS = new Set(['welcome_image', 'banner_image']);

// คีย์ที่ไม่ใช่การตั้งค่าที่หน้าเว็บต้องใช้ผ่านเส้นทางนี้
const HIDDEN_SETTING_KEYS = new Set(['visitor_count']);

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
        updatedAt: true,
      },
    });

    // แปลงอาร์เรย์ให้อยู่ในรูป Object { key: value } เพื่อง่ายต่อการเรียกใช้ใน React
    const settingsMap: Record<string, any> = {};
    for (const item of settings) {
      if (HIDDEN_SETTING_KEYS.has(item.key)) continue;

      if (IMAGE_SETTING_KEYS.has(item.key)) {
        // ส่งแค่ว่ามีรูปไหม + เวอร์ชัน (ใช้ต่อท้าย URL รูปเพื่อให้ cache ใหม่เมื่อเปลี่ยนรูป)
        const name = item.key.replace('_image', '');
        settingsMap[`${name}_has_image`] = item.value !== '';
        settingsMap[`${name}_image_version`] = item.updatedAt.getTime();
        continue;
      }

      if (item.value === 'true') {
        settingsMap[item.key] = true;
      } else if (item.value === 'false') {
        settingsMap[item.key] = false;
      } else if (NUMERIC_SETTING_KEYS.has(item.key) && item.value.trim() !== '' && !isNaN(Number(item.value))) {
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
    });
  }
}

// ---------- รูปที่เก็บใน site_settings (หน้าข่าวสาร / แบนเนอร์) ----------
const MAX_IMAGE_LENGTH = 7_000_000; // ~5MB หลังเข้ารหัส base64
const DATA_IMAGE_RE = /^data:(image\/(?:jpeg|png|webp|gif|avif));base64,([A-Za-z0-9+/=]+)$/;

/** ตรวจค่ารูป: '' (ไม่มีรูป), data URL ของชนิดที่อนุญาต (ไม่รับ SVG), ลิงก์ http(s) หรือ path ในเว็บ */
export function validateImageValue(v: unknown): string | null {
  if (typeof v !== 'string') return 'รูปภาพต้องเป็นข้อความ';
  if (v === '') return null;
  if (v.length > MAX_IMAGE_LENGTH) return 'รูปภาพใหญ่เกินไป (ไม่เกินประมาณ 5MB)';
  if (v.startsWith('data:')) {
    return DATA_IMAGE_RE.test(v) ? null : 'รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF และ AVIF';
  }
  // CSP ของหน้าเว็บ (img-src) รับเฉพาะ https — ลิงก์ http:// จะถูกเบราว์เซอร์บล็อกจนรูปแตก
  if (/^https:\/\/[^\s]{1,2000}$/i.test(v)) return null;
  if (/^\/(?!\/)[^\s]{0,500}$/.test(v)) return null;
  if (/^http:\/\//i.test(v)) return 'ลิงก์รูปภาพต้องขึ้นต้นด้วย https:// (เบราว์เซอร์จะบล็อกรูปจาก http://)';
  return 'รูปภาพต้องเป็นไฟล์ภาพหรือลิงก์ที่ขึ้นต้นด้วย https://';
}

function serveSettingImage(key: string) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const row = await prisma.siteSetting.findUnique({ where: { key } });
      if (!row || row.value === '') {
        res.status(404).json({ status: 'error', message: 'ไม่มีรูปภาพ' });
        return;
      }

      // ลิงก์ภายนอก/path ในเว็บ → ส่งต่อ
      if (!row.value.startsWith('data:')) {
        res.redirect(302, row.value);
        return;
      }

      const m = DATA_IMAGE_RE.exec(row.value);
      if (!m) {
        res.status(404).json({ status: 'error', message: 'รูปภาพไม่ถูกต้อง' });
        return;
      }

      const etag = `W/"${row.updatedAt.getTime()}"`;
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }
      res.type(m[1]).send(Buffer.from(m[2], 'base64'));
    } catch (error: any) {
      console.error(`serveSettingImage(${key}) error:`, error);
      res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงรูปภาพได้' });
    }
  };
}

/** GET /api/settings/welcome-image */
export const getWelcomeImage = serveSettingImage('welcome_image');
/** GET /api/settings/banner-image */
export const getBannerImage = serveSettingImage('banner_image');

/**
 * ตั้งรูปแบนเนอร์หัวเว็บ (เฉพาะ SUPER_ADMIN) — เก็บที่เซิร์ฟเวอร์ ทุกคนเห็นตรงกัน; ส่ง '' = กลับไปใช้แบนเนอร์เริ่มต้น
 * PUT /api/settings/banner  Body: { image: string }
 */
export async function updateBanner(req: Request, res: Response): Promise<void> {
  try {
    const { image } = req.body;
    const err = validateImageValue(image);
    if (err) {
      res.status(400).json({ status: 'error', message: err });
      return;
    }
    await prisma.siteSetting.upsert({
      where: { key: 'banner_image' },
      update: { value: image },
      create: { key: 'banner_image', value: image, description: 'รูปแบนเนอร์หัวเว็บ (ว่าง = ใช้รูปเริ่มต้น)' },
    });
    res.json({ status: 'success', message: image === '' ? 'กลับไปใช้แบนเนอร์เริ่มต้นแล้ว' : 'เปลี่ยนแบนเนอร์เรียบร้อยแล้ว' });
  } catch (error: any) {
    console.error('updateBanner error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถบันทึกแบนเนอร์ได้' });
  }
}

/**
 * ตั้งรูปแบนเนอร์หัวเว็บแบบสไลด์ (เฉพาะ SUPER_ADMIN) — เพิ่มเองสูงสุด 4 รูป (แสดงต่อจากรูปเริ่มต้น เป็นรูปที่ 2-5); ส่ง [] = มีแต่รูปเริ่มต้น
 * PUT /api/settings/banners  Body: { images: string[] }  (ลิงก์รูปจากระบบอัปโหลด ไม่รับ data URL)
 */
export async function updateBanners(req: Request, res: Response): Promise<void> {
  try {
    const { images } = req.body;
    if (!Array.isArray(images) || images.length > 4) {
      res.status(400).json({ status: 'error', message: 'แบนเนอร์ที่เพิ่มเองต้องไม่เกิน 4 รูป (รูปที่ 1 เป็นรูปเริ่มต้น)' });
      return;
    }
    for (const img of images) {
      const err = img === '' || (typeof img === 'string' && img.startsWith('data:')) ? 'รูปแบนเนอร์ต้องเป็นลิงก์รูปที่อัปโหลดแล้ว' : validateImageValue(img);
      if (err) {
        res.status(400).json({ status: 'error', message: err });
        return;
      }
    }
    await prisma.$transaction([
      prisma.siteSetting.upsert({
        where: { key: 'banner_images' },
        update: { value: JSON.stringify(images) },
        create: { key: 'banner_images', value: JSON.stringify(images), description: 'รูปแบนเนอร์หัวเว็บแบบสไลด์ (JSON ไม่เกิน 4 รูป ต่อจากรูปเริ่มต้น)' },
      }),
      // เลิกใช้รูปเดี่ยวแบบเดิม เพื่อไม่ให้ค้างทับรายการใหม่
      prisma.siteSetting.updateMany({ where: { key: 'banner_image' }, data: { value: '' } }),
    ]);
    res.json({ status: 'success', message: images.length === 0 ? 'เหลือเฉพาะแบนเนอร์เริ่มต้นแล้ว' : `บันทึกแบนเนอร์เพิ่มเติม ${images.length} รูปเรียบร้อยแล้ว` });
  } catch (error: any) {
    console.error('updateBanners error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถบันทึกแบนเนอร์ได้' });
  }
}

/**
 * ตั้งข้อมูลติดต่อ สอจ. ที่แสดงใน Footer และหน้าติดต่อเรา (เฉพาะ SUPER_ADMIN)
 * PUT /api/settings/contact-info
 */
const CONTACT_FIELDS: Array<[string, string, number, string]> = [
  ['contactAddress', 'contact_address', 400, 'ที่อยู่สำนักงาน'],
  ['contactPhone', 'contact_phone', 60, 'เบอร์โทรศัพท์'],
  ['contactEmail', 'contact_email', 120, 'อีเมลทางการ'],
  ['contactHours', 'contact_hours', 120, 'เวลาทำการ'],
  ['contactFacebook', 'contact_facebook', 300, 'ลิงก์เฟซบุ๊กแฟนเพจ'],
];

export async function updateContactInfo(req: Request, res: Response): Promise<void> {
  try {
    const entries: Array<[string, string, string]> = [];
    for (const [field, key, max, label] of CONTACT_FIELDS) {
      const v = req.body[field];
      if (v === undefined) continue;
      if (typeof v !== 'string' || v.length > max) {
        res.status(400).json({ status: 'error', message: `${label} ต้องเป็นข้อความยาวไม่เกิน ${max} ตัวอักษร` });
        return;
      }
      const value = v.trim();
      if (key === 'contact_facebook' && value !== '' && !/^https?:\/\/\S+$/.test(value)) {
        res.status(400).json({ status: 'error', message: 'ลิงก์เฟซบุ๊กต้องขึ้นต้นด้วย http:// หรือ https://' });
        return;
      }
      if (key === 'contact_email' && value !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        res.status(400).json({ status: 'error', message: 'รูปแบบอีเมลไม่ถูกต้อง' });
        return;
      }
      entries.push([key, value, `ข้อมูลติดต่อ: ${label}`]);
    }
    if (entries.length === 0) {
      res.status(400).json({ status: 'error', message: 'ไม่มีค่าที่ต้องบันทึก' });
      return;
    }
    await Promise.all(
      entries.map(([key, value, description]) =>
        prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value, description } })
      )
    );
    res.json({ status: 'success', message: 'บันทึกข้อมูลติดต่อเรียบร้อยแล้ว' });
  } catch (error: any) {
    console.error('updateContactInfo error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถบันทึกข้อมูลติดต่อได้' });
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
      allowSectionTeachers,
      allowSectionGrades,
      allowSectionDve,
      allowSectionCareer,
      allowSectionGraduates,
      glowSection,
      allowSchoolExport,
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

    if (allowSectionTeachers !== undefined) {
      upsertPromises.push(
        prisma.siteSetting.upsert({
          where: { key: 'allow_section_teachers' },
          update: { value: String(allowSectionTeachers) },
          create: { key: 'allow_section_teachers', value: String(allowSectionTeachers), description: 'อนุญาตให้แก้ไขข้อมูลครูและบุคลากร' },
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

    if (allowSectionDve !== undefined) {
      upsertPromises.push(
        prisma.siteSetting.upsert({
          where: { key: 'allow_section_dve' },
          update: { value: String(allowSectionDve) },
          create: { key: 'allow_section_dve', value: String(allowSectionDve), description: 'อนุญาตให้แก้ไขข้อมูลแผนกวิชาทวิภาคี' },
        })
      );
    }

    if (allowSectionCareer !== undefined) {
      upsertPromises.push(
        prisma.siteSetting.upsert({
          where: { key: 'allow_section_career' },
          update: { value: String(allowSectionCareer) },
          create: { key: 'allow_section_career', value: String(allowSectionCareer), description: 'อนุญาตให้แก้ไขข้อมูลหลักสูตรห้องเรียนอาชีพ' },
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

    if (allowSchoolExport !== undefined) {
      upsertPromises.push(
        prisma.siteSetting.upsert({
          where: { key: 'allow_school_export' },
          update: { value: String(allowSchoolExport) },
          create: { key: 'allow_school_export', value: String(allowSchoolExport), description: 'อนุญาตให้สถานศึกษา Export Excel และพิมพ์รายงานได้' },
        })
      );
    }

    await Promise.all(upsertPromises);

    res.json({
      status: 'success',
      message: 'บันทึกการตั้งค่าสิทธิ์และการเน้นย้ำเรียบร้อยแล้ว',
      data: {
        allowSectionGeneral,
        allowSectionTeachers,
        allowSectionGrades,
        allowSectionDve,
        allowSectionCareer,
        allowSectionGraduates,
        glowSection,
        allowSchoolExport,
      },
    });
  } catch (error: any) {
    console.error('updateSubmissionPermissions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกการตั้งค่าสิทธิ์ได้',
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

/**
 * ตั้งค่ารูปลักษณ์เว็บไซต์: ธีมไว้อาลัย และหน้าข่าวสารก่อนเข้าเว็บ (เฉพาะ SUPER_ADMIN)
 * PUT /api/settings/appearance
 * ส่งมาเฉพาะ field ที่ต้องการแก้ได้ (field ที่ไม่ส่งจะไม่ถูกแตะ)
 */
const SITE_THEMES = ['normal', 'mono', 'gray'];
const WELCOME_MODES = ['fullpage', 'modal'];

export async function updateAppearanceSettings(req: Request, res: Response): Promise<void> {
  try {
    const {
      siteTheme,
      mourningRibbon,
      welcomeEnabled,
      welcomeMode,
      welcomeTitle,
      welcomeContent,
      welcomeImage,
      welcomeButtonText,
      welcomeBadgeEnabled,
      welcomeBadgeText,
    } = req.body;

    const bad = (message: string): void => {
      res.status(400).json({ status: 'error', message });
    };

    if (siteTheme !== undefined && !SITE_THEMES.includes(siteTheme)) {
      bad('ธีมไม่ถูกต้อง (ต้องเป็น normal, mono หรือ gray)');
      return;
    }
    if (welcomeMode !== undefined && !WELCOME_MODES.includes(welcomeMode)) {
      bad('รูปแบบหน้าข่าวสารไม่ถูกต้อง (ต้องเป็น fullpage หรือ modal)');
      return;
    }
    for (const [name, v] of [['mourningRibbon', mourningRibbon], ['welcomeEnabled', welcomeEnabled], ['welcomeBadgeEnabled', welcomeBadgeEnabled]] as const) {
      if (v !== undefined && typeof v !== 'boolean') {
        bad(`${name} ต้องเป็น boolean`);
        return;
      }
    }
    for (const [name, v, max] of [
      ['welcomeTitle', welcomeTitle, 200],
      ['welcomeContent', welcomeContent, 5000],
      ['welcomeButtonText', welcomeButtonText, 60],
      ['welcomeBadgeText', welcomeBadgeText, 80],
    ] as const) {
      if (v !== undefined && (typeof v !== 'string' || v.length > max)) {
        bad(`${name} ต้องเป็นข้อความยาวไม่เกิน ${max} ตัวอักษร`);
        return;
      }
    }
    if (welcomeImage !== undefined) {
      const imgErr = validateImageValue(welcomeImage);
      if (imgErr) {
        bad(imgErr);
        return;
      }
    }

    const entries: Array<[string, string, string]> = [];
    if (siteTheme !== undefined) entries.push(['site_theme', siteTheme, 'ธีมสีเว็บไซต์ (normal = ปกติ, mono = ขาวดำ, gray = เทา)']);
    if (mourningRibbon !== undefined) entries.push(['mourning_ribbon', String(mourningRibbon), 'แสดงริบบิ้นไว้อาลัยมุมขวาบน']);
    if (welcomeEnabled !== undefined) entries.push(['welcome_enabled', String(welcomeEnabled), 'เปิดหน้าข่าวสารก่อนเข้าเว็บไซต์']);
    if (welcomeMode !== undefined) entries.push(['welcome_mode', welcomeMode, 'รูปแบบหน้าข่าวสาร (fullpage = เต็มหน้า, modal = การ์ดบังหน้าจอ)']);
    if (welcomeTitle !== undefined) entries.push(['welcome_title', welcomeTitle.trim(), 'หัวข้อหน้าข่าวสารก่อนเข้าเว็บ']);
    if (welcomeContent !== undefined) entries.push(['welcome_content', welcomeContent.trim(), 'เนื้อหาหน้าข่าวสารก่อนเข้าเว็บ']);
    if (welcomeImage !== undefined) entries.push(['welcome_image', welcomeImage, 'รูปประกอบหน้าข่าวสารก่อนเข้าเว็บ']);
    if (welcomeBadgeEnabled !== undefined) entries.push(['welcome_badge_enabled', String(welcomeBadgeEnabled), 'แสดงป้ายหัวข้อเล็กเหนือหัวข้อหน้าข่าวสาร']);
    if (welcomeBadgeText !== undefined) entries.push(['welcome_badge_text', welcomeBadgeText.trim(), 'ข้อความบนป้ายหัวข้อหน้าข่าวสาร']);
    if (welcomeButtonText !== undefined) entries.push(['welcome_button_text', welcomeButtonText.trim(), 'ข้อความปุ่มเข้าสู่เว็บไซต์']);

    if (entries.length === 0) {
      bad('ไม่มีค่าที่ต้องบันทึก');
      return;
    }

    // เปลี่ยนเนื้อหาหน้าข่าวสารเมื่อไร ให้ผู้เข้าชมที่เคยกดเข้าไปแล้วเห็นหน้านี้อีกครั้ง
    // (หน้าตั้งค่าส่งช่อง welcome_* มาทุกครั้ง จึงต้องเทียบกับค่าเดิม ไม่งั้นแค่เปลี่ยนธีมก็เด้งหน้าข่าวสารซ้ำ)
    const welcomeEntries = entries.filter(([k]) => k.startsWith('welcome_'));
    if (welcomeEntries.length > 0) {
      const existing = await prisma.siteSetting.findMany({
        where: { key: { in: welcomeEntries.map(([k]) => k) } },
        select: { key: true, value: true },
      });
      const before = new Map(existing.map((r) => [r.key, r.value]));
      if (welcomeEntries.some(([k, v]) => before.get(k) !== v)) {
        entries.push(['welcome_version', String(Date.now()), 'เลขเวอร์ชันหน้าข่าวสาร (เปลี่ยนเมื่อเนื้อหาหน้าข่าวสารเปลี่ยน)']);
      }
    }

    await Promise.all(
      entries.map(([key, value, description]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value, description },
        })
      )
    );

    res.json({ status: 'success', message: 'บันทึกการตั้งค่ารูปลักษณ์เว็บไซต์เรียบร้อยแล้ว' });
  } catch (error: any) {
    console.error('updateAppearanceSettings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกการตั้งค่ารูปลักษณ์เว็บไซต์ได้',
    });
  }
}

/**
 * สถิติยอดผู้เข้าชมเว็บไซต์ (Centralized Visitor Counter)
 * สามารถกำหนดค่าเริ่มต้นก่อน Deploy ได้ที่ DEFAULT_VISITOR_BASE (เช่น 18520 หรือ 0)
 */
export const DEFAULT_VISITOR_BASE = 18520;

/**
 * ดึงยอดผู้เข้าชมเว็บไซต์
 * GET /api/settings/visitor-count
 */
export async function getVisitorCount(_req: Request, res: Response): Promise<void> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'visitor_count' },
    });
    const count = setting ? Number(setting.value) : DEFAULT_VISITOR_BASE;
    res.json({ status: 'success', count });
  } catch (error: any) {
    console.error('getVisitorCount error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลสถิติผู้เข้าชมได้' });
  }
}

// กันการนับซ้ำ: ผู้เข้าชมคนเดิม (visitorId ที่เบราว์เซอร์สร้างเอง) นับได้ครั้งเดียวต่อช่วงเวลา และจำกัดจำนวนครั้งต่อ IP กันยิงถล่ม
const VISIT_WINDOW_MS = 30 * 60 * 1000;
const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_MAX_PER_WINDOW = 600;
const VISITOR_ID_RE = /^[A-Za-z0-9-]{16,64}$/;
const recentVisitors = new Map<string, number>();
const ipHits = new Map<string, { start: number; count: number }>();

function pruneVisitorCaches(now: number): void {
  if (recentVisitors.size > 5000) {
    for (const [id, at] of recentVisitors) if (now - at > VISIT_WINDOW_MS) recentVisitors.delete(id);
  }
  if (ipHits.size > 5000) {
    for (const [ip, h] of ipHits) if (now - h.start > IP_WINDOW_MS) ipHits.delete(ip);
  }
}

/**
 * บันทึกนับยอดผู้เข้าชมเว็บไซต์เพิ่มขึ้น 1 (นับต่อผู้เข้าชมต่อ 30 นาที — รีเฟรชไม่นับซ้ำ)
 * POST /api/settings/visitor-count/increment   Body: { visitorId: string }
 */
export async function incrementVisitorCount(req: Request, res: Response): Promise<void> {
  try {
    const visitorId = req.body?.visitorId;
    const now = Date.now();
    const setting = await prisma.siteSetting.findUnique({ where: { key: 'visitor_count' } });
    const current = setting ? Number(setting.value) : DEFAULT_VISITOR_BASE;

    const ip = req.ip || 'unknown';
    const hit = ipHits.get(ip);
    if (!hit || now - hit.start > IP_WINDOW_MS) ipHits.set(ip, { start: now, count: 1 });
    else hit.count += 1;
    const overLimit = (ipHits.get(ip)?.count ?? 0) > IP_MAX_PER_WINDOW;

    const last = typeof visitorId === 'string' && VISITOR_ID_RE.test(visitorId) ? recentVisitors.get(visitorId) : undefined;
    const valid = typeof visitorId === 'string' && VISITOR_ID_RE.test(visitorId);
    if (!valid || overLimit || (last !== undefined && now - last < VISIT_WINDOW_MS)) {
      res.json({ status: 'success', count: current, counted: false });
      return;
    }

    recentVisitors.set(visitorId, now);
    pruneVisitorCaches(now);

    // เพิ่มแบบ atomic ในฐานข้อมูล (อ่านแล้วค่อยเขียน current+1 จะนับหายเมื่อมีคนเข้าพร้อมกัน)
    const bump = () => prisma.$queryRaw<Array<{ value: string }>>`
      UPDATE site_settings SET value = (value::bigint + 1)::text, "updatedAt" = NOW()
      WHERE key = 'visitor_count' AND value ~ '^[0-9]+$'
      RETURNING value`;
    let rows = await bump();
    if (rows.length === 0) {
      await prisma.siteSetting.upsert({
        where: { key: 'visitor_count' },
        update: {},
        create: {
          key: 'visitor_count',
          value: String(DEFAULT_VISITOR_BASE),
          description: 'สถิติยอดผู้เข้าชมเว็บไซต์รวม (แอดมินปรับค่าได้จากหลังบ้าน)',
        },
      });
      rows = await bump();
    }
    const next = rows.length > 0 ? Number(rows[0].value) : current;

    res.json({ status: 'success', count: next, counted: true });
  } catch (error: any) {
    console.error('incrementVisitorCount error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถนับสถิติผู้เข้าชมได้' });
  }
}

/**
 * ตั้งค่ายอดผู้เข้าชม (เฉพาะ SUPER_ADMIN) เช่น ตั้งค่าเริ่มต้นหรือรีเซ็ต
 * PUT /api/settings/visitor-count   Body: { count: number }
 */
export async function setVisitorCount(req: Request, res: Response): Promise<void> {
  try {
    const count = req.body?.count;
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0 || count > 1_000_000_000) {
      res.status(400).json({ status: 'error', message: 'ยอดผู้เข้าชมต้องเป็นจำนวนเต็ม 0 ถึง 1,000,000,000' });
      return;
    }
    await prisma.siteSetting.upsert({
      where: { key: 'visitor_count' },
      update: { value: String(count) },
      create: { key: 'visitor_count', value: String(count), description: 'สถิติยอดผู้เข้าชมเว็บไซต์รวม (แอดมินปรับค่าได้จากหลังบ้าน)' },
    });
    res.json({ status: 'success', message: 'ตั้งค่ายอดผู้เข้าชมเรียบร้อยแล้ว', count });
  } catch (error: any) {
    console.error('setVisitorCount error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถตั้งค่ายอดผู้เข้าชมได้' });
  }
}
