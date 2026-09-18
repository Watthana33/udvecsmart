import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { StatsOverview, InstitutionStatItem } from '../../types';
import { BarChart3, PieChart, TrendingUp, Users } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface OverviewChartsProps {
  stats: StatsOverview | null;
  institutionStats: InstitutionStatItem[];
  loading: boolean;
}

export const OverviewCharts: React.FC<OverviewChartsProps> = ({
  stats,
  institutionStats,
  loading,
}) => {
  if (loading || !stats) {
    return (
      <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
          <div className="h-80 bg-slate-200/80 rounded-2xl" />
          <div className="h-80 bg-slate-200/80 rounded-2xl" />
        </div>
      </div>
    );
  }

  // 1. Data for Grade Level Bar Chart (ปวช.1-3, ปวส.1-2, ทล.บ.) แยก 2 สี รัฐบาล vs เอกชน
  const gradeLabels = ['ปวช.1', 'ปวช.2', 'ปวช.3', 'ปวส.1', 'ปวส.2', 'ปริญญาตรี (ทล.บ.)'];
  const pubGrades = stats.bySectorGrades.public;
  const privGrades = stats.bySectorGrades.private;

  const gradeChartData = {
    labels: gradeLabels,
    datasets: [
      {
        label: 'สถานศึกษารัฐบาล',
        data: [
          pubGrades.vocCert1,
          pubGrades.vocCert2,
          pubGrades.vocCert3,
          pubGrades.highVocCert1,
          pubGrades.highVocCert2,
          pubGrades.bachelor,
        ],
        backgroundColor: '#7c3aed',
        borderRadius: 6,
      },
      {
        label: 'สถานศึกษาเอกชน',
        data: [
          privGrades.vocCert1,
          privGrades.vocCert2,
          privGrades.vocCert3,
          privGrades.highVocCert1,
          privGrades.highVocCert2,
          privGrades.bachelor,
        ],
        backgroundColor: '#0284c7',
        borderRadius: 6,
      },
    ],
  };

  // 2. Data for Horizontal Bar Chart (นักเรียน ชาย-หญิง ของแต่ละวิทยาลัย)
  // ตัดแสดงเฉพาะวิทยาลัยที่มีข้อมูล (จัดเรียงตามจำนวนนักเรียน)
  const displayInstitutions = institutionStats.slice(0, 15); // แสดง 15 วิทยาลัยชั้นนำเพื่อความกระชับ
  const horizontalChartData = {
    labels: displayInstitutions.map((i) => i.institution.name.replace('วิทยาลัย', 'ว.')),
    datasets: [
      {
        label: 'ชาย (คน)',
        data: displayInstitutions.map((i) => i.maleStudents),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
      {
        label: 'หญิง (คน)',
        data: displayInstitutions.map((i) => i.femaleStudents),
        backgroundColor: '#ec4899',
        borderRadius: 4,
      },
    ],
  };

  // 3. Data for Donut Chart (สัดส่วน ชาย - หญิง)
  const totalMale = stats.students.male;
  const totalFemale = stats.students.female;
  const totalStudents = totalMale + totalFemale || 1;
  const malePercent = ((totalMale / totalStudents) * 100).toFixed(1);
  const femalePercent = ((totalFemale / totalStudents) * 100).toFixed(1);

  const genderDonutData = {
    labels: [`นักเรียนชาย (${malePercent}%)`, `นักเรียนหญิง (${femalePercent}%)`],
    datasets: [
      {
        data: [totalMale, totalFemale],
        backgroundColor: ['#3b82f6', '#ec4899'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Chart 1: Grade Levels (ปวช.1-3, ปวส.1-2, ทล.บ. แยก 2 สี รัฐ vs เอกชน) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#932d16]">
              <BarChart3 className="w-4 h-4" />
              <span>Grade Level Distribution</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              จำนวนนักเรียน นักศึกษา แยกตามระดับชั้นปี (ปวช.1 - ปวส.2 - ป.ตรี)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบสัดส่วนระหว่างสถานศึกษาภาครัฐ (สีม่วง) และสถานศึกษาภาคเอกชน (สีฟ้า) ตามหลัก Square Color Harmony
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#7c3aed]" />
              <span>รัฐบาล ({stats.institutions.public} แห่ง)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
              <span>เอกชน ({stats.institutions.private} แห่ง)</span>
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <Bar
            data={gradeChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { font: { family: 'Sarabun', size: 12 } } },
                tooltip: {
                  bodyFont: { family: 'Sarabun' },
                  callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.raw?.toLocaleString()} คน`,
                  },
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'Sarabun', size: 12 } } },
                y: {
                  beginAtZero: true,
                  ticks: {
                    font: { family: 'Sarabun' },
                    callback: (value) => `${Number(value).toLocaleString()} คน`,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Grid: Chart 2 (Horizontal Bar) & Chart 3 (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Chart 2: Horizontal Bar (ชาย-หญิง รายวิทยาลัย) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Gender Comparison by College</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              จำนวนยอดรวมนักเรียน ชาย - หญิง ของแต่ละวิทยาลัย
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              แสดงการกระจายตัวของนักศึกษาชายและหญิงรายสถานศึกษา
            </p>
          </div>

          <div className="h-96 w-full">
            <Bar
              data={horizontalChartData}
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

        {/* Chart 3: Donut (สัดส่วน ชาย - หญิง ทั้งจังหวัด) */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-600 mb-1">
              <PieChart className="w-4 h-4" />
              <span>Gender Ratio (Overall)</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              สัดส่วนนักเรียน นักศึกษา ชาย - หญิง
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              คิดเป็นเปอร์เซ็นต์จากนักเรียนทั้งหมด {stats.students.total.toLocaleString()} คน
            </p>
          </div>

          <div className="h-64 w-full relative flex items-center justify-center">
            <Doughnut
              data={genderDonutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                  legend: { position: 'bottom', labels: { font: { family: 'Sarabun', size: 12 } } },
                },
              }}
            />
            {/* Center Summary */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <Users className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs text-slate-400">รวมทั้งหมด</span>
              <span className="text-base font-extrabold text-slate-900">
                {stats.students.total.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-900 font-semibold">
              <div>ชาย: {totalMale.toLocaleString()} คน</div>
              <div className="text-[11px] text-blue-600 font-bold mt-0.5">{malePercent}%</div>
            </div>
            <div className="p-2 rounded-xl bg-pink-50 text-pink-900 font-semibold">
              <div>หญิง: {totalFemale.toLocaleString()} คน</div>
              <div className="text-[11px] text-pink-600 font-bold mt-0.5">{femalePercent}%</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
