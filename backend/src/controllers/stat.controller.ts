import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

/**
 * ดึงสถิติภาพรวม (หรือสถิติเฉพาะวิทยาลัยที่เลือก)
 * GET /api/stats/overview?academicYear=2568&semester=1&institutionId=...
 */
export async function getStatsOverview(req: Request, res: Response): Promise<void> {
  try {
    let academicYear = req.query.academicYear ? Number(req.query.academicYear) : undefined;
    let semester = req.query.semester ? Number(req.query.semester) : undefined;
    const { institutionId } = req.query;

    if (!academicYear) {
      const yearSetting = await prisma.siteSetting.findUnique({
        where: { key: 'current_academic_year' },
      });
      academicYear = yearSetting ? Number(yearSetting.value) : 2568;
    }

    if (!semester) {
      const semSetting = await prisma.siteSetting.findUnique({
        where: { key: 'current_semester' },
      });
      semester = semSetting ? Number(semSetting.value) : 1;
    }

    const whereCondition: any = {
      academicYear,
      semester,
    };

    if (institutionId && typeof institutionId === 'string' && institutionId !== 'ALL') {
      whereCondition.institutionId = institutionId;
    }

    // 1. รวมสถิติทั้งหมดตามเงื่อนไข
    const aggregateResult = await prisma.schoolStat.aggregate({
      where: whereCondition,
      _sum: {
        maleStudents: true,
        femaleStudents: true,
        vocCert1: true,
        vocCert2: true,
        vocCert3: true,
        highVocCert1: true,
        highVocCert2: true,
        bachelorCount: true,
        vocCertCount: true,
        highVocCertCount: true,
        totalStudents: true,
        totalExecutives: true,
        totalTeachers: true,
        totalStaff: true,
        gradVocCertCount: true,
        gradHighVocCertCount: true,
        employedGraduatesCount: true,
        furtherStudyCount: true,
        unemployedCount: true,
        employedInField: true,
        employedOutField: true,
        employedFreelance: true,
        workGov: true,
        workPrivate: true,
        workSelf: true,
      },
      _count: {
        id: true,
      },
    });

    // 2. สถิติแยกตามสังกัด (รัฐบาล vs เอกชน) สำหรับกราฟเปรียบเทียบระดับชั้นปี
    const [publicStats, privateStats] = await Promise.all([
      prisma.schoolStat.aggregate({
        where: {
          academicYear,
          semester,
          institution: { type: 'PUBLIC' },
          ...(institutionId && institutionId !== 'ALL' ? { institutionId: String(institutionId) } : {}),
        },
        _sum: {
          vocCert1: true,
          vocCert2: true,
          vocCert3: true,
          highVocCert1: true,
          highVocCert2: true,
          bachelorCount: true,
        },
      }),
      prisma.schoolStat.aggregate({
        where: {
          academicYear,
          semester,
          institution: { type: 'PRIVATE' },
          ...(institutionId && institutionId !== 'ALL' ? { institutionId: String(institutionId) } : {}),
        },
        _sum: {
          vocCert1: true,
          vocCert2: true,
          vocCert3: true,
          highVocCert1: true,
          highVocCert2: true,
          bachelorCount: true,
        },
      }),
    ]);

    // 3. นับจำนวนสถานศึกษา และ ผู้บริหาร
    const [publicCount, privateCount, totalInstitutions, totalExecutives] = await Promise.all([
      prisma.institution.count({ where: { type: 'PUBLIC' } }),
      prisma.institution.count({ where: { type: 'PRIVATE' } }),
      prisma.institution.count(),
      prisma.personnel.count({
        where: institutionId && institutionId !== 'ALL' ? { institutionId: String(institutionId) } : {},
      }),
    ]);

    const sums = aggregateResult._sum;

    res.json({
      status: 'success',
      data: {
        academicYear,
        semester,
        selectedInstitutionId: institutionId || 'ALL',
        reportingSchoolsCount: aggregateResult._count.id,
        institutions: {
          total: totalInstitutions,
          public: publicCount,
          private: privateCount,
        },
        executivesCount: (sums.totalExecutives || 0) > 0 ? (sums.totalExecutives || 0) : totalExecutives,
        students: {
          male: sums.maleStudents || 0,
          female: sums.femaleStudents || 0,
          vocCert: sums.vocCertCount || 0,
          highVocCert: sums.highVocCertCount || 0,
          bachelor: sums.bachelorCount || 0,
          total: sums.totalStudents || 0,
          byGrade: {
            vocCert1: sums.vocCert1 || 0,
            vocCert2: sums.vocCert2 || 0,
            vocCert3: sums.vocCert3 || 0,
            highVocCert1: sums.highVocCert1 || 0,
            highVocCert2: sums.highVocCert2 || 0,
            bachelor: sums.bachelorCount || 0,
          },
        },
        bySectorGrades: {
          public: {
            vocCert1: publicStats._sum.vocCert1 || 0,
            vocCert2: publicStats._sum.vocCert2 || 0,
            vocCert3: publicStats._sum.vocCert3 || 0,
            highVocCert1: publicStats._sum.highVocCert1 || 0,
            highVocCert2: publicStats._sum.highVocCert2 || 0,
            bachelor: publicStats._sum.bachelorCount || 0,
          },
          private: {
            vocCert1: privateStats._sum.vocCert1 || 0,
            vocCert2: privateStats._sum.vocCert2 || 0,
            vocCert3: privateStats._sum.vocCert3 || 0,
            highVocCert1: privateStats._sum.highVocCert1 || 0,
            highVocCert2: privateStats._sum.highVocCert2 || 0,
            bachelor: privateStats._sum.bachelorCount || 0,
          },
        },
        personnel: {
          teachers: sums.totalTeachers || 0,
          staff: sums.totalStaff || 0,
          total: (sums.totalTeachers || 0) + (sums.totalStaff || 0),
        },
        graduatesEmployment: {
          gradVocCert: sums.gradVocCertCount || 0,
          gradHighVocCert: sums.gradHighVocCertCount || 0,
          totalGraduates: (sums.gradVocCertCount || 0) + (sums.gradHighVocCertCount || 0),
          employed: sums.employedGraduatesCount || 0,
          furtherStudy: sums.furtherStudyCount || 0,
          unemployed: sums.unemployedCount || 0,
          byJobType: {
            inField: sums.employedInField || 0,
            outField: sums.employedOutField || 0,
            freelance: sums.employedFreelance || 0,
            unemployed: sums.unemployedCount || 0,
          },
          byWorkplace: {
            government: sums.workGov || 0,
            private: sums.workPrivate || 0,
            selfEmployed: sums.workSelf || 0,
          },
        },
      },
    });
  } catch (error: any) {
    console.error('getStatsOverview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถคำนวณสถิติภาพรวมได้',
      detail: error.message,
    });
  }
}

