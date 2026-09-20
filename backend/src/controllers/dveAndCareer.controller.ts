import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

/**
 * ดึงข้อมูลแผนกวิชาทวิภาคี (DVE Departments)
 * GET /api/dve-career/departments?academicYear=2569&semester=1&institutionId=...
 */
export async function getDveDepartments(req: Request, res: Response): Promise<void> {
  try {
    const academicYear = req.query.academicYear ? Number(req.query.academicYear) : undefined;
    const semester = req.query.semester ? Number(req.query.semester) : undefined;
    const { institutionId } = req.query;

    const where: any = {};
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;
    if (institutionId && institutionId !== 'ALL') where.institutionId = String(institutionId);

    const departments = await prisma.dveDepartment.findMany({
      where,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
      orderBy: [
        { institution: { name: 'asc' } },
        { departmentName: 'asc' },
      ],
    });

    res.json({
      status: 'success',
      data: departments,
    });
  } catch (error: any) {
    console.error('getDveDepartments error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลแผนกวิชาทวิภาคีได้', detail: error.message });
  }
}

/**
 * บันทึก/แก้ไขข้อมูลแผนกวิชาทวิภาคีเป็นชุด (Batch)
 * POST /api/dve-career/departments
 */
export async function saveDveDepartments(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userRole = req.user?.role;
    const userInstitutionId = req.user?.institutionId;
    const { academicYear, semester = 1, institutionId, departments } = req.body;

    const targetInstitutionId = userRole === Role.SUPER_ADMIN ? (institutionId || userInstitutionId) : userInstitutionId;

    if (!targetInstitutionId) {
      res.status(400).json({ status: 'error', message: 'ไม่พบรหัสสถานศึกษา' });
      return;
    }

    const yearNum = Number(academicYear) || 2568;
    const semNum = Number(semester) || 1;

    if (!Array.isArray(departments)) {
      res.status(400).json({ status: 'error', message: 'ข้อมูล departments ต้องเป็นอาร์เรย์' });
      return;
    }

    // ลบรายการเดิมของสถานศึกษาในปีและภาคเรียนนี้ แล้วสร้างใหม่
    await prisma.$transaction(async (tx) => {
      await tx.dveDepartment.deleteMany({
        where: {
          institutionId: targetInstitutionId,
          academicYear: yearNum,
          semester: semNum,
        },
      });

      const validItems = departments
        .filter((d: any) => d.departmentName && String(d.departmentName).trim() !== '')
        .map((d: any) => ({
          institutionId: targetInstitutionId,
          academicYear: yearNum,
          semester: semNum,
          departmentName: String(d.departmentName).trim(),
          studentCount: Number(d.studentCount) || 0,
        }));

      if (validItems.length > 0) {
        await tx.dveDepartment.createMany({
          data: validItems,
        });
      }

      // อัปเดตยอดรวมนักเรียนทวิภาคีใน school_stats ให้อัตโนมัติ (ถ้ามีบันทึกอยู่)
      const totalDveStudents = validItems.reduce((acc, curr) => acc + curr.studentCount, 0);
      await tx.schoolStat.updateMany({
        where: {
          institutionId: targetInstitutionId,
          academicYear: yearNum,
          semester: semNum,
        },
        data: {
          dveStudentsCount: totalDveStudents,
        },
      });
    });

    const updatedList = await prisma.dveDepartment.findMany({
      where: {
        institutionId: targetInstitutionId,
        academicYear: yearNum,
        semester: semNum,
      },
    });

    res.json({
      status: 'success',
      message: 'บันทึกข้อมูลแผนกวิชาทวิภาคีสำเร็จ',
      data: updatedList,
    });
  } catch (error: any) {
    console.error('saveDveDepartments error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถบันทึกข้อมูลแผนกวิชาทวิภาคีได้', detail: error.message });
  }
}

/**
 * ดึงข้อมูลหลักสูตรห้องเรียนอาชีพ (Career Classrooms)
 * GET /api/dve-career/career-classrooms?academicYear=2569&semester=1&institutionId=...
 */
