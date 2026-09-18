import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { InstitutionType } from '@prisma/client';

/**
 * ดึงรายชื่อสถานศึกษาทั้งหมด พร้อมรองรับการค้นหาและกรอง
 * GET /api/institutions?search=เทคนิค&type=PUBLIC
 */
export async function getInstitutions(req: Request, res: Response): Promise<void> {
  try {
    const { search, type } = req.query;

    const whereCondition: any = {};

    // กรองตามประเภท (PUBLIC หรือ PRIVATE)
    if (type && Object.values(InstitutionType).includes(type as InstitutionType)) {
      whereCondition.type = type as InstitutionType;
    }

    // ค้นหาตามชื่อสถานศึกษา หรือ รหัส
    if (search && typeof search === 'string') {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const institutions = await prisma.institution.findMany({
      where: whereCondition,
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        logoUrl: true,
        website: true,
        phone: true,
        address: true,
        province: true,
        personnels: {
          select: {
            id: true,
            name: true,
            position: true,
            photoUrl: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            personnels: true,
            schoolStats: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { code: 'asc' },
      ],
    });

    res.json({
      status: 'success',
      total: institutions.length,
      data: institutions,
    });
  } catch (error: any) {
    console.error('getInstitutions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลสถานศึกษาได้',
      detail: error.message,
    });
  }
}

/**
 * ดึงข้อมูลสถานศึกษาแบบละเอียด 1 แห่ง (รวมผู้บริหารและสถิติล่าสุด)
 * GET /api/institutions/:id
 */
export async function getInstitutionById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // ค้นหาด้วย id หรือ code (เผื่อผู้ใช้ส่งรหัสสถานศึกษามา)
    const institution = await prisma.institution.findFirst({
      where: {
        OR: [{ id: id }, { code: id }],
      },
      include: {
        personnels: {
          orderBy: { order: 'asc' },
        },
        schoolStats: {
          orderBy: [
            { academicYear: 'desc' },
            { semester: 'desc' },
          ],
          take: 5, // ดึงสถิติย้อนหลัง 5 ภาคเรียนล่าสุด
        },
      },
    });

    if (!institution) {
      res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลสถานศึกษานี้',
      });
      return;
    }

    res.json({
      status: 'success',
      data: institution,
    });
  } catch (error: any) {
    console.error('getInstitutionById error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลสถานศึกษาได้',
      detail: error.message,
    });
  }
}
