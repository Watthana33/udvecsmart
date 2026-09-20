import React from 'react';
import { SubmissionStatusItem } from '../../types';
import { Printer, X } from 'lucide-react';

interface OfficialReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYear: number;
  semester: number;
  statusList: SubmissionStatusItem[];
  singleSchoolData?: {
    institution: any;
    formData: any;
  } | null;
}

export const OfficialReportPrintModal: React.FC<OfficialReportPrintModalProps> = ({
  isOpen,
  onClose,
  academicYear,
  semester,
  statusList,
  singleSchoolData,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-official-report');
    if (!printContent) {
      window.print();
      return;
    }

    // Create an isolated invisible iframe for 100% reliable A4 printing
    const existingFrame = document.getElementById('official-report-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'official-report-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <title>แบบรายงานข้อมูลสารสนเทศทางการศึกษา - สำนักงานอาชีวศึกษาจังหวัดอุดรธานี</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 15mm 15mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Sarabun', 'TH Sarabun New', serif, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-size: 11pt;
              line-height: 1.5;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h1 { font-size: 15pt; font-weight: bold; margin: 4px 0; text-align: center; }
            h2 { font-size: 13pt; font-weight: bold; margin: 3px 0; text-align: center; }
            h3 { font-size: 11pt; font-weight: bold; margin: 3px 0; text-align: center; color: #932d16; }
            h4 { font-size: 11pt; font-weight: bold; margin: 12px 0 6px 0; border-bottom: 1.5px solid #334155; padding-bottom: 3px; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 6px;
              margin-bottom: 10px;
            }
            tr {
              page-break-inside: avoid;
            }
            th, td {
              border: 1px solid #334155;
              padding: 5px 8px;
              font-size: 9.5pt;
            }
            th {
              background-color: #f1f5f9 !important;
              font-weight: bold;
              text-align: center;
            }
            .grid {
              display: grid;
            }
            .grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .gap-x-6 { column-gap: 1.5rem; }
            .gap-y-1\\.5 { row-gap: 0.375rem; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .text-xs { font-size: 9.5pt; }
            .text-sm { font-size: 11pt; }
            .border-b { border-bottom: 1px solid #cbd5e1; }
            .border-b-2 { border-bottom: 2px solid #0f172a; }
            .pb-4 { padding-bottom: 0.75rem; }
            .pt-6 { padding-top: 1.25rem; }
            .space-y-6 > * + * { margin-top: 1rem; }
            .space-y-1\\.5 > * + * { margin-top: 0.25rem; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }
            .bg-slate-200 { background-color: #e2e8f0 !important; }
            .text-slate-900 { color: #0f172a; }
            .text-slate-950 { color: #020617; }
            .text-slate-700 { color: #334155; }
            .text-slate-500 { color: #64748b; }
            .text-rose-700 { color: #be123c; }
            .text-blue-700 { color: #1d4ed8; }
            .text-\\[\\#932d16\\] { color: #932d16; }
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 450);
  };

  const currentDateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isSingleSchool = !!singleSchoolData;
  const targetSchool = singleSchoolData?.institution;
  const schoolForm = singleSchoolData?.formData;

  // ผลรวมสำหรับตารางทั้งจังหวัด
  let totalMale = 0;
  let totalFemale = 0;
  let totalStudents = 0;
  let totalVocCert = 0;
  let totalHighVocCert = 0;
  let totalBachelor = 0;
  let totalTeachers = 0;
  let totalStaff = 0;
  let totalExecs = 0;

  statusList.forEach((s) => {
    totalMale += s.maleStudents || 0;
    totalFemale += s.femaleStudents || 0;
    totalStudents += s.totalStudents || 0;
    totalVocCert += s.vocCertCount || 0;
    totalHighVocCert += s.highVocCertCount || 0;
    totalBachelor += s.bachelorCount || 0;
    totalTeachers += s.totalTeachers || 0;
    totalStaff += s.totalStaff || 0;
    totalExecs += s.totalExecutives || 1;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-slate-100 rounded-3xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-h-none print:max-w-none print:w-full print:rounded-none">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                พิมพ์แบบรายงานราชการ (Official Report Print / PDF)
              </h3>
              <p className="text-xs text-slate-400">
                ขนาดเอกสาร A4 ตามมาตรฐานแบบรายงานสารสนเทศทางการศึกษา
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#932d16] hover:bg-[#7a2411] text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงาน / บันทึกเป็น PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="overflow-y-auto p-4 sm:p-8 flex justify-center print:p-0 print:overflow-visible">
          <div
            id="printable-official-report"
            className="bg-white max-w-[210mm] w-full min-h-[297mm] p-10 sm:p-14 shadow-lg border border-slate-300 text-slate-950 font-serif leading-relaxed text-sm print:shadow-none print:border-none print:p-0"
            style={{ fontFamily: "'Sarabun', 'TH Sarabun New', serif" }}
          >
            {/* Header / Emblem */}
            <div className="text-center space-y-1.5 pb-4 border-b-2 border-slate-900">
              <div className="mx-auto mb-2 flex items-center justify-center" style={{ width: '2.5cm', height: '2.5cm' }}>
                <img
                  src="/vec_logo.png"
                  alt="ตราสัญลักษณ์ สอศ."
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + '/vec.png') {
                      target.src = '/vec.png';
                    }
                  }}
                />
              </div>

              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">
                แบบรายงานข้อมูลสารสนเทศทางการศึกษาและภาวะการมีงานทำ
              </h1>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                สำนักงานอาชีวศึกษาจังหวัดอุดรธานี
              </h2>
              {isSingleSchool ? (
                <h3 className="text-sm font-bold text-[#932d16]">
                  {targetSchool?.name} (รหัสสถานศึกษา: {targetSchool?.code})
                </h3>
              ) : (
                <p className="text-xs font-semibold text-slate-700">
                  ครอบคลุมสถานศึกษาในสังกัด 13 แห่ง (ภาครัฐและภาคเอกชน)
                </p>
              )}
              <div className="flex items-center justify-center gap-4 text-xs font-medium pt-1 text-slate-700">
                <span>ปีการศึกษา: <strong>{academicYear}</strong></span>
                <span>•</span>
                <span>ภาคเรียนที่: <strong>{semester}</strong></span>
                <span>•</span>
                <span>ข้อมูล ณ วันที่: <strong>{currentDateStr}</strong></span>
              </div>
            </div>

            {/* Document Content */}
            {isSingleSchool ? (
              /* ========================================================
                 แบบรายงานเฉพาะสถานศึกษาแห่งเดียว (Single School)
                 ======================================================== */
              <div className="pt-6 space-y-6">
                {/* 1. ข้อมูลทั่วไป */}
                <div>
                  <h4 className="font-bold text-sm border-b border-slate-400 pb-1 mb-2">
                    1. ข้อมูลทั่วไปและบุคลากรสถานศึกษา
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <div>ผู้บริหารสถานศึกษา: <strong>{schoolForm?.directorName || targetSchool?.personnels?.[0]?.name || '-'}</strong></div>
                    <div>ตำแหน่ง: <strong>{targetSchool?.personnels?.[0]?.position || 'ผู้อำนวยการวิทยาลัย'}</strong></div>
                    <div>เบอร์โทรศัพท์: <strong>{targetSchool?.phone || schoolForm?.phone || '-'}</strong></div>
                    <div>เว็บไซต์: <strong>{targetSchool?.website || schoolForm?.website || '-'}</strong></div>
                    <div>จำนวนสาขาวิชาที่เปิดสอน: <strong>{schoolForm?.programsCount || targetSchool?.programsCount || 12}</strong> สาขา</div>
                    <div>จำนวนผู้บริหาร: <strong>{schoolForm?.totalExecutives || 1}</strong> คน</div>
                    <div>จำนวนครูผู้สอน: <strong>{schoolForm?.totalTeachers || 0}</strong> คน</div>
                    <div>จำนวนบุคลากรทางการศึกษา: <strong>{schoolForm?.totalStaff || 0}</strong> คน</div>
                  </div>
                </div>

                {/* 2. สถิตินักเรียน */}
                <div>
                  <h4 className="font-bold text-sm border-b border-slate-400 pb-1 mb-2">
                    2. สถิติจำนวนนักเรียน/นักศึกษา
                  </h4>
                  <table className="w-full border-collapse border border-slate-800 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-800 p-1.5 text-left">ระดับชั้น / ประเภท</th>
                        <th className="border border-slate-800 p-1.5 text-right">จำนวน (คน)</th>
                        <th className="border border-slate-800 p-1.5 text-left">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-800 p-1.5">ประกาศนียบัตรวิชาชีพ (ปวช.1)</td>
                        <td className="border border-slate-800 p-1.5 text-right">{schoolForm?.vocCert1 || 0}</td>
                        <td className="border border-slate-800 p-1.5">-</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 p-1.5">ประกาศนียบัตรวิชาชีพ (ปวช.2)</td>
                        <td className="border border-slate-800 p-1.5 text-right">{schoolForm?.vocCert2 || 0}</td>
                        <td className="border border-slate-800 p-1.5">-</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 p-1.5">ประกาศนียบัตรวิชาชีพ (ปวช.3)</td>
                        <td className="border border-slate-800 p-1.5 text-right">{schoolForm?.vocCert3 || 0}</td>
                        <td className="border border-slate-800 p-1.5">-</td>
                      </tr>
                      <tr className="font-bold bg-slate-50">
                        <td className="border border-slate-800 p-1.5">รวมระดับ ปวช. ทั้งหมด</td>
                        <td className="border border-slate-800 p-1.5 text-right">
                          {(schoolForm?.vocCert1 || 0) + (schoolForm?.vocCert2 || 0) + (schoolForm?.vocCert3 || 0)}
                        </td>
                        <td className="border border-slate-800 p-1.5">-</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 p-1.5">ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.1)</td>
                        <td className="border border-slate-800 p-1.5 text-right">{schoolForm?.highVocCert1 || 0}</td>
                        <td className="border border-slate-800 p-1.5">-</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 p-1.5">ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.2)</td>
                        <td className="border border-slate-800 p-1.5 text-right">{schoolForm?.highVocCert2 || 0}</td>
                        <td className="border border-slate-800 p-1.5">-</td>
                      </tr>
                      <tr className="font-bold bg-slate-50">
                        <td className="border border-slate-800 p-1.5">รวมระดับ ปวส. ทั้งหมด</td>
                        <td className="border border-slate-800 p-1.5 text-right">
                          {(schoolForm?.highVocCert1 || 0) + (schoolForm?.highVocCert2 || 0)}
                        </td>
                        <td className="border border-slate-800 p-1.5">-</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-800 p-1.5">ระดับปริญญาตรีสายเทคโนโลยี (ทล.บ.)</td>
                        <td className="border border-slate-800 p-1.5 text-right">{schoolForm?.bachelorCount || 0}</td>
                        <td className="border border-slate-800 p-1.5">-</td>
                      </tr>
                      <tr className="font-bold bg-slate-200">
                        <td className="border border-slate-800 p-2">รวมนักเรียน/นักศึกษา ทั้งหมด</td>
                        <td className="border border-slate-800 p-2 text-right">
                          {(schoolForm?.maleStudents || 0) + (schoolForm?.femaleStudents || 0)}
                        </td>
                        <td className="border border-slate-800 p-2">
                          ชาย {schoolForm?.maleStudents || 0} คน / หญิง {schoolForm?.femaleStudents || 0} คน
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. การมีงานทำ */}
                <div>
                  <h4 className="font-bold text-sm border-b border-slate-400 pb-1 mb-2">
                    3. ข้อมูลผู้สำเร็จการศึกษาและการมีงานทำ
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <div>ผู้สำเร็จการศึกษา ปวช.: <strong>{schoolForm?.gradVocCertCount || 0}</strong> คน</div>
                    <div>ผู้สำเร็จการศึกษา ปวส.: <strong>{schoolForm?.gradHighVocCertCount || 0}</strong> คน</div>
                    <div>มีงานทำรวม: <strong>{(schoolForm?.employedInField || 0) + (schoolForm?.employedOutField || 0) + (schoolForm?.employedFreelance || 0)}</strong> คน</div>
                    <div>ศึกษาต่อ: <strong>{schoolForm?.furtherStudyCount || 0}</strong> คน</div>
                    <div>ทำงานตรงสาขา: <strong>{schoolForm?.employedInField || 0}</strong> คน</div>
                    <div>ทำงานไม่ตรงสาขา: <strong>{schoolForm?.employedOutField || 0}</strong> คน</div>
                    <div>ประกอบอาชีพอิสระ: <strong>{schoolForm?.employedFreelance || 0}</strong> คน</div>
                    <div>ว่างงาน: <strong>{schoolForm?.unemployedCount || 0}</strong> คน</div>
                  </div>
                </div>
              </div>
            ) : (
              /* ========================================================
                 แบบรายงานภาพรวมทั้งจังหวัด (13 วิทยาลัย)
                 ======================================================== */
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-xs pb-1">
                  <span>สถานศึกษาทั้งหมด: <strong>{statusList.length}</strong> แห่ง (รัฐ {statusList.filter(s => s.type === 'PUBLIC').length} / เอกชน {statusList.filter(s => s.type === 'PRIVATE').length})</span>
                  <span>ส่งรายงานข้อมูลแล้ว: <strong>{statusList.filter(s => s.isSubmitted).length}</strong> แห่ง</span>
                </div>

                <table className="w-full border-collapse border border-slate-800 text-[11px] leading-tight">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-800 p-1.5 text-center w-8">ที่</th>
                      <th className="border border-slate-800 p-1.5 text-left">ชื่อสถานศึกษา</th>
                      <th className="border border-slate-800 p-1.5 text-center w-12">ประเภท</th>
                      <th className="border border-slate-800 p-1.5 text-right">ปวช.</th>
                      <th className="border border-slate-800 p-1.5 text-right">ปวส.</th>
                      <th className="border border-slate-800 p-1.5 text-right">ป.ตรี</th>
                      <th className="border border-slate-800 p-1.5 text-right font-bold">รวม นร.</th>
                      <th className="border border-slate-800 p-1.5 text-right">ครู</th>
                      <th className="border border-slate-800 p-1.5 text-right">บุคลากร</th>
                      <th className="border border-slate-800 p-1.5 text-center w-16">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusList.map((inst, index) => (
                      <tr key={inst.id} className={index % 2 === 1 ? 'bg-slate-50/60' : ''}>
                        <td className="border border-slate-800 p-1 text-center">{index + 1}</td>
                        <td className="border border-slate-800 p-1 font-medium">{inst.name}</td>
                        <td className="border border-slate-800 p-1 text-center">
                          {inst.type === 'PUBLIC' ? 'รัฐ' : 'เอกชน'}
                        </td>
                        <td className="border border-slate-800 p-1 text-right">{inst.vocCertCount || 0}</td>
                        <td className="border border-slate-800 p-1 text-right">{inst.highVocCertCount || 0}</td>
                        <td className="border border-slate-800 p-1 text-right">{inst.bachelorCount || 0}</td>
                        <td className="border border-slate-800 p-1 text-right font-bold">{inst.totalStudents || 0}</td>
                        <td className="border border-slate-800 p-1 text-right">{inst.totalTeachers || 0}</td>
                        <td className="border border-slate-800 p-1 text-right">{inst.totalStaff || 0}</td>
                        <td className="border border-slate-800 p-1 text-center">
                          {inst.isSubmitted ? 'ส่งแล้ว' : 'รอส่ง'}
                        </td>
                      </tr>
                    ))}
                    {/* แถวสรุปรวมทั้งสิ้น */}
                    <tr className="bg-slate-200 font-bold">
                      <td colSpan={3} className="border border-slate-800 p-1.5 text-center">
                        รวมทั้งสิ้น (Grand Total)
                      </td>
                      <td className="border border-slate-800 p-1.5 text-right">{totalVocCert}</td>
                      <td className="border border-slate-800 p-1.5 text-right">{totalHighVocCert}</td>
                      <td className="border border-slate-800 p-1.5 text-right">{totalBachelor}</td>
                      <td className="border border-slate-800 p-1.5 text-right text-black">{totalStudents}</td>
                      <td className="border border-slate-800 p-1.5 text-right">{totalTeachers}</td>
                      <td className="border border-slate-800 p-1.5 text-right">{totalStaff}</td>
                      <td className="border border-slate-800 p-1.5 text-center">
                        {statusList.filter(s => s.isSubmitted).length}/{statusList.length}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Block (Formal Thai Government Layout) */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-1">
                <p>ลงชื่อ..........................................................</p>
                <p className="font-bold">(..........................................................)</p>
                <p className="text-slate-600">เจ้าหน้าที่ผู้จัดทำรายงานข้อมูลสารสนเทศ</p>
                <p className="text-slate-500">วันที่ ........../........../..........</p>
              </div>

              <div className="space-y-1">
                <p>ลงชื่อ..........................................................</p>
                <p className="font-bold">
                  {isSingleSchool
                    ? `(${schoolForm?.directorName || targetSchool?.personnels?.[0]?.name || '..........................................................'})`
                    : '(..........................................................)'}
                </p>
                <p className="text-slate-600">
                  {isSingleSchool
                    ? (targetSchool?.personnels?.[0]?.position || `ผู้อำนวยการ${targetSchool?.name || 'สถานศึกษา'}`)
                    : 'ผู้อำนวยการสำนักงานอาชีวศึกษาจังหวัดอุดรธานี'}
                </p>
                <p className="text-slate-500">วันที่ ........../........../..........</p>
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-8 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-8">
              ระบบสารสนเทศข้อมูลกลาง สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (VEC Smart Data System) • พิมพ์เมื่อ {currentDateStr}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