export async function getCareerClassrooms(req: Request, res: Response): Promise<void> {
  try {
    const academicYear = req.query.academicYear ? Number(req.query.academicYear) : undefined;
    const semester = req.query.semester ? Number(req.query.semester) : undefined;
    const { institutionId, trainingType } = req.query;

    const where: any = {};
    if (academicYear) where.academicYear = academicYear;
    if (semester) where.semester = semester;
    if (institutionId && institutionId !== 'ALL') where.institutionId = String(institutionId);
    if (trainingType && trainingType !== 'ALL') where.trainingType = String(trainingType);

    const classrooms = await prisma.careerClassroom.findMany({
      where,
      include: {
        partnerSchools: {
          orderBy: { createdAt: 'asc' },
        },
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
      orderBy: [
        { institution: { name: 'asc' } },
        { courseName: 'asc' },
      ],
    });

    res.json({
      status: 'success',
      data: classrooms,
    });
  } catch (error: any) {
    console.error('getCareerClassrooms error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลหลักสูตรห้องเรียนอาชีพได้', detail: error.message });
  }
}

/**
 * บันทึก/แก้ไขข้อมูลหลักสูตรห้องเรียนอาชีพเป็นชุด (Batch) พร้อมโรงเรียนเครือข่ายรายหัว (1-to-Many)
 * POST /api/dve-career/career-classrooms
 */
export async function saveCareerClassrooms(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userRole = req.user?.role;
    const userInstitutionId = req.user?.institutionId;
    const { academicYear, semester = 1, institutionId, classrooms } = req.body;

    const targetInstitutionId = userRole === Role.SUPER_ADMIN ? (institutionId || userInstitutionId) : userInstitutionId;

    if (!targetInstitutionId) {
      res.status(400).json({ status: 'error', message: 'ไม่พบรหัสสถานศึกษา' });
      return;
    }

    const yearNum = Number(academicYear) || 2568;
    const semNum = Number(semester) || 1;

    if (!Array.isArray(classrooms)) {
      res.status(400).json({ status: 'error', message: 'ข้อมูล classrooms ต้องเป็นอาร์เรย์' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // ลบข้อมูลเดิมของสถานศึกษานี้ในปี/ภาคเรียนนั้น (Cascade ลบ partnerSchools อัตโนมัติ)
      await tx.careerClassroom.deleteMany({
        where: {
          institutionId: targetInstitutionId,
          academicYear: yearNum,
          semester: semNum,
        },
      });

      const validCourses = classrooms.filter((c: any) => c.courseName && String(c.courseName).trim() !== '');

      for (const c of validCourses) {
        // ประมวลผลโรงเรียนเครือข่าย
        const rawSchools = Array.isArray(c.partnerSchools) ? c.partnerSchools : [];
        const validSchools = rawSchools
          .filter((s: any) => s.schoolName && String(s.schoolName).trim() !== '')
          .map((s: any) => ({
            schoolName: String(s.schoolName).trim(),
            studentCount: Math.max(0, Number(s.studentCount) || 0),
          }));

        // คำนวณยอดอัตโนมัติ (Auto-calculation)
        let partnerSchoolCount = validSchools.length;
        let studentCount = validSchools.reduce((sum: number, s: any) => sum + s.studentCount, 0);
        let partnerSchoolNames = validSchools.map((s: any) => s.schoolName).join(', ');

        // รองรับกรณีข้อมูลเดิมหรือกรณีไม่ได้ระบุอาร์เรย์โรงเรียน
        if (validSchools.length === 0 && (c.studentCount || c.partnerSchoolNames)) {
          partnerSchoolCount = Number(c.partnerSchoolCount) || (c.partnerSchoolNames ? c.partnerSchoolNames.split(',').length : 0);
          studentCount = Number(c.studentCount) || 0;
          partnerSchoolNames = c.partnerSchoolNames ? String(c.partnerSchoolNames).trim() : null;
        }

        await tx.careerClassroom.create({
          data: {
            institutionId: targetInstitutionId,
            academicYear: yearNum,
            semester: semNum,
            courseName: String(c.courseName).trim(),
            partnerSchoolCount,
            partnerSchoolNames: partnerSchoolNames || null,
            studentCount,
            trainingType: c.trainingType || 'SHORT_COURSE',
            learningFormat: c.learningFormat || 'ONSITE',
            partnerSchools: {
              create: validSchools,
            },
          },
        });
      }
    });

    const updatedList = await prisma.careerClassroom.findMany({
      where: {
        institutionId: targetInstitutionId,
        academicYear: yearNum,
        semester: semNum,
      },
      include: {
        partnerSchools: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { courseName: 'asc' },
    });

    res.json({
      status: 'success',
      message: 'บันทึกข้อมูลหลักสูตรห้องเรียนอาชีพสำเร็จ',
      data: updatedList,
    });
  } catch (error: any) {
    console.error('saveCareerClassrooms error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถบันทึกข้อมูลหลักสูตรห้องเรียนอาชีพได้', detail: error.message });
  }
}

