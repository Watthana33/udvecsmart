import { PrismaClient, InstitutionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Seeding Comprehensive Stats for all 5 Data Groups (Years 2568 & 2569)...');

  // 1. Fetch all institutions
  const institutions = await prisma.institution.findMany({
    orderBy: { code: 'asc' },
  });
  console.log(`Found ${institutions.length} institutions in database.`);

  const academicPeriods = [
    { year: 2569, semester: 1 },
    { year: 2568, semester: 1 },
    { year: 2568, semester: 2 },
  ];

  for (const period of academicPeriods) {
    const { year, semester } = period;
    console.log(`\n📦 Processing Year ${year} Semester ${semester}...`);

    for (let i = 0; i < institutions.length; i++) {
      const inst = institutions[i];
      const isPublic = inst.type === InstitutionType.PUBLIC;
      const factor = year === 2569 ? 1.05 : 1.0;

      // Base demographics
      const baseTeachers = isPublic ? Math.floor(45 + (i % 8) * 12) : Math.floor(20 + (i % 6) * 4);
      const maleTeachers = Math.floor(baseTeachers * (isPublic ? 0.48 : 0.42));
      const femaleTeachers = baseTeachers - maleTeachers;

      // Degree breakdown for male
      const degreeAssociateMale = Math.max(1, Math.floor(maleTeachers * 0.08));
      const degreeBachelorMale = Math.floor(maleTeachers * 0.65);
      const degreeMasterMale = Math.floor(maleTeachers * 0.23);
      const degreeDoctorMale = Math.max(0, maleTeachers - (degreeAssociateMale + degreeBachelorMale + degreeMasterMale));

      // Degree breakdown for female
      const degreeAssociateFemale = Math.max(1, Math.floor(femaleTeachers * 0.06));
      const degreeBachelorFemale = Math.floor(femaleTeachers * 0.62);
      const degreeMasterFemale = Math.floor(femaleTeachers * 0.28);
      const degreeDoctorFemale = Math.max(0, femaleTeachers - (degreeAssociateFemale + degreeBachelorFemale + degreeMasterFemale));

      // Teacher Employment Type
      const civilRatio = isPublic ? 0.65 : 0.15;
      const civilTeachersMale = Math.floor(maleTeachers * civilRatio);
      const hiredTeachersMale = maleTeachers - civilTeachersMale;
      const civilTeachersFemale = Math.floor(femaleTeachers * civilRatio);
      const hiredTeachersFemale = femaleTeachers - civilTeachersFemale;

      // Pending Graduates (กลุ่ม 2)
      const pendingGradM3 = Math.floor((12 + (i % 7) * 4) * factor);
      const pendingGradM6 = Math.floor((8 + (i % 5) * 3) * factor);
      const pendingGradVoc3 = Math.floor((15 + (i % 8) * 3) * factor);

      // Vocational Information (กลุ่ม 3)
      const dveStudentsCount = Math.floor((120 + (i % 10) * 45) * factor);
      const dualStudyCount = Math.floor((40 + (i % 6) * 15) * factor);
      const dualDegreeCount = Math.floor((15 + (i % 4) * 10) * factor);
      const fttAssessment = true; // เข้าร่วม อวท.

      // Upsert SchoolStat
      await prisma.schoolStat.upsert({
        where: {
          institutionId_academicYear_semester: {
            institutionId: inst.id,
            academicYear: year,
            semester: semester,
          },
        },
        update: {
          totalTeachers: baseTeachers,
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
          pendingGradM3,
          pendingGradM6,
          pendingGradVoc3,
          dveStudentsCount,
          dualStudyCount,
          dualDegreeCount,
          fttAssessment,
        },
        create: {
          institutionId: inst.id,
          academicYear: year,
          semester: semester,
          maleStudents: Math.floor((400 + i * 50) * factor),
          femaleStudents: Math.floor((350 + i * 40) * factor),
          vocCert1: 250,
          vocCert2: 230,
          vocCert3: 210,
          highVocCert1: 180,
          highVocCert2: 160,
          bachelorCount: isPublic && i === 0 ? 120 : 0,
          totalStudents: Math.floor((750 + i * 90) * factor),
          totalTeachers: baseTeachers,
          totalStaff: Math.floor(baseTeachers * 0.3),
          totalExecutives: 4,
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
          pendingGradM3,
          pendingGradM6,
          pendingGradVoc3,
          dveStudentsCount,
          dualStudyCount,
          dualDegreeCount,
          fttAssessment,
          gradVocCertCount: 200,
          gradHighVocCertCount: 150,
          employedGraduatesCount: 280,
          employedInField: 220,
          employedOutField: 40,
          employedFreelance: 20,
          furtherStudyCount: 50,
          unemployedCount: 20,
          workGov: 40,
          workPrivate: 220,
          workSelf: 20,
        },
      });

      // DVE Departments for this institution (กลุ่ม 1)
      const deptTemplates = [
        { name: 'แผนกวิชาช่างยนต์', count: Math.floor(45 * factor) },
        { name: 'แผนกวิชาช่างไฟฟ้ากำลัง', count: Math.floor(38 * factor) },
        { name: 'แผนกวิชาการบัญชี', count: Math.floor(42 * factor) },
        { name: 'แผนกวิชาคอมพิวเตอร์ธุรกิจ', count: Math.floor(35 * factor) },
        { name: 'แผนกวิชาการโรงแรมและการท่องเที่ยว', count: Math.floor(30 * factor) },
        { name: 'แผนกวิชาช่างอิเล็กทรอนิกส์', count: Math.floor(28 * factor) },
        { name: 'แผนกวิชาเทคนิคยานยนต์ไฟฟ้า (EV)', count: Math.floor(25 * factor) },
      ];

      // Assign 3-6 departments per college
      const numDepts = 3 + (i % 4);
      const chosenDepts = deptTemplates.slice(0, numDepts);

      // Clean old and insert new DveDepartments
      await prisma.dveDepartment.deleteMany({
        where: {
          institutionId: inst.id,
          academicYear: year,
          semester: semester,
        },
      });

      await prisma.dveDepartment.createMany({
        data: chosenDepts.map((d) => ({
          institutionId: inst.id,
          academicYear: year,
          semester: semester,
          departmentName: d.name,
          studentCount: d.count + (i % 5) * 4,
        })),
      });

      // Career Classrooms for this institution (กลุ่ม 5)
      const careerTemplates = [
        {
          course: 'หลักสูตรการบำรุงรักษายานยนต์ไฟฟ้า (EV Fundamentals)',
          schoolsCount: 3,
          schools: 'รร.อุดรพิทยานุกูล, รร.สตรีราชินูทิศ, รร.ประจักษ์ศิลปาคาร',
          students: Math.floor(48 * factor),
          type: 'RESKILL_UPSKILL',
          format: 'HYBRID',
        },
        {
          course: 'หลักสูตรการติดตั้งและบำรุงรักษาระบบโซลาร์เซลล์พลังงานแสงอาทิตย์',
          schoolsCount: 4,
          schools: 'รร.กุมภวาปี, รร.เพ็ญพิทยาคม, รร.บ้านดุงวิทยา, รร.หนองหานวิทยา',
          students: Math.floor(65 * factor),
          type: 'SHORT_COURSE',
          format: 'ONSITE',
        },
        {
          course: 'หลักสูตรการสร้างสรรค์เบเกอรี่และคาเฟ่สร้างอาชีพ',
          schoolsCount: 3,
          schools: 'รร.เทศบาล 1 โพศรี, รร.อุดรธรรมานุสรณ์, รร.หนองแสงวิทยศึกษา',
          students: Math.floor(52 * factor),
          type: 'SHORT_COURSE',
          format: 'ONSITE',
        },
        {
          course: 'หลักสูตรการตลาดออนไลน์และครีเอเตอร์ดิจิทัล (Live & E-Commerce)',
          schoolsCount: 5,
          schools: 'รร.โนนสะอาดพิทยาสรรค์, รร.ศรีธาตุพิทยาคม, รร.กุดจับประชาสรรค์, รร.น้ำโสมพิทยาคม, รร.ทุ่งฝนพัฒนศึกษา',
          students: Math.floor(84 * factor),
          type: 'RESKILL_UPSKILL',
          format: 'ONLINE',
        },
      ];

      // Assign 1-3 courses per college
      const numCourses = 1 + (i % 3);
      const chosenCourses = careerTemplates.slice(0, numCourses);

      await prisma.careerClassroom.deleteMany({
        where: {
          institutionId: inst.id,
          academicYear: year,
          semester: semester,
        },
      });

      for (const c of chosenCourses) {
        const schoolNames = c.schools.split(',').map((s) => s.trim()).filter(Boolean);
        const totalCourseStudents = c.students + (i % 4) * 5;
        const perSchoolCount = Math.max(1, Math.floor(totalCourseStudents / (schoolNames.length || 1)));
        const partnerSchoolsData = schoolNames.map((sName, sIdx) => ({
          schoolName: sName,
          studentCount: sIdx === schoolNames.length - 1
            ? Math.max(1, totalCourseStudents - perSchoolCount * (schoolNames.length - 1))
            : perSchoolCount,
        }));

        await prisma.careerClassroom.create({
          data: {
            institutionId: inst.id,
            academicYear: year,
            semester: semester,
            courseName: c.course,
            partnerSchoolCount: schoolNames.length,
            partnerSchoolNames: c.schools,
            studentCount: totalCourseStudents,
            trainingType: c.type,
            learningFormat: c.format,
            partnerSchools: {
              create: partnerSchoolsData,
            },
          },
        });
      }
    }
  }

  console.log('🎉 Successfully seeded comprehensive statistics for all 29 colleges across all 5 data groups!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
