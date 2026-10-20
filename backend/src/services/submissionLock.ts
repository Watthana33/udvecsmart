import { prisma } from '../config/prisma.js';

// การเปิด-ปิดรับข้อมูลจากวิทยาลัย (ตั้งโดย SUPER_ADMIN) — ต้องบังคับที่ฝั่งเซิร์ฟเวอร์ ไม่ใช่แค่ปิดช่องในหน้าจอ
export type SectionName = 'general' | 'teachers' | 'grades' | 'dve' | 'career' | 'graduates';

const SECTION_SETTING_KEYS: Record<SectionName, string> = {
  general: 'allow_section_general',
  teachers: 'allow_section_teachers',
  grades: 'allow_section_grades',
  dve: 'allow_section_dve',
  career: 'allow_section_career',
  graduates: 'allow_section_graduates',
};

export const SECTION_LABELS: Record<SectionName, string> = {
  general: 'ข้อมูลทั่วไปและผู้บริหาร',
  teachers: 'ข้อมูลครูและบุคลากร',
  grades: 'สถิตินักเรียน',
  dve: 'แผนกวิชาทวิภาคี',
  career: 'ห้องเรียนอาชีพ',
  graduates: 'ผู้สำเร็จการศึกษาและการมีงานทำ',
};

/** ช่องในตาราง school_stats ของแต่ละหมวด (ตรงกับฟอร์มในหน้าแอดมิน) */
export const SECTION_STAT_FIELDS: Partial<Record<SectionName, string[]>> = {
  general: ['totalExecutives', 'totalStaff', 'totalTeachers'],
  teachers: [
    'maleTeachers', 'femaleTeachers',
    'degreeAssociateMale', 'degreeAssociateFemale', 'degreeBachelorMale', 'degreeBachelorFemale',
    'degreeMasterMale', 'degreeMasterFemale', 'degreeDoctorMale', 'degreeDoctorFemale',
    'civilTeachersMale', 'civilTeachersFemale', 'hiredTeachersMale', 'hiredTeachersFemale',
    'govEmpTeachersMale', 'govEmpTeachersFemale',
  ],
  grades: [
    'maleStudents', 'femaleStudents', 'vocCert1', 'vocCert2', 'vocCert3', 'highVocCert1', 'highVocCert2', 'bachelorCount',
    'pendingGradM3', 'pendingGradM6', 'pendingGradVoc3', 'dveStudentsCount', 'dualStudyCount', 'dualDegreeCount', 'fttAssessment',
  ],
  graduates: [
    'gradVocCertCount', 'gradHighVocCertCount', 'employedInField', 'employedOutField', 'employedFreelance',
    'furtherStudyCount', 'unemployedCount', 'workGov', 'workPrivate', 'workSelf',
  ],
};

/** ช่องข้อมูลสถานศึกษา/ผู้บริหาร ที่อยู่ในหมวด "ข้อมูลทั่วไป" */
export const GENERAL_INSTITUTION_FIELDS = [
  'directorName', 'photoUrl', 'phone', 'website', 'address', 'programsCount', 'programsList', 'programsUrl',
];

export async function getSubmissionLocks(): Promise<{ open: boolean; locked: Set<SectionName> }> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ['is_data_submission_open', ...Object.values(SECTION_SETTING_KEYS)] } },
    select: { key: true, value: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const locked = new Set<SectionName>();
  for (const [name, key] of Object.entries(SECTION_SETTING_KEYS) as Array<[SectionName, string]>) {
    if (map.get(key) === 'false') locked.add(name);
  }
  return { open: map.get('is_data_submission_open') !== 'false', locked };
}
