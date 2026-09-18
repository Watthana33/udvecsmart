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
