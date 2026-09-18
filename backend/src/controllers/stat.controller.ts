import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

/**
 * ดึงสถิติภาพรวมทั้งจังหวัดอุดรธานี (Aggregation)
 * GET /api/stats/overview?academicYear=2567&semester=1
 */
export async function getStatsOverview(req: Request, res: Response): Promise<void> {
  try {
    let academicYear = req.query.academicYear ? Number(req.query.academicYear) : undefined;
    let semester = req.query.semester ? Number(req.query.semester) : undefined;

    // หากไม่ได้ระบุปี ให้ดึงปีและเทอมล่าสุดจาก SiteSetting
    if (!academicYear) {
      const yearSetting = await prisma.siteSetting.findUnique({
        where: { key: 'current_academic_year' },
      });
      academicYear = yearSetting ? Number(yearSetting.value) : 2567;
    }

    if (!semester) {
      const semSetting = await prisma.siteSetting.findUnique({
        where: { key: 'current_semester' },
      });
      semester = semSetting ? Number(semSetting.value) : 1;
    }

    // 1. คำนวณผลรวมสถิติของนักเรียน ครู และผู้สำเร็จการศึกษาทั้งจังหวัด
    const aggregateResult = await prisma.schoolStat.aggregate({
      where: {
        academicYear,
        semester,
      },
      _sum: {
        vocCertCount: true,
        highVocCertCount: true,
        bachelorCount: true,
        totalStudents: true,
        totalTeachers: true,
        totalStaff: true,
        employedGraduatesCount: true,
        furtherStudyCount: true,
        unemployedCount: true,
      },
      _count: {
        id: true,
      },
    });

    // 2. นับจำนวนสถานศึกษาทั้งหมดในระบบ (แยก รัฐ / เอกชน)
    const [publicCount, privateCount, totalInstitutions] = await Promise.all([
      prisma.institution.count({ where: { type: 'PUBLIC' } }),
      prisma.institution.count({ where: { type: 'PRIVATE' } }),
      prisma.institution.count(),
    ]);

    const sums = aggregateResult._sum;

    res.json({
      status: 'success',
      data: {
        academicYear,
        semester,
        reportingSchoolsCount: aggregateResult._count.id,
        institutions: {
          total: totalInstitutions,
          public: publicCount,
          private: privateCount,
        },
        students: {
          vocCert: sums.vocCertCount || 0, // ปวช.
          highVocCert: sums.highVocCertCount || 0, // ปวส.
          bachelor: sums.bachelorCount || 0, // ป.ตรี ทล.บ.
          total: sums.totalStudents || 0,
        },
        personnel: {
          teachers: sums.totalTeachers || 0, // ครูผู้สอน
          staff: sums.totalStaff || 0, // บุคลากรสนับสนุน
          total: (sums.totalTeachers || 0) + (sums.totalStaff || 0),
        },
        graduatesEmployment: {
          employed: sums.employedGraduatesCount || 0, // มีงานทำ
          furtherStudy: sums.furtherStudyCount || 0, // ศึกษาต่อ
          unemployed: sums.unemployedCount || 0, // ว่างงาน
          totalReported:
            (sums.employedGraduatesCount || 0) +
            (sums.furtherStudyCount || 0) +
            (sums.unemployedCount || 0),
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
 * ดึงข้อมูลสถิติแยกรายสถานศึกษา (สำหรับทำกราฟเปรียบเทียบ)
 * GET /api/stats/by-institution?academicYear=2567&semester=1
 */
export async function getStatsByInstitution(req: Request, res: Response): Promise<void> {
  try {
    let academicYear = req.query.academicYear ? Number(req.query.academicYear) : 2567;
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
