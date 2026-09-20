import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { InstitutionType, Role } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware.js';

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
        programsCount: true,
        programsList: true,
        programsUrl: true,
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

/**
 * อัปเดตข้อมูลผู้บริหาร / ภาพถ่าย / ข้อมูลติดต่อสถานศึกษา
 * PATCH /api/institutions/:id/director
 */
export async function updateInstitutionDirector(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user;

    // ตรวจสอบสิทธิ์: SUPER_ADMIN ทำได้ทุกแห่ง, SCHOOL_ADMIN ทำได้เฉพาะสถานศึกษาตนเอง
    if (user?.role !== Role.SUPER_ADMIN && user?.institutionId !== id) {
      res.status(403).json({
        status: 'error',
        message: 'คุณไม่มีสิทธิ์แก้ไขข้อมูลของสถานศึกษานี้',
      });
      return;
    }

    const { directorName, position, photoUrl, phone, website, address, programsCount, programsList, programsUrl } = req.body;

    // 1. อัปเดตข้อมูลสถานศึกษา
    const updatedInst = await prisma.institution.update({
      where: { id },
      data: {
        ...(phone !== undefined ? { phone } : {}),
        ...(website !== undefined ? { website } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(programsCount !== undefined ? { programsCount: Number(programsCount) } : {}),
        ...(programsList !== undefined ? { programsList: typeof programsList === 'string' ? programsList : JSON.stringify(programsList) } : {}),
        ...(programsUrl !== undefined ? { programsUrl: programsUrl } : {}),
      },
    });

    // 2. อัปเดตหรือสร้าง Personnel ลำดับที่ 1 (ผู้บริหาร)
    if (directorName !== undefined || photoUrl !== undefined || position !== undefined) {
      const existingPersonnel = await prisma.personnel.findFirst({
        where: { institutionId: id, order: 1 },
      });

      if (existingPersonnel) {
        await prisma.personnel.update({
          where: { id: existingPersonnel.id },
          data: {
            ...(directorName ? { name: directorName } : {}),
            ...(position ? { position } : {}),
            ...(photoUrl !== undefined ? { photoUrl } : {}),
          },
        });
      } else {
        await prisma.personnel.create({
          data: {
            name: directorName || 'ผู้อำนวยการวิทยาลัย',
            position: position || 'ผู้อำนวยการวิทยาลัย',
            photoUrl: photoUrl || null,
            order: 1,
            institutionId: id,
          },
        });
      }
    }

    // ดึงข้อมูลอัปเดตล่าสุดส่งกลับ
    const result = await prisma.institution.findUnique({
      where: { id },
      include: {
        personnels: { orderBy: { order: 'asc' } },
      },
    });

    res.json({
      status: 'success',
      message: 'อัปเดตข้อมูลผู้บริหารและสถานศึกษาสำเร็จ',
      data: result,
    });
  } catch (error: any) {
    console.error('updateInstitutionDirector error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถอัปเดตข้อมูลผู้บริหารได้',
      detail: error.message,
    });
  }
}

/**
 * เพิ่มสถานศึกษาใหม่ (สำหรับ SUPER_ADMIN)
 * POST /api/institutions
 */
export async function createInstitution(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.user?.role !== Role.SUPER_ADMIN) {
      res.status(403).json({
        status: 'error',
        message: 'มีเพียงผู้ดูแลระบบ สอจ. เท่านั้นที่มีสิทธิ์เพิ่มสถานศึกษา',
      });
      return;
    }

    const { code, name, type, directorName, phone, website, address, programsCount, programsList, programsUrl } = req.body;

    if (!code || !name) {
      res.status(400).json({
        status: 'error',
        message: 'กรุณาระบุรหัสและชื่อสถานศึกษาให้ครบถ้วน',
      });
      return;
    }

    const existing = await prisma.institution.findUnique({ where: { code } });
    if (existing) {
      res.status(400).json({
        status: 'error',
        message: `รหัสสถานศึกษา ${code} มีอยู่ในระบบแล้ว`,
      });
      return;
    }

    const newInst = await prisma.institution.create({
      data: {
        code,
        name,
        type: type === 'PRIVATE' ? InstitutionType.PRIVATE : InstitutionType.PUBLIC,
        phone: phone || null,
        website: website || null,
        address: address || null,
        programsCount: Number(programsCount) || 10,
        programsList: programsList ? (typeof programsList === 'string' ? programsList : JSON.stringify(programsList)) : null,
        programsUrl: programsUrl || null,
        personnels: {
          create: {
            name: directorName || 'ผู้อำนวยการวิทยาลัย',
            position: 'ผู้อำนวยการวิทยาลัย',
            order: 1,
          },
        },
      },
      include: {
        personnels: true,
      },
    });

    res.status(201).json({
      status: 'success',
      message: 'เพิ่มสถานศึกษาใหม่เรียบร้อยแล้ว',
      data: newInst,
    });
  } catch (error: any) {
    console.error('createInstitution error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถสร้างสถานศึกษาได้',
      detail: error.message,
    });
  }
}

/**
 * ลบสถานศึกษา (สำหรับ SUPER_ADMIN)
 * DELETE /api/institutions/:id
 */
export async function deleteInstitution(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.user?.role !== Role.SUPER_ADMIN) {
      res.status(403).json({
        status: 'error',
        message: 'มีเพียงผู้ดูแลระบบ สอจ. เท่านั้นที่มีสิทธิ์ลบสถานศึกษา',
      });
      return;
    }

    const { id } = req.params;

    const existing = await prisma.institution.findUnique({
      where: { id },
      select: { id: true, name: true, code: true },
    });

    if (!existing) {
      res.status(404).json({
        status: 'error',
        message: 'ไม่พบข้อมูลสถานศึกษาที่ต้องการลบ',
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // 1. ลบโรงเรียนเครือข่ายห้องเรียนอาชีพของสถานศึกษานี้
      const careerClassrooms = await tx.careerClassroom.findMany({
        where: { institutionId: id },
        select: { id: true },
      });
      const careerIds = careerClassrooms.map((c) => c.id);
      if (careerIds.length > 0) {
        await tx.careerPartnerSchool.deleteMany({
          where: { careerClassroomId: { in: careerIds } },
        });
      }

      // 2. ลบห้องเรียนอาชีพ
      await tx.careerClassroom.deleteMany({
        where: { institutionId: id },
      });

      // 3. ลบข้อมูลทวิภาคีรายแผนก
      await tx.dveDepartment.deleteMany({
        where: { institutionId: id },
      });

      // 4. ลบข้อมูลสถิติประจำปี
      await tx.schoolStat.deleteMany({
        where: { institutionId: id },
      });

      // 5. ลบข้อมูลบุคลากร/ผู้บริหาร
      await tx.personnel.deleteMany({
        where: { institutionId: id },
      });

      // 6. ลบผู้ใช้งานระดับสถานศึกษา (SCHOOL_ADMIN) ที่สังกัดสถานศึกษานี้
      await tx.user.deleteMany({
        where: {
          institutionId: id,
          role: Role.SCHOOL_ADMIN,
        },
      });

      // 7. ลบข้อมูลสถานศึกษา
      await tx.institution.delete({
        where: { id },
      });
    });

    res.json({
      status: 'success',
      message: `ลบสถานศึกษา "${existing.name}" (${existing.code}) เรียบร้อยแล้ว`,
    });
  } catch (error: any) {
    console.error('deleteInstitution error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถลบสถานศึกษาได้',
      detail: error.message,
    });
  }
}