/**
 * ดึงข้อมูลสถิติแยกรายสถานศึกษา
 * GET /api/stats/by-institution?academicYear=2568&semester=1
 */
export async function getStatsByInstitution(req: Request, res: Response): Promise<void> {
  try {
    let academicYear = req.query.academicYear ? Number(req.query.academicYear) : 2568;
    let semester = req.query.semester ? Number(req.query.semester) : 1;

    const stats = await prisma.schoolStat.findMany({
      where: {
        academicYear,
        semester,
      },
      include: {
        institution: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            logoUrl: true,
            website: true,
            phone: true,
          },
        },
      },
      orderBy: {
        totalStudents: 'desc',
      },
    });

    res.json({
      status: 'success',
      academicYear,
      semester,
      total: stats.length,
      data: stats,
    });
  } catch (error: any) {
    console.error('getStatsByInstitution error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลสถิติรายสถานศึกษาได้',
      detail: error.message,
    });
  }
}

/**
 * ดึงข้อมูลสถิติของสถานศึกษาของผู้ใช้งานปัจจุบัน (สำหรับหน้ากรอกข้อมูล School Admin)
 * GET /api/stats/my-school?academicYear=2568&semester=1
 */
export async function getMySchoolStat(req: AuthRequest, res: Response): Promise<void> {
  try {
    const institutionId = (req.user?.role === Role.SUPER_ADMIN && req.query.institutionId)
      ? String(req.query.institutionId)
      : req.user?.institutionId;

    if (!institutionId) {
      res.status(400).json({
        status: 'error',
        message: 'ผู้ใช้นี้ไม่ได้ผูกกับสถานศึกษาใด หรือไม่ได้ระบุ institutionId',
      });
      return;
    }

    const academicYear = req.query.academicYear ? Number(req.query.academicYear) : 2568;
    const semester = req.query.semester ? Number(req.query.semester) : 1;

    const [stat, institution, settingsList] = await Promise.all([
      prisma.schoolStat.findUnique({
        where: {
          institutionId_academicYear_semester: {
            institutionId,
            academicYear,
            semester,
          },
        },
      }),
      prisma.institution.findUnique({
        where: { id: institutionId },
        select: {
          id: true,
          name: true,
          code: true,
          type: true,
          programsCount: true,
          programsList: true,
          programsUrl: true,
          phone: true,
          website: true,
          address: true,
          personnels: {
            where: { order: 1 },
            select: { name: true, position: true, photoUrl: true },
          },
        },
      }),
      prisma.siteSetting.findMany({
        where: {
          key: {
            in: [
              'is_data_submission_open',
              'allow_section_general',
              'allow_section_teachers',
              'allow_section_grades',
              'allow_section_dve',
              'allow_section_career',
              'allow_section_graduates',
              'glow_section',
              'allow_school_export',
            ],
          },
        },
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    settingsList.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const isSubmissionOpen = settingsMap['is_data_submission_open'] !== 'false';
    const allowSectionGeneral = settingsMap['allow_section_general'] !== 'false';
    const allowSectionTeachers = settingsMap['allow_section_teachers'] !== 'false';
    const allowSectionGrades = settingsMap['allow_section_grades'] !== 'false';
    const allowSectionDve = settingsMap['allow_section_dve'] !== 'false';
    const allowSectionCareer = settingsMap['allow_section_career'] !== 'false';
    const allowSectionGraduates = settingsMap['allow_section_graduates'] !== 'false';
    const glowSection = settingsMap['glow_section'] || 'none';
    const allowSchoolExport = settingsMap['allow_school_export'] === 'true';

    res.json({
      status: 'success',
      isSubmissionOpen,
      permissions: {
        allowSectionGeneral,
        allowSectionTeachers,
        allowSectionGrades,
        allowSectionDve,
        allowSectionCareer,
        allowSectionGraduates,
        glowSection,
        allowSchoolExport,
      },
      institution,
      academicYear,
      semester,
      data: stat,
    });
  } catch (error: any) {
    console.error('getMySchoolStat error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลสถิติของสถานศึกษาได้',
      detail: error.message,
    });
  }
}

/**
 * บันทึกหรืออัปเดตข้อมูลสถิติประจำสถานศึกษา (สำหรับ SCHOOL_ADMIN หรือ SUPER_ADMIN แก้ไขให้วิทยาลัย)
 * POST /api/stats/submit
 */
export async function submitSchoolStat(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userRole = req.user?.role;
    const userInstitutionId = req.user?.institutionId;

    // 1. ตรวจสอบสถานะเปิดรับข้อมูลจาก SiteSetting (เฉพาะ School Admin ที่ถูกบล็อกหากปิดระบบ)
    const submissionSetting = await prisma.siteSetting.findUnique({
      where: { key: 'is_data_submission_open' },
    });
    const isSubmissionOpen = submissionSetting ? submissionSetting.value === 'true' : true;

    if (!isSubmissionOpen && userRole !== Role.SUPER_ADMIN) {
      res.status(403).json({
        status: 'error',
        message: 'ขณะนี้ระบบปิดรับการรายงานข้อมูลสถิติ กรุณาติดต่อผู้ดูแลระบบ สอจ.อุดรธานี เพื่อเปิดระบบ',
      });
      return;
    }

    const body = req.body;
    const targetInstitutionId = userRole === Role.SUPER_ADMIN ? (body.institutionId || userInstitutionId) : userInstitutionId;

    if (!targetInstitutionId) {
      res.status(400).json({
        status: 'error',
        message: 'ไม่พบรหัสสถานศึกษาที่ต้องการบันทึกข้อมูล',
      });
      return;
    }

    const academicYear = Number(body.academicYear) || 2568;
    const semester = Number(body.semester) || 1;

    let maleStudents = Number(body.maleStudents) || 0;
    let femaleStudents = Number(body.femaleStudents) || 0;

    const vocCert1 = Number(body.vocCert1) || 0;
    const vocCert2 = Number(body.vocCert2) || 0;
    const vocCert3 = Number(body.vocCert3) || 0;
    const highVocCert1 = Number(body.highVocCert1) || 0;
    const highVocCert2 = Number(body.highVocCert2) || 0;
    const bachelorCount = Number(body.bachelorCount) || 0;

    const vocCertCount = vocCert1 + vocCert2 + vocCert3;
    const highVocCertCount = highVocCert1 + highVocCert2;
    const sumByGrades = vocCertCount + highVocCertCount + bachelorCount;

    // Auto-correlate totalStudents, maleStudents, and femaleStudents
    let totalStudents = maleStudents + femaleStudents;
    if (totalStudents === 0 && sumByGrades > 0) {
      totalStudents = sumByGrades;
      maleStudents = Math.ceil(sumByGrades / 2);
      femaleStudents = sumByGrades - maleStudents;
    } else if (sumByGrades > 0) {
      totalStudents = sumByGrades;
      if (maleStudents + femaleStudents === 0) {
        maleStudents = Math.ceil(sumByGrades / 2);
        femaleStudents = sumByGrades - maleStudents;
      }
    }

    const maleTeachers = Number(body.maleTeachers) || 0;
    const femaleTeachers = Number(body.femaleTeachers) || 0;
    let totalTeachers = Number(body.totalTeachers) || 0;
    if (totalTeachers === 0 && (maleTeachers + femaleTeachers) > 0) {
      totalTeachers = maleTeachers + femaleTeachers;
    }

    const totalExecutives = Number(body.totalExecutives) || 1;
    const totalStaff = Number(body.totalStaff) || 0;

    const gradVocCertCount = Number(body.gradVocCertCount) || 0;
    const gradHighVocCertCount = Number(body.gradHighVocCertCount) || 0;

    const employedInField = Number(body.employedInField) || 0;
    const employedOutField = Number(body.employedOutField) || 0;
    const employedFreelance = Number(body.employedFreelance) || 0;
    const employedGraduatesCount = employedInField + employedOutField + employedFreelance;

    const furtherStudyCount = Number(body.furtherStudyCount) || 0;
    const unemployedCount = Number(body.unemployedCount) || 0;

    const workGov = Number(body.workGov) || 0;
    const workPrivate = Number(body.workPrivate) || 0;
    const workSelf = Number(body.workSelf) || 0;

    // กลุ่ม 2: สถิตินักเรียนศึกษาต่อ แต่ยังไม่สำเร็จการศึกษา
    const pendingGradM3 = Number(body.pendingGradM3) || 0;
    const pendingGradM6 = Number(body.pendingGradM6) || 0;
    const pendingGradVoc3 = Number(body.pendingGradVoc3) || 0;

    // กลุ่ม 3: ข้อมูลสารสนเทศด้านการจัดการอาชีวศึกษา
    const dveStudentsCount = Number(body.dveStudentsCount) || 0;
    const dualStudyCount = Number(body.dualStudyCount) || 0;
    const dualDegreeCount = Number(body.dualDegreeCount) || 0;
    const fttAssessment = Boolean(body.fttAssessment);

    // กลุ่ม 4: ข้อมูลบุคลากรทางการศึกษา จำแนกเพศและวุฒิการศึกษา
    const degreeAssociateMale = Number(body.degreeAssociateMale) || 0;
    const degreeAssociateFemale = Number(body.degreeAssociateFemale) || 0;
    const degreeBachelorMale = Number(body.degreeBachelorMale) || 0;
    const degreeBachelorFemale = Number(body.degreeBachelorFemale) || 0;
    const degreeMasterMale = Number(body.degreeMasterMale) || 0;
    const degreeMasterFemale = Number(body.degreeMasterFemale) || 0;
    const degreeDoctorMale = Number(body.degreeDoctorMale) || 0;
    const degreeDoctorFemale = Number(body.degreeDoctorFemale) || 0;
    const civilTeachersMale = Number(body.civilTeachersMale) || 0;
    const civilTeachersFemale = Number(body.civilTeachersFemale) || 0;
    const hiredTeachersMale = Number(body.hiredTeachersMale) || 0;
    const hiredTeachersFemale = Number(body.hiredTeachersFemale) || 0;

    const stat = await prisma.schoolStat.upsert({
      where: {
        institutionId_academicYear_semester: {
          institutionId: targetInstitutionId,
          academicYear,
          semester,
        },
      },
      update: {
        maleStudents,
        femaleStudents,
        vocCert1,
        vocCert2,
        vocCert3,
        highVocCert1,
        highVocCert2,
        bachelorCount,
        vocCertCount,
        highVocCertCount,
        totalStudents,
        totalExecutives,
        totalTeachers,
        totalStaff,
        pendingGradM3,
        pendingGradM6,
        pendingGradVoc3,
        dveStudentsCount,
        dualStudyCount,
        dualDegreeCount,
        fttAssessment,
        maleTeachers,
        femaleTeachers,
        degreeAssociateMale,
        degreeAssociateFemale,
        degreeBachelorMale,
        degreeBachelorFemale,
        degreeMasterMale,
        degreeMasterFemale,
        degreeDoctorMale,
        degreeDoctorFemale,
        civilTeachersMale,
        civilTeachersFemale,
        hiredTeachersMale,
        hiredTeachersFemale,
        gradVocCertCount,
        gradHighVocCertCount,
        employedGraduatesCount,
        furtherStudyCount,
        unemployedCount,
        employedInField,
        employedOutField,
        employedFreelance,
        workGov,
        workPrivate,
        workSelf,
      },
      create: {
        institutionId: targetInstitutionId,
        academicYear,
        semester,
        maleStudents,
        femaleStudents,
        vocCert1,
        vocCert2,
        vocCert3,
        highVocCert1,
        highVocCert2,
        bachelorCount,
        vocCertCount,
        highVocCertCount,
        totalStudents,
        totalExecutives,
        totalTeachers,
        totalStaff,
        pendingGradM3,
        pendingGradM6,
        pendingGradVoc3,
        dveStudentsCount,
        dualStudyCount,
        dualDegreeCount,
        fttAssessment,
        maleTeachers,
        femaleTeachers,
        degreeAssociateMale,
        degreeAssociateFemale,
        degreeBachelorMale,
        degreeBachelorFemale,
        degreeMasterMale,
        degreeMasterFemale,
        degreeDoctorMale,
        degreeDoctorFemale,
        civilTeachersMale,
        civilTeachersFemale,
        hiredTeachersMale,
        hiredTeachersFemale,
        gradVocCertCount,
        gradHighVocCertCount,
        employedGraduatesCount,
        furtherStudyCount,
        unemployedCount,
        employedInField,
        employedOutField,
        employedFreelance,
        workGov,
        workPrivate,
        workSelf,
      },
    });


    // หากมีการส่งข้อมูลผู้บริหาร หรือข้อมูลติดต่อสถานศึกษามาด้วย ให้อัปเดตไปพร้อมกัน
    if (body.directorName || body.photoUrl !== undefined || body.phone || body.website || body.address || body.programsCount !== undefined || body.programsList !== undefined || body.programsUrl !== undefined) {
      await prisma.institution.update({
        where: { id: targetInstitutionId },
        data: {
          ...(body.phone !== undefined ? { phone: body.phone } : {}),
          ...(body.website !== undefined ? { website: body.website } : {}),
          ...(body.address !== undefined ? { address: body.address } : {}),
          ...(body.programsCount !== undefined ? { programsCount: Number(body.programsCount) } : {}),
          ...(body.programsList !== undefined ? { programsList: typeof body.programsList === 'string' ? body.programsList : JSON.stringify(body.programsList) } : {}),
          ...(body.programsUrl !== undefined ? { programsUrl: body.programsUrl } : {}),
        },
      });

      if (body.directorName || body.photoUrl !== undefined) {
        const existingPersonnel = await prisma.personnel.findFirst({
          where: { institutionId: targetInstitutionId, order: 1 },
        });

        if (existingPersonnel) {
          await prisma.personnel.update({
            where: { id: existingPersonnel.id },
            data: {
              ...(body.directorName ? { name: body.directorName } : {}),
              ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl } : {}),
            },
          });
        } else {
          await prisma.personnel.create({
            data: {
              name: body.directorName || 'ผู้อำนวยการวิทยาลัย',
              position: 'ผู้อำนวยการวิทยาลัย',
              photoUrl: body.photoUrl || null,
              order: 1,
              institutionId: targetInstitutionId,
            },
          });
        }
      }
    }

    res.json({
      status: 'success',
      message: 'บันทึกข้อมูลสถิติเรียบร้อยแล้ว',
      data: stat,
    });
  } catch (error: any) {
    console.error('submitSchoolStat error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถบันทึกข้อมูลสถิติได้',
      detail: error.message,
    });
  }
}

