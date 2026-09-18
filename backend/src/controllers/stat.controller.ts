import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

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
        executivesCount: totalExecutives,
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
