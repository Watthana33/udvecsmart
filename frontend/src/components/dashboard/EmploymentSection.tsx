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
      <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[#932d16] text-xs font-bold uppercase tracking-wider">
          <Briefcase className="w-4 h-4" />
          <span>Graduates & Employment Report</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          ข้อมูลผู้สำเร็จการศึกษาและภาวะการมีงานทำ
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          ปีการศึกษา {stats.academicYear} ภาคเรียนที่ {stats.semester} (จำแนกตามสายอาชีพและหน่วยงานที่เข้าปฏิบัติงาน)
        </p>
      </div>

      {/* 4 Cards Requested by User */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: ยอดนักเรียน ปวช. ปัจจุบัน */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">ปวช. ปัจจุบัน</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {students.vocCert.toLocaleString()}{' '}
            <span className="text-xs font-medium text-slate-500">คน</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>กำลังศึกษาอยู่</span>
            <span className="font-semibold text-blue-600">ระดับประกาศนียบัตรวิชาชีพ</span>
          </div>
        </div>

        {/* Card 2: ยอดนักเรียน ปวส. ปัจจุบัน */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">ปวส. ปัจจุบัน</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {students.highVocCert.toLocaleString()}{' '}
            <span className="text-xs font-medium text-slate-500">คน</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>กำลังศึกษาอยู่</span>
            <span className="font-semibold text-emerald-600">ประกาศนียบัตรวิชาชีพชั้นสูง</span>
          </div>
        </div>

        {/* Card 3: ยอดนักเรียน ปวช. สำเร็จการศึกษา */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">ปวช. สำเร็จการศึกษา</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {graduatesEmployment.gradVocCert.toLocaleString()}{' '}
            <span className="text-xs font-medium text-slate-500">คน</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>สำเร็จการศึกษา</span>
            <span className="font-semibold text-amber-600">ประจำปีการศึกษา</span>
          </div>
        </div>

        {/* Card 4: ยอดนักเรียน ปวส. สำเร็จการศึกษา */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">ปวส. สำเร็จการศึกษา</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {graduatesEmployment.gradHighVocCert.toLocaleString()}{' '}
            <span className="text-xs font-medium text-slate-500">คน</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>สำเร็จการศึกษา</span>
            <span className="font-semibold text-purple-600">พร้อมเข้าสู่ตลาดแรงงาน</span>
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