/**
 * ดึงรายการสถานะการส่งข้อมูลของทุกสถานศึกษา (สำหรับหน้าจอ สอจ. Super Admin)
 * GET /api/stats/submission-status?academicYear=2568&semester=1
 */
export async function getSubmissionStatusList(req: Request, res: Response): Promise<void> {
  try {
    const academicYear = req.query.academicYear ? Number(req.query.academicYear) : 2568;
    const semester = req.query.semester ? Number(req.query.semester) : 1;

    const [institutions, stats, submissionSetting] = await Promise.all([
      prisma.institution.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          phone: true,
          programsCount: true,
        },
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
      }),
      prisma.schoolStat.findMany({
        where: {
          academicYear,
          semester,
        },
        select: {
          id: true,
          institutionId: true,
          totalStudents: true,
          totalExecutives: true,
          vocCertCount: true,
          highVocCertCount: true,
          bachelorCount: true,
          maleStudents: true,
          femaleStudents: true,
          totalTeachers: true,
          totalStaff: true,
          updatedAt: true,
        },
      }),
      prisma.siteSetting.findMany({
        where: {
          key: {
            in: [
              'is_data_submission_open',
              'allow_section_general',
              'allow_section_grades',
              'allow_section_graduates',
              'allow_section_teachers',
              'allow_section_dve',
              'allow_section_career',
              'glow_section',
              'allow_school_export',
            ],
          },
        },
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    submissionSetting.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const isSubmissionOpen = settingsMap['is_data_submission_open'] !== 'false';
    const allowSchoolExport = settingsMap['allow_school_export'] === 'true';
    const allowSectionGeneral = settingsMap['allow_section_general'] !== 'false';
    const allowSectionGrades = settingsMap['allow_section_grades'] !== 'false';
    const allowSectionGraduates = settingsMap['allow_section_graduates'] !== 'false';
    const allowSectionTeachers = settingsMap['allow_section_teachers'] !== 'false';
    const allowSectionDve = settingsMap['allow_section_dve'] !== 'false';
    const allowSectionCareer = settingsMap['allow_section_career'] !== 'false';
    const glowSection = settingsMap['glow_section'] || 'none';

    const statMap = new Map(stats.map((s) => [s.institutionId, s]));

    const statusList = institutions.map((inst) => {
      const stat = statMap.get(inst.id);
      return {
        id: inst.id,
        code: inst.code,
        name: inst.name,
        type: inst.type,
        phone: inst.phone,
        programsCount: inst.programsCount,
        isSubmitted: !!stat,
        totalStudents: stat?.totalStudents ?? 0,
        totalExecutives: stat?.totalExecutives ?? 1,
        vocCertCount: stat?.vocCertCount ?? 0,
        highVocCertCount: stat?.highVocCertCount ?? 0,
        bachelorCount: stat?.bachelorCount ?? 0,
        maleStudents: stat?.maleStudents ?? 0,
        femaleStudents: stat?.femaleStudents ?? 0,
        totalTeachers: stat?.totalTeachers ?? 0,
        totalStaff: stat?.totalStaff ?? 0,
        updatedAt: stat?.updatedAt ?? null,
      };
    });

    const submittedCount = statusList.filter((s) => s.isSubmitted).length;

    res.json({
      status: 'success',
      academicYear,
      semester,
      isSubmissionOpen,
      permissions: {
        allowSectionGeneral,
        allowSectionGrades,
        allowSectionGraduates,
        allowSectionTeachers,
        allowSectionDve,
        allowSectionCareer,
        glowSection,
        allowSchoolExport,
      },
      totalInstitutions: institutions.length,
      submittedCount,
      pendingCount: institutions.length - submittedCount,
      data: statusList,
    });
  } catch (error: any) {
    console.error('getSubmissionStatusList error:', error);
    res.status(500).json({
      status: 'error',
      message: 'ไม่สามารถดึงข้อมูลสถานะการส่งข้อมูลได้',
      detail: error.message,
    });
  }
}

