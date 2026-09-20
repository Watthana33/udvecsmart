import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { StatsOverview, InstitutionStatItem } from '../../types';
import { Briefcase, GraduationCap, CheckCircle2, TrendingUp, PieChart } from 'lucide-react';

interface EmploymentSectionProps {
  stats: StatsOverview | null;
  institutionStats: InstitutionStatItem[];
  loading: boolean;
}

export const EmploymentSection: React.FC<EmploymentSectionProps> = ({
  stats,
  institutionStats,
  loading,
}) => {
  if (loading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-slate-200/80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { students, graduatesEmployment } = stats;

  // 1. Chart 1 Data: Horizontal Bar (มีงานทำ vs ว่างงาน รายวิทยาลัย)
  const displayInstitutions = institutionStats.slice(0, 15);
  const collegeEmploymentData = {
    labels: displayInstitutions.map((i) => i.institution.name.replace('วิทยาลัย', 'ว.')),
    datasets: [
      {
        label: 'มีงานทำ (คน)',
        data: displayInstitutions.map((i) => i.employedGraduatesCount),
        backgroundColor: '#0284c7',
        borderRadius: 4,
      },
      {
        label: 'ว่างงาน / กำลังหางาน (คน)',
        data: displayInstitutions.map((i) => i.unemployedCount),
        backgroundColor: '#ea580c',
        borderRadius: 4,
      },
    ],
  };

  // 2. Chart 2 Data: การมีงานทำแยกประเภท (4 สีตามระบบ Square Color Harmony)
  const jobTypeLabels = [
    'ทำงานตรงสาขาวิชาชีพ',
    'ทำงานไม่ตรงสาขาวิชาชีพ',
    'ประกอบอาชีพอิสระ',
    'ว่างงาน / กำลังหางาน',
  ];
  const jobTypeData = {
    labels: jobTypeLabels,
    datasets: [
      {
        label: 'จำนวน (คน)',
        data: [
          graduatesEmployment.byJobType.inField,
          graduatesEmployment.byJobType.outField,
          graduatesEmployment.byJobType.freelance,
          graduatesEmployment.byJobType.unemployed,
        ],
        backgroundColor: ['#7c3aed', '#0284c7', '#f59e0b', '#ea580c'],
        borderRadius: 8,
      },
    ],
  };

  // 3. Chart 3 Data: โดนัทแยกประเภทหน่วยงานที่เข้าทำงาน (รัฐ / เอกชน / อิสระ)
  const totalWorkplace =
    graduatesEmployment.byWorkplace.government +
    graduatesEmployment.byWorkplace.private +
    graduatesEmployment.byWorkplace.selfEmployed || 1;

  const govPercent = ((graduatesEmployment.byWorkplace.government / totalWorkplace) * 100).toFixed(1);
  const privPercent = ((graduatesEmployment.byWorkplace.private / totalWorkplace) * 100).toFixed(1);
  const selfPercent = ((graduatesEmployment.byWorkplace.selfEmployed / totalWorkplace) * 100).toFixed(1);

  const workplaceDonutData = {
    labels: [
      `หน่วยงานของรัฐ (${govPercent}%)`,
      `หน่วยงานเอกชน (${privPercent}%)`,
      `ประกอบอาชีพอิสระ (${selfPercent}%)`,
    ],
    datasets: [
      {
        data: [
          graduatesEmployment.byWorkplace.government,
          graduatesEmployment.byWorkplace.private,
          graduatesEmployment.byWorkplace.selfEmployed,
        ],
        backgroundColor: ['#7c3aed', '#0284c7', '#f59e0b'],
        borderWidth: 3,
        borderColor: '#ffffff',
      },
    ],
  };

  // Calculation for graduation and employment indicators
  const vocCert3Count = stats.students.byGrade?.vocCert3 || 0;
  const vocGradRate = vocCert3Count > 0
    ? Math.min(100, Math.round((graduatesEmployment.gradVocCert / vocCert3Count) * 100))
    : stats.students.vocCert > 0
    ? Math.min(100, Math.round((graduatesEmployment.gradVocCert / (stats.students.vocCert / 3)) * 100))
    : 0;

  const highVocCert2Count = stats.students.byGrade?.highVocCert2 || 0;
  const highVocGradRate = highVocCert2Count > 0
    ? Math.min(100, Math.round((graduatesEmployment.gradHighVocCert / highVocCert2Count) * 100))
    : stats.students.highVocCert > 0
    ? Math.min(100, Math.round((graduatesEmployment.gradHighVocCert / (stats.students.highVocCert / 2)) * 100))
    : 0;

  const totalGrad = graduatesEmployment.totalGraduates || 1;
  const employedRate = Math.round((graduatesEmployment.employed / totalGrad) * 100);
  const furtherStudyRate = Math.round((graduatesEmployment.furtherStudy / totalGrad) * 100);
  const otherRate = Math.max(0, 100 - employedRate - furtherStudyRate);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6">
      {/* 4 Cards with Unified Design System & Percentage Sub-Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: ปวช. ปัจจุบัน + % การสำเร็จการศึกษา ปวช. */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_-8px_rgba(37,99,235,0.2)] border border-slate-200/90 hover:border-blue-400/40 transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                ปวช. ปัจจุบัน
              </span>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
                <GraduationCap className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {students.vocCert.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                คน
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">สำเร็จการศึกษา ปวช.</span>
              <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg text-[11px] border border-blue-100">
                {vocGradRate}% ({graduatesEmployment.gradVocCert.toLocaleString()} คน)
              </span>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
              <div style={{ width: `${vocGradRate}%` }} className="bg-blue-600 h-full rounded-full" title={`สำเร็จการศึกษา ${vocGradRate}%`} />
            </div>
          </div>
        </div>

        {/* Card 2: ปวส. ปัจจุบัน + % การสำเร็จการศึกษา ปวส. */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_-8px_rgba(16,185,129,0.2)] border border-slate-200/90 hover:border-emerald-400/40 transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                ปวส. ปัจจุบัน
              </span>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
                <GraduationCap className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {students.highVocCert.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                คน
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">สำเร็จการศึกษา ปวส.</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg text-[11px] border border-emerald-100">
                {highVocGradRate}% ({graduatesEmployment.gradHighVocCert.toLocaleString()} คน)
              </span>
            </div>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
              <div style={{ width: `${highVocGradRate}%` }} className="bg-emerald-600 h-full rounded-full" title={`สำเร็จการศึกษา ${highVocGradRate}%`} />
            </div>
          </div>
        </div>

        {/* Card 3: ปวช. สำเร็จการศึกษา + % มีงานทำ และ % ศึกษาต่อ */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_-8px_rgba(245,158,11,0.2)] border border-slate-200/90 hover:border-amber-400/40 transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                ปวช. สำเร็จการศึกษา
              </span>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100/80 text-amber-700 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
                <CheckCircle2 className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {graduatesEmployment.gradVocCert.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                คน
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-emerald-50/70 px-2 py-1 rounded-xl border border-emerald-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-600 text-[11px] truncate">มีงานทำ: <strong className="text-emerald-700">{employedRate}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-50/70 px-2 py-1 rounded-xl border border-indigo-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-slate-600 text-[11px] truncate">ศึกษาต่อ: <strong className="text-indigo-700">{furtherStudyRate}%</strong></span>
              </div>
            </div>

            {/* Subtle ratio bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
              <div style={{ width: `${employedRate}%` }} className="bg-emerald-500 h-full" title={`มีงานทำ ${employedRate}%`} />
              <div style={{ width: `${furtherStudyRate}%` }} className="bg-indigo-500 h-full" title={`ศึกษาต่อ ${furtherStudyRate}%`} />
              <div style={{ width: `${otherRate}%` }} className="bg-slate-300 h-full" title={`อื่นๆ/ว่างงาน ${otherRate}%`} />
            </div>
          </div>
        </div>

        {/* Card 4: ปวส. สำเร็จการศึกษา + % มีงานทำ และ % ศึกษาต่อ */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_-8px_rgba(147,51,234,0.2)] border border-slate-200/90 hover:border-purple-400/40 transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                ปวส. สำเร็จการศึกษา
              </span>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100/80 text-purple-700 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
                <CheckCircle2 className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {graduatesEmployment.gradHighVocCert.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
                คน
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-emerald-50/70 px-2 py-1 rounded-xl border border-emerald-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-600 text-[11px] truncate">มีงานทำ: <strong className="text-emerald-700">{employedRate}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-50/70 px-2 py-1 rounded-xl border border-purple-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                <span className="text-slate-600 text-[11px] truncate">ศึกษาต่อ: <strong className="text-purple-700">{furtherStudyRate}%</strong></span>
              </div>
            </div>

            {/* Subtle ratio bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
              <div style={{ width: `${employedRate}%` }} className="bg-emerald-500 h-full" title={`มีงานทำ ${employedRate}%`} />
              <div style={{ width: `${furtherStudyRate}%` }} className="bg-purple-500 h-full" title={`ศึกษาต่อ ${furtherStudyRate}%`} />
              <div style={{ width: `${otherRate}%` }} className="bg-slate-300 h-full" title={`อื่นๆ/ว่างงาน ${otherRate}%`} />
            </div>
          </div>
        </div>

      </div>

      {/* Chart 1: Horizontal Bar (มีงานทำ vs ว่างงาน ของแต่ละวิทยาลัย) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0284c7] mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Employment Comparison by College</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              จำนวนยอดผู้สำเร็จการศึกษา มีงานทำ vs ว่างงาน (รายสถานศึกษา)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบสัดส่วนระหว่างผู้มีงานทำ (สีฟ้า) และผู้ที่ยังว่างงาน/กำลังหางาน (สีส้มแดง) ตามหลัก Square Color Harmony
            </p>
          </div>
        </div>

        <div className="h-96 w-full">
          <Bar
            data={collegeEmploymentData}
            options={{
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { font: { family: 'Sarabun', size: 12 } } },
                tooltip: {
                  bodyFont: { family: 'Sarabun' },
                  callbacks: {
                    label: (c) => `${c.dataset.label}: ${c.raw?.toLocaleString()} คน`,
                  },
                },
              },
              scales: {
                x: {
                  stacked: true,
                  ticks: {
                    font: { family: 'Sarabun' },
                    callback: (v) => `${Number(v).toLocaleString()} คน`,
                  },
                },
                y: {
                  stacked: true,
                  grid: { display: false },
                  ticks: { font: { family: 'Sarabun', size: 11 } },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Grid: Chart 2 (การมีงานทำแยกประเภท) & Chart 3 (โดนัทหน่วยงานที่เข้าทำงาน) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Chart 2: ประเภทการมีงานทำ */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#932d16] mb-1">
              <Briefcase className="w-4 h-4" />
              <span>Employment Categorization</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              ข้อมูลการมีงานทำแยกตามลักษณะอาชีพ
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              จำแนกตามความสอดคล้องกับสาขาวิชาชีพที่สำเร็จการศึกษา
            </p>
          </div>

          <div className="h-72 w-full">
            <Bar
              data={jobTypeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    bodyFont: { family: 'Sarabun' },
                    callbacks: {
                      label: (c) => `${c.raw?.toLocaleString()} คน`,
                    },
                  },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 11 } } },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      font: { family: 'Sarabun' },
                      callback: (v) => `${Number(v).toLocaleString()} คน`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 3: ประเภทหน่วยงานที่เข้าทำงาน (โดนัท) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              <PieChart className="w-4 h-4" />
              <span>Workplace Sector Distribution</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              ประเภทหน่วยงานที่เข้าปฏิบัติงาน
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              สัดส่วนระหว่างภาครัฐ เอกชน และธุรกิจส่วนตัว
            </p>
          </div>

          <div className="h-60 w-full relative flex items-center justify-center">
            <Doughnut
              data={workplaceDonutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: { position: 'bottom', labels: { font: { family: 'Sarabun', size: 11 } } },
                },
              }}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-950 font-semibold border border-purple-100">
              <div>รัฐบาล</div>
              <div className="text-xs font-bold text-[#7c3aed] mt-0.5">{graduatesEmployment.byWorkplace.government.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-950 font-semibold border border-sky-100">
              <div>เอกชน</div>
              <div className="text-xs font-bold text-[#0284c7] mt-0.5">{graduatesEmployment.byWorkplace.private.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-950 font-semibold border border-amber-100">
              <div>อิสระ</div>
              <div className="text-xs font-bold text-[#f59e0b] mt-0.5">{graduatesEmployment.byWorkplace.selfEmployed.toLocaleString()}</div>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
};