/**
 * ดึงข้อมูลสรุปภาพรวมสำหรับหน้าแดชบอร์ดสาธารณะ (DVE & Career Classes Summary)
 * GET /api/dve-career/summary?academicYear=2569&semester=1
 */
export async function getDveAndCareerSummary(req: Request, res: Response): Promise<void> {
  try {
    const academicYear = req.query.academicYear ? Number(req.query.academicYear) : 2568;
    const semester = req.query.semester ? Number(req.query.semester) : 1;
    const { institutionId } = req.query;

    const baseWhere: any = { academicYear, semester };
    if (institutionId && institutionId !== 'ALL') {
      baseWhere.institutionId = String(institutionId);
    }

    const [dveDepts, careerClasses, schoolStats] = await Promise.all([
      prisma.dveDepartment.findMany({
        where: baseWhere,
        include: {
          institution: { select: { id: true, name: true, type: true } },
        },
      }),
      prisma.careerClassroom.findMany({
        where: baseWhere,
        include: {
          partnerSchools: {
            orderBy: { createdAt: 'asc' },
          },
          institution: { select: { id: true, name: true, type: true } },
        },
      }),
      prisma.schoolStat.aggregate({
        where: baseWhere,
        _sum: {
          dveStudentsCount: true,
          dualStudyCount: true,
          dualDegreeCount: true,
          totalStudents: true,
          pendingGradM3: true,
          pendingGradM6: true,
          pendingGradVoc3: true,
          maleTeachers: true,
          femaleTeachers: true,
          totalTeachers: true,
          totalStaff: true,
          totalExecutives: true,
          civilTeachersMale: true,
          civilTeachersFemale: true,
          hiredTeachersMale: true,
          hiredTeachersFemale: true,
          degreeAssociateMale: true,
          degreeAssociateFemale: true,
          degreeBachelorMale: true,
          degreeBachelorFemale: true,
          degreeMasterMale: true,
          degreeMasterFemale: true,
          degreeDoctorMale: true,
          degreeDoctorFemale: true,
        },
      }),
    ]);

    // สรุปทวิภาคี
    const totalDveStudents = schoolStats._sum.dveStudentsCount || dveDepts.reduce((s, d) => s + d.studentCount, 0);
    const totalDveDepartments = dveDepts.length;

    // รวมสถิติตามวิทยาลัย
    const institutionDveMap: Record<string, { institutionName: string; departmentCount: number; studentCount: number; departments: string[] }> = {};
    dveDepts.forEach((d) => {
      const instId = d.institutionId;
      if (!institutionDveMap[instId]) {
        institutionDveMap[instId] = {
          institutionName: d.institution.name,
          departmentCount: 0,
          studentCount: 0,
          departments: [],
        };
      }
      institutionDveMap[instId].departmentCount += 1;
      institutionDveMap[instId].studentCount += d.studentCount;
      institutionDveMap[instId].departments.push(`${d.departmentName} (${d.studentCount.toLocaleString()} คน)`);
    });

    // สรุปห้องเรียนอาชีพ
    const totalCourses = careerClasses.length;
    const totalPartnerSchools = careerClasses.reduce((s, c) => s + c.partnerSchoolCount, 0);
    const totalCareerStudents = careerClasses.reduce((s, c) => s + c.studentCount, 0);

    const byTrainingType = {
      shortCourse: careerClasses.filter((c) => c.trainingType === 'SHORT_COURSE').length,
      reskillUpskill: careerClasses.filter((c) => c.trainingType === 'RESKILL_UPSKILL').length,
    };

    const byLearningFormat = {
      onsite: careerClasses.filter((c) => c.learningFormat === 'ONSITE').length,
      workplace: careerClasses.filter((c) => c.learningFormat === 'WORKPLACE').length,
      online: careerClasses.filter((c) => c.learningFormat === 'ONLINE').length,
      hybrid: careerClasses.filter((c) => c.learningFormat === 'HYBRID').length,
    };

    res.json({
      status: 'success',
      data: {
        academicYear,
        semester,
        dveSummary: {
          totalStudents: totalDveStudents,
          totalDepartments: totalDveDepartments,
          dualStudyStudents: schoolStats._sum.dualStudyCount || 0,
          dualDegreeStudents: schoolStats._sum.dualDegreeCount || 0,
          byInstitution: Object.values(institutionDveMap),
          departmentsList: dveDepts,
        },
        careerClassSummary: {
          totalCourses,
          totalPartnerSchools,
          totalStudents: totalCareerStudents,
          byTrainingType,
          byLearningFormat,
          classroomsList: careerClasses,
        },
        pendingGraduates: {
          m3: schoolStats._sum.pendingGradM3 || 0,
          m6: schoolStats._sum.pendingGradM6 || 0,
          vocCert3: schoolStats._sum.pendingGradVoc3 || 0,
          total: (schoolStats._sum.pendingGradM3 || 0) + (schoolStats._sum.pendingGradM6 || 0) + (schoolStats._sum.pendingGradVoc3 || 0),
        },
        personnelDemographics: {
          totalTeachers: (schoolStats._sum.maleTeachers || 0) + (schoolStats._sum.femaleTeachers || 0) || (schoolStats._sum.totalTeachers || 0),
          maleTeachers: schoolStats._sum.maleTeachers || 0,
          femaleTeachers: schoolStats._sum.femaleTeachers || 0,
          civilTeachers: {
            male: schoolStats._sum.civilTeachersMale || 0,
            female: schoolStats._sum.civilTeachersFemale || 0,
            total: (schoolStats._sum.civilTeachersMale || 0) + (schoolStats._sum.civilTeachersFemale || 0),
          },
          hiredTeachers: {
            male: schoolStats._sum.hiredTeachersMale || 0,
            female: schoolStats._sum.hiredTeachersFemale || 0,
            total: (schoolStats._sum.hiredTeachersMale || 0) + (schoolStats._sum.hiredTeachersFemale || 0),
          },
          byEducation: {
            associate: {
              male: schoolStats._sum.degreeAssociateMale || 0,
              female: schoolStats._sum.degreeAssociateFemale || 0,
              total: (schoolStats._sum.degreeAssociateMale || 0) + (schoolStats._sum.degreeAssociateFemale || 0),
            },
            bachelor: {
              male: schoolStats._sum.degreeBachelorMale || 0,
              female: schoolStats._sum.degreeBachelorFemale || 0,
              total: (schoolStats._sum.degreeBachelorMale || 0) + (schoolStats._sum.degreeBachelorFemale || 0),
            },
            master: {
              male: schoolStats._sum.degreeMasterMale || 0,
              female: schoolStats._sum.degreeMasterFemale || 0,
              total: (schoolStats._sum.degreeMasterMale || 0) + (schoolStats._sum.degreeMasterFemale || 0),
            },
            doctor: {
              male: schoolStats._sum.degreeDoctorMale || 0,
              female: schoolStats._sum.degreeDoctorFemale || 0,
              total: (schoolStats._sum.degreeDoctorMale || 0) + (schoolStats._sum.degreeDoctorFemale || 0),
            },
          },
        },
      },
    });
  } catch (error: any) {
    console.error('getDveAndCareerSummary error:', error);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถสรุปข้อมูลทวิภาคีและห้องเรียนอาชีพได้', detail: error.message });
  }
}
