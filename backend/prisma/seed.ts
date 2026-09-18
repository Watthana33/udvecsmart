import { PrismaClient, Role, InstitutionType, NewsCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. สร้างรหัสผ่านที่เข้ารหัสด้วย bcrypt
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password@1234', salt);

  // 2. สร้างข้อมูลสถานศึกษาตัวอย่างใน จ.อุดรธานี
  const institutionsData = [
    {
      code: '13410101',
      name: 'วิทยาลัยเทคนิคอุดรธานี',
      type: InstitutionType.PUBLIC,
      website: 'https://www.udtech.ac.th',
      phone: '042-221538',
      address: '115 ถนนทหาร ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
    },
    {
      code: '13410102',
      name: 'วิทยาลัยอาชีวศึกษาอุดรธานี',
      type: InstitutionType.PUBLIC,
      website: 'https://www.udvc.ac.th',
      phone: '042-221167',
      address: '107 ถนนโพศรี ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
    },
    {
      code: '13410103',
      name: 'วิทยาลัยสารพัดช่างอุดรธานี',
      type: InstitutionType.PUBLIC,
      website: 'https://www.udpoly.ac.th',
      phone: '042-243886',
      address: 'ถนนเลี่ยงเมือง ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
    },
    {
      code: '13410104',
      name: 'วิทยาลัยการอาชีพบ้านผือ',
      type: InstitutionType.PUBLIC,
      website: 'https://www.bpc.ac.th',
      phone: '042-282110',
      address: 'ตำบลจำปาโมง อำเภอบ้านผือ จังหวัดอุดรธานี 41160',
    },
    {
      code: '13410105',
      name: 'วิทยาลัยการอาชีพกุมภวาปี',
      type: InstitutionType.PUBLIC,
      website: 'https://www.kice.ac.th',
      phone: '042-377222',
      address: 'ตำบลเวียงคำ อำเภอกุมภวาปี จังหวัดอุดรธานี 41110',
    },
    {
      code: '23410101',
      name: 'วิทยาลัยเทคโนโลยีพิชญบัณฑิต 2',
      type: InstitutionType.PRIVATE,
      website: 'https://www.p-tech.ac.th',
      phone: '042-182399',
      address: 'ตำบลหนองบัว อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
    },
    {
      code: '23410102',
      name: 'วิทยาลัยเทคโนโลยีสันตพล',
      type: InstitutionType.PRIVATE,
      website: 'https://www.stc.ac.th',
      phone: '042-246555',
      address: 'ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
    },
  ];

  const createdInstitutions = [];
  for (const inst of institutionsData) {
    const institution = await prisma.institution.upsert({
      where: { code: inst.code },
      update: {},
      create: inst,
    });
    createdInstitutions.push(institution);
  }
  console.log(`✅ Created/Checked ${createdInstitutions.length} institutions.`);

  // 3. สร้าง Super Admin (แอดมิน สอจ.อุดรธานี)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@udpvec.go.th' },
    update: {},
    create: {
      email: 'admin@udpvec.go.th',
      passwordHash: defaultPasswordHash,
      fullName: 'ผู้ดูแลระบบ สอจ.อุดรธานี',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 4. สร้าง School Admin ตัวอย่างสำหรับ วท.อุดรธานี
  const firstInst = createdInstitutions[0];
  if (firstInst) {
    const schoolAdmin = await prisma.user.upsert({
      where: { email: 'admin.udtech@udpvec.go.th' },
      update: {},
      create: {
        email: 'admin.udtech@udpvec.go.th',
        passwordHash: defaultPasswordHash,
        fullName: 'เจ้าหน้าที่ข้อมูล วท.อุดรธานี',
        role: Role.SCHOOL_ADMIN,
        institutionId: firstInst.id,
      },
    });
    console.log(`✅ School Admin created: ${schoolAdmin.email}`);

    // ข้อมูลสถิติตัวอย่าง
    await prisma.schoolStat.upsert({
      where: {
        institutionId_academicYear_semester: {
          institutionId: firstInst.id,
          academicYear: 2567,
          semester: 1,
        },
      },
      update: {},
      create: {
        institutionId: firstInst.id,
        academicYear: 2567,
        semester: 1,
        vocCertCount: 2150,
        highVocCertCount: 1480,
        bachelorCount: 120,
        totalStudents: 3750,
        totalTeachers: 142,
        totalStaff: 48,
        employedGraduatesCount: 820,
        furtherStudyCount: 230,
        unemployedCount: 45,
      },
    });
  }

  // 5. สร้างการตั้งค่าระบบ (Site Settings)
  const defaultSettings = [
    {
      key: 'is_data_submission_open',
      value: 'true',
      description: 'สถานะเปิด/ปิดรับการกรอกข้อมูลสถิติจากสถานศึกษา',
    },
    {
      key: 'system_title',
      value: 'ระบบสารสนเทศ สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (UDPVECSmart)',
      description: 'ชื่อระบบทางการ',
    },
    {
      key: 'current_academic_year',
      value: '2567',
      description: 'ปีการศึกษาปัจจุบันที่เปิดรับข้อมูล',
    },
    {
      key: 'current_semester',
      value: '1',
      description: 'ภาคเรียนปัจจุบันที่เปิดรับข้อมูล',
    },
  ];

  for (const s of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('✅ Default site settings created.');

  // 6. ข่าวประชาสัมพันธ์ตัวอย่าง
  await prisma.news.create({
    data: {
      title: 'ยินดีต้อนรับสู่ระบบสารสนเทศ สอจ.อุดรธานี (UDPVECSmart)',
      content: 'ระบบฐานข้อมูลกลางและสถิติสารสนเทศเพื่อการบริหารจัดการอาชีวศึกษาจังหวัดอุดรธานี รองรับทั้งสถานศึกษาภาครัฐและภาคเอกชน',
      category: NewsCategory.ANNOUNCEMENT,
      isPublished: true,
      authorId: superAdmin.id,
    },
  });
  console.log('✅ Sample announcement created.');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
