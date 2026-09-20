import * as XLSX from 'xlsx';
import { SubmissionStatusItem } from '../types';

/**
 * กำหนดความกว้างของคอลัมน์ Excel อัตโนมัติจากความยาวข้อความ
 */
function autoFitColumns(worksheet: XLSX.WorkSheet, data: any[][]) {
  const colWidths = data[0]?.map((_, colIndex) => {
    let maxLen = 10;
    for (const row of data) {
      const val = row[colIndex];
      if (val !== undefined && val !== null) {
        const strVal = String(val);
        // ภาษาไทยความกว้างประมาณ 1.3 เท่าของตัวอักษรละติน
        const len = Math.ceil(strVal.length * 1.3);
        if (len > maxLen) maxLen = len;
      }
    }
    return { wch: Math.min(maxLen + 3, 50) };
  }) || [];
  worksheet['!cols'] = colWidths;
}

/**
 * ส่งออกรายงาน Excel ภาพรวมทุกสถานศึกษา (สำหรับ แอดมินหลัก สอจ.อุดรธานี)
 */
export function exportSuperAdminExcel(
  statusList: SubmissionStatusItem[],
  academicYear: number,
  semester: number
) {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: รายละเอียดสถิติแยกรายสถานศึกษา
  // -------------------------------------------------------------
  const headers = [
    'ลำดับ',
    'รหัสสถานศึกษา',
    'ชื่อสถานศึกษา',
    'ประเภท',
    'เบอร์โทรศัพท์',
    'สาขาที่เปิดสอน',
    'นักเรียนชาย (คน)',
    'นักเรียนหญิง (คน)',
    'รวมนักเรียน (คน)',
    'ปวช. รวม (คน)',
    'ปวส. รวม (คน)',
    'ป.ตรี ทล.บ. (คน)',
    'ผู้บริหาร (คน)',
    'ครูผู้สอน (คน)',
    'บุคลากรทางการศึกษา (คน)',
    'รวมบุคลากร (คน)',
    'สถานะการส่งข้อมูล',
    'วันที่รายงานข้อมูลล่าสุด',
  ];

  let totalMale = 0;
  let totalFemale = 0;
  let totalStudents = 0;
  let totalVocCert = 0;
  let totalHighVocCert = 0;
  let totalBachelor = 0;
  let totalExecs = 0;
  let totalTeachers = 0;
  let totalStaff = 0;
  let totalPersonnel = 0;

  const rows = statusList.map((inst, index) => {
    const pTotal = (inst.totalTeachers || 0) + (inst.totalStaff || 0) + (inst.totalExecutives || 1);
    totalMale += inst.maleStudents || 0;
    totalFemale += inst.femaleStudents || 0;
    totalStudents += inst.totalStudents || 0;
    totalVocCert += inst.vocCertCount || 0;
    totalHighVocCert += inst.highVocCertCount || 0;
    totalBachelor += inst.bachelorCount || 0;
    totalExecs += inst.totalExecutives || 1;
    totalTeachers += inst.totalTeachers || 0;
    totalStaff += inst.totalStaff || 0;
    totalPersonnel += pTotal;

    return [
      index + 1,
      inst.code,
      inst.name,
      inst.type === 'PUBLIC' ? 'ภาครัฐ' : 'ภาคเอกชน',
      inst.phone || '-',
      inst.programsCount || 12,
      inst.maleStudents || 0,
      inst.femaleStudents || 0,
      inst.totalStudents || 0,
      inst.vocCertCount || 0,
      inst.highVocCertCount || 0,
      inst.bachelorCount || 0,
      inst.totalExecutives || 1,
      inst.totalTeachers || 0,
      inst.totalStaff || 0,
      pTotal,
      inst.isSubmitted ? 'ส่งข้อมูลแล้ว' : 'ยังไม่ส่งข้อมูล',
      inst.updatedAt ? new Date(inst.updatedAt).toLocaleDateString('th-TH') : '-',
    ];
  });

  // แถวสรุปรวมท้ายตาราง
  const summaryRow = [
    '',
    '',
    'รวมทั้งสิ้น (Grand Total)',
    `${statusList.length} แห่ง`,
    '-',
    '-',
    totalMale,
    totalFemale,
    totalStudents,
    totalVocCert,
    totalHighVocCert,
    totalBachelor,
    totalExecs,
    totalTeachers,
    totalStaff,
    totalPersonnel,
    `ส่งแล้ว ${statusList.filter((s) => s.isSubmitted).length}/${statusList.length} แห่ง`,
    '',
  ];

  const fullSheet1Data = [
    [`รายงานสถิติข้อมูลสารสนเทศ สำนักงานอาชีวศึกษาจังหวัดอุดรธานี`],
    [`ปีการศึกษา ${academicYear} ภาคเรียนที่ ${semester}`],
    [`ข้อมูล ณ วันที่ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.`],
    [], // empty line
    headers,
    ...rows,
    summaryRow,
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(fullSheet1Data);
  autoFitColumns(ws1, [headers, ...rows, summaryRow]);
  XLSX.utils.book_append_sheet(wb, ws1, 'สถิติรายสถานศึกษา');

  // -------------------------------------------------------------
  // Sheet 2: บทสรุปภาพรวมจังหวัด (Executive Summary)
  // -------------------------------------------------------------
  const publicCount = statusList.filter((s) => s.type === 'PUBLIC').length;
  const privateCount = statusList.filter((s) => s.type === 'PRIVATE').length;
  const submittedCount = statusList.filter((s) => s.isSubmitted).length;

  const sheet2Data = [
    ['บทสรุปภาพรวมข้อมูลสารสนเทศอาชีวศึกษาจังหวัดอุดรธานี'],
    [`ประจำปีการศึกษา ${academicYear} ภาคเรียนที่ ${semester}`],
    [],
    ['หัวข้อดัชนีชี้วัด', 'จำนวน', 'หน่วยนับ', 'หมายเหตุ'],
    ['สถานศึกษาทั้งหมดในสังกัด', statusList.length, 'แห่ง', 'ครอบคลุมทั้งภาครัฐและภาคเอกชน'],
    ['- สถานศึกษาภาครัฐ', publicCount, 'แห่ง', ''],
    ['- สถานศึกษาภาคเอกชน', privateCount, 'แห่ง', ''],
    ['สถานะการรายงานข้อมูล', submittedCount, 'แห่ง', `คิดเป็น ${Math.round((submittedCount / (statusList.length || 1)) * 100)}%`],
    ['นักเรียน/นักศึกษา ทั้งหมด', totalStudents, 'คน', ''],
    ['  * นักเรียนชาย', totalMale, 'คน', `คิดเป็น ${Math.round((totalMale / (totalStudents || 1)) * 100)}%`],
    ['  * นักเรียนหญิง', totalFemale, 'คน', `คิดเป็น ${Math.round((totalFemale / (totalStudents || 1)) * 100)}%`],
    ['  * ระดับ ปวช.', totalVocCert, 'คน', `คิดเป็น ${Math.round((totalVocCert / (totalStudents || 1)) * 100)}%`],
    ['  * ระดับ ปวส.', totalHighVocCert, 'คน', `คิดเป็น ${Math.round((totalHighVocCert / (totalStudents || 1)) * 100)}%`],
    ['  * ระดับปริญญาตรี (ทล.บ.)', totalBachelor, 'คน', `คิดเป็น ${Math.round((totalBachelor / (totalStudents || 1)) * 100)}%`],
    ['บุคลากรทางการศึกษาทั้งหมด', totalPersonnel, 'คน', ''],
    ['  * ผู้บริหารสถานศึกษา', totalExecs, 'คน', ''],
    ['  * ครูผู้สอน', totalTeachers, 'คน', ''],
    ['  * บุคลากรสายสนับสนุน', totalStaff, 'คน', ''],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  autoFitColumns(ws2, sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'สรุปภาพรวมจังหวัด');

  // บันทึกและดาวน์โหลดไฟล์
  const fileName = `VEC_SmartData_สถิติอาชีวศึกษาอุดรธานี_${academicYear}_ภาคเรียนที่${semester}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * ส่งออกรายงาน Excel ประจำสถานศึกษา 1 แห่ง (สำหรับ แอดมินสถานศึกษา School Admin)
 */
export function exportSchoolAdminExcel(
  inst: any,
  formData: any,
  academicYear: number,
  semester: number
) {
  const wb = XLSX.utils.book_new();

  const sheetData = [
    [`แบบรายงานสถิติข้อมูลสารสนเทศประจำสถานศึกษา`],
    [inst?.name || 'สถานศึกษา'],
    [`รหัสสถานศึกษา: ${inst?.code || '-'} | สังกัด: สำนักงานอาชีวศึกษาจังหวัดอุดรธานี`],
    [`ปีการศึกษา ${academicYear} ภาคเรียนที่ ${semester}`],
    [`วันที่ส่งออกข้อมูล: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}`],
    [],
    ['หมวดที่ 1: ข้อมูลทั่วไปและบุคลากร', '', '', ''],
    ['ชื่อผู้บริหารสถานศึกษา (ผู้อำนวยการ)', formData.directorName || '-', '', ''],
    ['เบอร์โทรศัพท์ติดต่อ', inst?.phone || formData.phone || '-', '', ''],
    ['เว็บไซต์สถานศึกษา', inst?.website || formData.website || '-', '', ''],
    ['จำนวนสาขาวิชาที่เปิดสอน', formData.programsCount || inst?.programsCount || 12, 'สาขา', ''],
    ['จำนวนผู้บริหาร', formData.totalExecutives || 1, 'คน', ''],
    ['จำนวนครูผู้สอน', formData.totalTeachers || 0, 'คน', ''],
    ['จำนวนบุคลากรทางการศึกษา', formData.totalStaff || 0, 'คน', ''],
    ['รวมบุคลากรทั้งสิ้น', (formData.totalExecutives || 1) + (formData.totalTeachers || 0) + (formData.totalStaff || 0), 'คน', ''],
    [],
    ['หมวดที่ 2: สถิตินักเรียน/นักศึกษา', '', '', ''],
    ['นักเรียนชาย', formData.maleStudents || 0, 'คน', ''],
    ['นักเรียนหญิง', formData.femaleStudents || 0, 'คน', ''],
    ['รวมนักเรียนทั้งหมด', (formData.maleStudents || 0) + (formData.femaleStudents || 0), 'คน', ''],
    ['ระดับ ปวช.1', formData.vocCert1 || 0, 'คน', ''],
    ['ระดับ ปวช.2', formData.vocCert2 || 0, 'คน', ''],
    ['ระดับ ปวช.3', formData.vocCert3 || 0, 'คน', ''],
    ['รวม ปวช.', (formData.vocCert1 || 0) + (formData.vocCert2 || 0) + (formData.vocCert3 || 0), 'คน', ''],
    ['ระดับ ปวส.1', formData.highVocCert1 || 0, 'คน', ''],
    ['ระดับ ปวส.2', formData.highVocCert2 || 0, 'คน', ''],
    ['รวม ปวส.', (formData.highVocCert1 || 0) + (formData.highVocCert2 || 0), 'คน', ''],
    ['ระดับปริญญาตรี (ทล.บ.)', formData.bachelorCount || 0, 'คน', ''],
    [],
    ['หมวดที่ 3: ผู้สำเร็จการศึกษาและการมีงานทำ', '', '', ''],
    ['ผู้สำเร็จการศึกษา ระดับ ปวช.', formData.gradVocCertCount || 0, 'คน', ''],
    ['ผู้สำเร็จการศึกษา ระดับ ปวส.', formData.gradHighVocCertCount || 0, 'คน', ''],
    ['รวมผู้สำเร็จการศึกษาทั้งสิ้น', (formData.gradVocCertCount || 0) + (formData.gradHighVocCertCount || 0), 'คน', ''],
    ['มีงานทำ (รวม)', (formData.employedInField || 0) + (formData.employedOutField || 0) + (formData.employedFreelance || 0), 'คน', ''],
    ['  - ทำงานตรงสาขา', formData.employedInField || 0, 'คน', ''],
    ['  - ทำงานไม่ตรงสาขา', formData.employedOutField || 0, 'คน', ''],
    ['  - ประกอบอาชีพอิสระ', formData.employedFreelance || 0, 'คน', ''],
    ['ศึกษาต่อ', formData.furtherStudyCount || 0, 'คน', ''],
    ['ว่างงาน / ยังไม่มีงานทำ', formData.unemployedCount || 0, 'คน', ''],
    ['ประเภทหน่วยงานที่เข้าทำงาน:', '', '', ''],
    ['  - หน่วยงานของรัฐ', formData.workGov || 0, 'คน', ''],
    ['  - หน่วยงานเอกชน', formData.workPrivate || 0, 'คน', ''],
    ['  - ประกอบธุรกิจส่วนตัว', formData.workSelf || 0, 'คน', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  autoFitColumns(ws, sheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลสถิติ');

  const cleanName = (inst?.name || 'สถานศึกษา').replace(/[\/\\?%*:|"<>]/g, '_');
  const fileName = `${cleanName}_สถิติปี_${academicYear}_ภาคเรียนที่${semester}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
