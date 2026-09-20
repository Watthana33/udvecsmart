import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Award,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  School,
  Clock,
  Laptop,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  X,
} from 'lucide-react';
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
import { getDveAndCareerSummary } from '../../services/api';
import { DveAndCareerSummary } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DveCareerSectionProps {
  selectedYear: number;
  selectedSemester: number;
  selectedInstitutionId: string;
}

// Color palette for departments in the DVE chart
const DEPARTMENT_COLORS = [
  '#932d16', // VEC Red
  '#2563eb', // Royal Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#0891b2', // Cyan
  '#dc2626', // Bright Red
  '#ea580c', // Orange
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#ca8a04', // Yellow ochre
  '#64748b', // Slate
];

export const DveCareerSection: React.FC<DveCareerSectionProps> = ({
  selectedYear,
  selectedSemester,
  selectedInstitutionId,
}) => {
  const [summary, setSummary] = useState<DveAndCareerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'dve' | 'career' | 'personnel'>('dve');

  // Subtab 1: DVE State
  const [dveSearch, setDveSearch] = useState('');
  const [selectedDveDetail, setSelectedDveDetail] = useState<{
    institutionName: string;
    departmentCount: number;
    studentCount: number;
    departments: string[];
  } | null>(null);

  // Subtab 2: Career Classrooms State
  const [careerSearch, setCareerSearch] = useState('');
  const [careerTrainingFilter, setCareerTrainingFilter] = useState<'ALL' | 'SHORT_COURSE' | 'RESKILL_UPSKILL'>('ALL');
  const [careerFormatFilter, setCareerFormatFilter] = useState<'ALL' | 'ONSITE' | 'WORKPLACE' | 'ONLINE' | 'HYBRID'>('ALL');
  const [careerPage, setCareerPage] = useState(1);
  const careerPageSize = 10;

  useEffect(() => {
    setLoading(true);
    getDveAndCareerSummary(selectedYear, selectedSemester, selectedInstitutionId)
      .then((data) => {
        setSummary(data);
        setCareerPage(1);
      })
      .catch((err) => console.error('Failed to load DVE & Career summary:', err))
      .finally(() => setLoading(false));
  }, [selectedYear, selectedSemester, selectedInstitutionId]);

  const dveSummary = summary?.dveSummary;
  const careerClassSummary = summary?.careerClassSummary;
  const pendingGraduates = summary?.pendingGraduates;
  const personnelDemographics = summary?.personnelDemographics;

  // -------------------------------------------------------------
  // Subtab 1 (DVE) Computations
  // -------------------------------------------------------------
  // Group DVE students by departmentName across all colleges
  const departmentAggregates = useMemo(() => {
    if (!dveSummary?.departmentsList) return [];
    const map = new Map<string, { name: string; totalStudents: number; colleges: Set<string> }>();
    
    dveSummary.departmentsList.forEach((item) => {
      const name = item.departmentName.trim();
      if (!map.has(name)) {
        map.set(name, { name, totalStudents: 0, colleges: new Set() });
      }
      const entry = map.get(name)!;
      entry.totalStudents += item.studentCount || 0;
      if (item.institution?.name) {
        entry.colleges.add(item.institution.name);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalStudents - a.totalStudents);
  }, [dveSummary?.departmentsList]);

  // Top 10 departments for Horizontal Bar Chart
  const topDepartments = useMemo(() => departmentAggregates.slice(0, 10), [departmentAggregates]);

  const dvrChartData = useMemo(() => {
    return {
      labels: topDepartments.map((d) => d.name),
      datasets: [
        {
          label: 'จำนวนนักเรียนทวิภาคี (คน)',
          data: topDepartments.map((d) => d.totalStudents),
          backgroundColor: topDepartments.map((_, i) => DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length]),
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 24,
        },
      ],
    };
  }, [topDepartments]);

  const dveChartOptions = useMemo(() => {
    return {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleFont: { family: 'Prompt, sans-serif', size: 13, weight: 'bold' as const },
          bodyFont: { family: 'Prompt, sans-serif', size: 12 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              const dept = topDepartments[context.dataIndex];
              const collegeCount = dept ? dept.colleges.size : 1;
              return [
                ` นักเรียน: ${context.parsed.x.toLocaleString()} คน`,
                ` เปิดสอนใน: ${collegeCount} วิทยาลัย`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { family: 'Prompt, sans-serif', size: 11 },
            color: '#64748b',
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { family: 'Prompt, sans-serif', size: 12, weight: 'bold' as const },
            color: '#1e293b',
          },
        },
      },
    };
  }, [topDepartments]);

  // Filtered colleges for DVE Summary Table
  const filteredDveInstitutions = useMemo(() => {
    if (!dveSummary?.byInstitution) return [];
    const query = dveSearch.toLowerCase().trim();
    return dveSummary.byInstitution
      .filter((item) => {
        if (!query) return true;
        const matchInst = item.institutionName.toLowerCase().includes(query);
        const matchDept = item.departments.some((d) => d.toLowerCase().includes(query));
        return matchInst || matchDept;
      })
      .sort((a, b) => b.studentCount - a.studentCount);
  }, [dveSummary?.byInstitution, dveSearch]);

  // -------------------------------------------------------------
  // Subtab 2 (Career Classrooms) Computations
  // -------------------------------------------------------------
  const filteredCareerClasses = useMemo(() => {
    if (!careerClassSummary?.classroomsList) return [];
    const query = careerSearch.toLowerCase().trim();
    return careerClassSummary.classroomsList.filter((item) => {
      const matchType = careerTrainingFilter === 'ALL' || item.trainingType === careerTrainingFilter;
      const matchFormat = careerFormatFilter === 'ALL' || item.learningFormat === careerFormatFilter;
      const matchQuery =
        !query ||
        item.courseName.toLowerCase().includes(query) ||
        (item.institution?.name && item.institution.name.toLowerCase().includes(query)) ||
        (item.partnerSchoolNames && item.partnerSchoolNames.toLowerCase().includes(query)) ||
        (item.partnerSchools && item.partnerSchools.some((s) => s.schoolName.toLowerCase().includes(query)));
      return matchType && matchFormat && matchQuery;
    });
  }, [careerClassSummary?.classroomsList, careerSearch, careerTrainingFilter, careerFormatFilter]);

  const totalCareerPages = Math.max(1, Math.ceil(filteredCareerClasses.length / careerPageSize));
  const paginatedCareerClasses = useMemo(() => {
    const start = (careerPage - 1) * careerPageSize;
    return filteredCareerClasses.slice(start, start + careerPageSize);
  }, [filteredCareerClasses, careerPage, careerPageSize]);

  // Donut: Learning Format
  const learningFormatData = useMemo(() => {
    if (!careerClassSummary) return null;
    const { onsite, workplace, online, hybrid } = careerClassSummary.byLearningFormat;
    const total = onsite + workplace + online + hybrid || 1;
    return {
      labels: [
        `ในสถานศึกษา (${((onsite / total) * 100).toFixed(0)}%)`,
        `ในสถานประกอบการ (${((workplace / total) * 100).toFixed(0)}%)`,
        `ออนไลน์ (${((online / total) * 100).toFixed(0)}%)`,
        `ผสมผสาน (${((hybrid / total) * 100).toFixed(0)}%)`,
      ],
      datasets: [
        {
          data: [onsite, workplace, online, hybrid],
          backgroundColor: ['#059669', '#2563eb', '#0891b2', '#7c3aed'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4,
        },
      ],
    };
  }, [careerClassSummary]);

  // Donut: Training Type
  const trainingTypeData = useMemo(() => {
    if (!careerClassSummary) return null;
    const { shortCourse, reskillUpskill } = careerClassSummary.byTrainingType;
    const total = shortCourse + reskillUpskill || 1;
    return {
      labels: [
        `ฝึกอาชีพระยะสั้น (${((shortCourse / total) * 100).toFixed(0)}%)`,
        `Reskill / Upskill (${((reskillUpskill / total) * 100).toFixed(0)}%)`,
      ],
      datasets: [
        {
          data: [shortCourse, reskillUpskill],
          backgroundColor: ['#d97706', '#6366f1'],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4,
        },
      ],
    };
  }, [careerClassSummary]);

  // -------------------------------------------------------------
  // Subtab 3 (Personnel) Computations
  // -------------------------------------------------------------
  const personnelEduChartData = useMemo(() => {
    if (!personnelDemographics) return null;
    const edu = personnelDemographics.byEducation;
    const total =
      edu.doctor.total + edu.master.total + edu.bachelor.total + edu.associate.total || 1;
    return {
      labels: [
        `ปริญญาเอก (${((edu.doctor.total / total) * 100).toFixed(1)}%)`,
        `ปริญญาโท (${((edu.master.total / total) * 100).toFixed(1)}%)`,
        `ปริญญาตรี (${((edu.bachelor.total / total) * 100).toFixed(1)}%)`,
        `อนุปริญญา (${((edu.associate.total / total) * 100).toFixed(1)}%)`,
      ],
      datasets: [
        {
          data: [edu.doctor.total, edu.master.total, edu.bachelor.total, edu.associate.total],
          backgroundColor: ['#932d16', '#7c3aed', '#2563eb', '#059669'],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };
  }, [personnelDemographics]);

  const personnelEmploymentChartData = useMemo(() => {
    if (!personnelDemographics) return null;
    const { civilTeachers, hiredTeachers } = personnelDemographics;
    return {
      labels: ['ข้าราชการครู', 'ครูอัตราจ้าง / ชั่วคราว'],
      datasets: [
        {
          label: 'ชาย (คน)',
          data: [civilTeachers.male, hiredTeachers.male],
          backgroundColor: '#0284c7',
          borderRadius: 6,
        },
        {
          label: 'หญิง (คน)',
          data: [civilTeachers.female, hiredTeachers.female],
          backgroundColor: '#db2777',
          borderRadius: 6,
        },
      ],
    };
  }, [personnelDemographics]);

  return (
    <div id="dve-career-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-6 scroll-mt-24">
      {loading || !summary || !dveSummary || !careerClassSummary || !pendingGraduates || !personnelDemographics ? (
        <div className="py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200/80 rounded-3xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* =======================================================
              1. Top Summary KPI Cards (5 Cards)
             ======================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Card 1: ทวิภาคีรวม */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ระบบทวิภาคี</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {dveSummary.totalStudents.toLocaleString()} <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-blue-700 font-semibold mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" /> เปิดสอน {dveSummary.totalDepartments} แผนกวิชา
              </p>
            </div>

            {/* Card 2: ทวิศึกษา & ทวิวุฒิ */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ทวิศึกษา & ทวิวุฒิ</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {(dveSummary.dualStudyStudents + dveSummary.dualDegreeStudents).toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-purple-700 font-semibold mt-1 truncate">
                ทวิศึกษา {dveSummary.dualStudyStudents} | ทวิวุฒิ {dveSummary.dualDegreeStudents}
              </p>
            </div>

            {/* Card 3: ห้องเรียนอาชีพ */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ห้องเรียนอาชีพ</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {careerClassSummary.totalStudents.toLocaleString()} <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-amber-700 font-semibold mt-1 truncate">
                {careerClassSummary.totalCourses} หลักสูตร ({careerClassSummary.totalPartnerSchools} รร.เครือข่าย)
              </p>
            </div>

            {/* Card 4: ครูและบุคลากร */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ครูผู้สอน</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {personnelDemographics.totalTeachers.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1 truncate">
                ชาย {personnelDemographics.maleTeachers} | หญิง {personnelDemographics.femaleTeachers}
              </p>
            </div>

            {/* Card 5: นักเรียนศึกษาต่อที่ยังไม่จบ */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ศึกษาต่อแต่ยังไม่จบ</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {pendingGraduates.total.toLocaleString()} <span className="text-xs font-normal text-slate-500">คน</span>
              </div>
              <p className="text-[11px] text-rose-700 font-semibold mt-1 truncate">
                ม.3 ({pendingGraduates.m3}) | ม.6 ({pendingGraduates.m6}) | ปวช.3 ({pendingGraduates.vocCert3})
              </p>
            </div>
          </div>

          {/* =======================================================
              2. Subtabs Switcher (No Sparkles, Clean UX)
             ======================================================= */}
          <div className="flex items-center gap-2 p-2 bg-slate-100/90 backdrop-blur-xs rounded-2xl border border-slate-200/90 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('dve')}
              className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'dve'
                  ? 'bg-white text-[#932d16] shadow-sm ring-2 ring-[#932d16]/15 scale-[1.01]'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${activeSubTab === 'dve' ? 'text-[#932d16]' : 'text-slate-400'}`} />
              <span>1. ระบบทวิภาคี</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('career')}
              className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'career'
                  ? 'bg-white text-[#932d16] shadow-sm ring-2 ring-[#932d16]/15 scale-[1.01]'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <Award className={`w-4 h-4 ${activeSubTab === 'career' ? 'text-[#932d16]' : 'text-slate-400'}`} />
              <span>2. หลักสูตรห้องเรียนอาชีพ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('personnel')}
              className={`flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'personnel'
                  ? 'bg-white text-[#932d16] shadow-sm ring-2 ring-[#932d16]/15 scale-[1.01]'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
              }`}
            >
              <Users className={`w-4 h-4 ${activeSubTab === 'personnel' ? 'text-[#932d16]' : 'text-slate-400'}`} />
              <span>3. บุคลากร & วุฒิการศึกษา</span>
            </button>
          </div>

          {/* =======================================================
              SUBTAB 1: ระบบทวิภาคี (DVE) - Chart & Summary Table
             ======================================================= */}
          {activeSubTab === 'dve' && (
            <div className="space-y-6">
              {/* Top Row: Horizontal Bar Chart grouped by department */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#932d16]">
                      <BarChart3 className="w-4 h-4" />
                      <span>DVE Departments Overview</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      สถิตินักเรียนระบบทวิภาคี จำแนกตามสาขาวิชา/แผนกวิชา (Top 10 ยอดนิยม)
                    </h3>
                    <p className="text-xs text-slate-500">
                      แสดงการกระจายตัวของนักเรียนทวิภาคีตามแผนกวิชา แยกตามสีของแต่ละสาขา
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                    รวมทั้งสิ้น {departmentAggregates.length} สาขาวิชา
                  </div>
                </div>

                {topDepartments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    ไม่มีข้อมูลแผนกวิชาทวิภาคีในรอบนี้
                  </div>
                ) : (
                  <div className="h-72 sm:h-80 w-full pt-2">
                    <Bar data={dvrChartData} options={dveChartOptions} />
                  </div>
                )}
              </div>

              {/* Bottom Section: Compact Summary Table per College */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#932d16]" />
                      <span>สรุปข้อมูลการจัดการศึกษาระบบทวิภาคี จำแนกรายสถานศึกษา</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ปีการศึกษา {selectedYear} ภาคเรียนที่ {selectedSemester} (คลิกดูเจาะลึกเพื่อดูรายละเอียดรายสาขาวิชา)
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative min-w-[240px] sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={dveSearch}
                      onChange={(e) => setDveSearch(e.target.value)}
                      placeholder="ค้นหาวิทยาลัย หรือสาขาวิชา..."
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16]"
                    />
                    {dveSearch && (
                      <button
                        type="button"
                        onClick={() => setDveSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5 text-center w-12">#</th>
                        <th className="py-3 px-4 min-w-[200px]">สถานศึกษา</th>
                        <th className="py-3 px-4 min-w-[320px]">สาขาวิชาที่เปิดสอนทวิภาคี</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap">จำนวนแผนก</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap text-[#932d16]">นักเรียนทวิภาคีรวม</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap">รายละเอียด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {filteredDveInstitutions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">
                            ไม่พบข้อมูลวิทยาลัยที่ตรงกับคำค้นหา
                          </td>
                        </tr>
                      ) : (
                        filteredDveInstitutions.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                            onClick={() => setSelectedDveDetail(item)}
                          >
                            <td className="py-3 px-3.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-3 px-4 font-black text-slate-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-[#932d16] shrink-0" />
                              <span>{item.institutionName}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1.5 max-w-lg">
                                {item.departments.slice(0, 3).map((dept, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/60"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    {dept}
                                  </span>
                                ))}
                                {item.departments.length > 3 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                                    +{item.departments.length - 3} แผนก
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                                {item.departmentCount} แผนก
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <strong className="text-sm font-black text-[#932d16]">
                                {item.studentCount.toLocaleString()}{' '}
                                <span className="text-[11px] font-normal text-slate-500">คน</span>
                              </strong>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDveDetail(item);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-[#932d16] hover:text-white hover:border-[#932d16] text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                              >
                                ดูเจาะลึก
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* College Drill-down Modal / Slide Card */}
                {selectedDveDetail && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            ข้อมูลเจาะลึกระบบทวิภาคี
                          </span>
                          <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
                            <Building2 className="w-5 h-5 text-[#932d16]" />
                            <span>{selectedDveDetail.institutionName}</span>
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedDveDetail(null)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                          <span className="text-[11px] font-bold text-blue-900 block">จำนวนแผนกที่เปิดสอน</span>
                          <strong className="text-lg font-black text-blue-950">
                            {selectedDveDetail.departmentCount} แผนกวิชา
                          </strong>
                        </div>
                        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl">
                          <span className="text-[11px] font-bold text-rose-900 block">นักเรียนทวิภาคีรวม</span>
                          <strong className="text-lg font-black text-rose-950">
                            {selectedDveDetail.studentCount.toLocaleString()} คน
                          </strong>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-slate-700 mb-2 block">
                          รายชื่อแผนกวิชาและยอดนักเรียน:
                        </span>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {selectedDveDetail.departments.map((deptStr, dIdx) => (
                            <div
                              key={dIdx}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2 font-bold text-slate-800">
                                <span className="w-2 h-2 rounded-full bg-[#932d16]" />
                                <span>{deptStr.split('(')[0]?.trim()}</span>
                              </div>
                              <span className="font-mono font-bold text-[#932d16] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {deptStr.split('(')[1]?.replace(')', '') || ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedDveDetail(null)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                        >
                          ปิดหน้าต่าง
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =======================================================
              SUBTAB 2: โครงการห้องเรียนอาชีพ (Career Classrooms)
             ======================================================= */}
          {activeSubTab === 'career' && (
            <div className="space-y-6">
              {/* Top Row: 2 Visual Donut Charts side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Donut Chart 1: รูปแบบการจัดการเรียนรู้ */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                      <PieChart className="w-4 h-4" />
                      <span>สัดส่วนรูปแบบการจัดการเรียนรู้</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      จำแนกตาม Onsite / Workplace / Online / Hybrid
                    </h4>
                  </div>
                  <div className="h-56 w-full flex items-center justify-center my-2">
                    {learningFormatData && (
                      <Doughnut
                        data={learningFormatData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                font: { family: 'Prompt, sans-serif', size: 11 },
                                boxWidth: 12,
                                padding: 12,
                              },
                            },
                          },
                          cutout: '68%',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Donut Chart 2: ประเภทหลักสูตร (ระยะสั้น vs Reskill) */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 mb-1">
                      <PieChart className="w-4 h-4" />
                      <span>สัดส่วนประเภทการอบรมและพัฒนาทักษะ</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      ฝึกอาชีพระยะสั้น เปรียบเทียบกับ Reskill / Upskill
                    </h4>
                  </div>
                  <div className="h-56 w-full flex items-center justify-center my-2">
                    {trainingTypeData && (
                      <Doughnut
                        data={trainingTypeData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                font: { family: 'Prompt, sans-serif', size: 11 },
                                boxWidth: 12,
                                padding: 12,
                              },
                            },
                          },
                          cutout: '68%',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 4 Mini Metric Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-amber-900 block">ฝึกอาชีพระยะสั้น</span>
                    <strong className="text-base font-black text-amber-950">
                      {careerClassSummary.byTrainingType.shortCourse} หลักสูตร
                    </strong>
                  </div>
                </div>
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center gap-3">
                  <Award className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-indigo-900 block">Reskill / Upskill</span>
                    <strong className="text-base font-black text-indigo-950">
                      {careerClassSummary.byTrainingType.reskillUpskill} หลักสูตร
                    </strong>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3">
                  <School className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-emerald-900 block">ในสถานศึกษา (Onsite)</span>
                    <strong className="text-base font-black text-emerald-950">
                      {careerClassSummary.byLearningFormat.onsite} หลักสูตร
                    </strong>
                  </div>
                </div>
                <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl flex items-center gap-3">
                  <Laptop className="w-5 h-5 text-sky-600 shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold text-sky-900 block">ออนไลน์ & ผสมผสาน</span>
                    <strong className="text-base font-black text-sky-950">
                      {careerClassSummary.byLearningFormat.online + careerClassSummary.byLearningFormat.hybrid} หลักสูตร
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Searchable & Paginated Table */}
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#932d16]" />
                      <span>ตารางรายชื่อหลักสูตรห้องเรียนอาชีพและการอบรม</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      รวมทั้งสิ้น {filteredCareerClasses.length} หลักสูตร จากทั้งหมด {careerClassSummary.totalCourses} หลักสูตร
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Pills */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setCareerTrainingFilter('ALL');
                          setCareerPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          careerTrainingFilter === 'ALL'
                            ? 'bg-white text-[#932d16] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ทั้งหมด ({careerClassSummary.totalCourses})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCareerTrainingFilter('SHORT_COURSE');
                          setCareerPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          careerTrainingFilter === 'SHORT_COURSE'
                            ? 'bg-white text-amber-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ฝึกอาชีพระยะสั้น ({careerClassSummary.byTrainingType.shortCourse})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCareerTrainingFilter('RESKILL_UPSKILL');
                          setCareerPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          careerTrainingFilter === 'RESKILL_UPSKILL'
                            ? 'bg-white text-indigo-800 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Reskill/Upskill ({careerClassSummary.byTrainingType.reskillUpskill})
                      </button>
                    </div>

                    {/* Format Filter Dropdown */}
                    <select
                      value={careerFormatFilter}
                      onChange={(e) => {
                        setCareerFormatFilter(e.target.value as any);
                        setCareerPage(1);
                      }}
                      className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] cursor-pointer"
                    >
                      <option value="ALL">ทุกรูปแบบการเรียน</option>
                      <option value="ONSITE">ในสถานศึกษา (Onsite)</option>
                      <option value="WORKPLACE">ในสถานประกอบการ</option>
                      <option value="ONLINE">ออนไลน์ (Online)</option>
                      <option value="HYBRID">ผสมผสาน (Hybrid)</option>
                    </select>

                    {/* Search Bar */}
                    <div className="relative min-w-[200px] sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={careerSearch}
                        onChange={(e) => {
                          setCareerSearch(e.target.value);
                          setCareerPage(1);
                        }}
                        placeholder="ค้นหาหลักสูตร หรือวิทยาลัย..."
                        className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16]"
                      />
                      {careerSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setCareerSearch('');
                            setCareerPage(1);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5 text-center w-12">#</th>
                        <th className="py-3 px-4 min-w-[220px]">หลักสูตร / โครงการ</th>
                        <th className="py-3 px-4 min-w-[180px]">สถานศึกษาที่จัด</th>
                        <th className="py-3 px-3 text-center whitespace-nowrap">ประเภท / รูปแบบ</th>
                        <th className="py-3 px-4 min-w-[200px]">รร.เครือข่ายที่เข้าร่วม</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap text-[#932d16]">จำนวนผู้เรียน (คน)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {paginatedCareerClasses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">
                            ไม่พบหลักสูตรที่ตรงกับเงื่อนไขการค้นหา
                          </td>
                        </tr>
                      ) : (
                        paginatedCareerClasses.map((item, idx) => {
                          const realIdx = (careerPage - 1) * careerPageSize + idx + 1;
                          return (
                            <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                              <td className="py-3 px-3.5 text-center text-slate-400 font-mono">{realIdx}</td>
                              <td className="py-3 px-4">
                                <span className="font-black text-slate-900 block text-xs leading-snug">
                                  {item.courseName}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                                  <Building2 className="w-3.5 h-3.5 text-[#932d16] shrink-0" />
                                  <span>{item.institution?.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      item.trainingType === 'RESKILL_UPSKILL'
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    {item.trainingType === 'RESKILL_UPSKILL' ? 'Reskill / Upskill' : 'ฝึกอาชีพระยะสั้น'}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {item.learningFormat === 'ONSITE'
                                      ? 'ในสถานศึกษา'
                                      : item.learningFormat === 'WORKPLACE'
                                      ? 'ในสถานประกอบการ'
                                      : item.learningFormat === 'ONLINE'
                                      ? 'ออนไลน์'
                                      : 'ผสมผสาน'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <span className="text-slate-800 font-bold">
                                    {item.partnerSchoolCount} โรงเรียน
                                  </span>
                                  {item.partnerSchools && item.partnerSchools.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.partnerSchools.map((ps, psIdx) => (
                                        <span
                                          key={psIdx}
                                          className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200 shadow-3xs"
                                          title={`${ps.schoolName}: ${ps.studentCount.toLocaleString()} คน`}
                                        >
                                          <span className="font-semibold">{ps.schoolName}</span>
                                          <span className="font-black text-[#932d16]">({ps.studentCount} คน)</span>
                                        </span>
                                      ))}
                                    </div>
                                  ) : item.partnerSchoolNames ? (
                                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={item.partnerSchoolNames}>
                                      {item.partnerSchoolNames}
                                    </p>
                                  ) : null}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <strong className="text-sm font-black text-[#932d16]">
                                  {item.studentCount.toLocaleString()}{' '}
                                  <span className="text-[11px] font-normal text-slate-500">คน</span>
                                </strong>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalCareerPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">
                      แสดง {(careerPage - 1) * careerPageSize + 1} -{' '}
                      {Math.min(careerPage * careerPageSize, filteredCareerClasses.length)} จากทั้งหมด{' '}
                      {filteredCareerClasses.length} รายการ
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={careerPage === 1}
                        onClick={() => setCareerPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: totalCareerPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalCareerPages || Math.abs(p - careerPage) <= 1)
                        .map((page, idx, arr) => {
                          const prev = arr[idx - 1];
                          return (
                            <React.Fragment key={page}>
                              {prev && page - prev > 1 && (
                                <span className="px-1 text-slate-400 text-xs">...</span>
                              )}
                              <button
                                type="button"
                                onClick={() => setCareerPage(page)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  careerPage === page
                                    ? 'bg-[#932d16] text-white shadow-xs'
                                    : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}

                      <button
                        type="button"
                        disabled={careerPage === totalCareerPages}
                        onClick={() => setCareerPage((p) => Math.min(totalCareerPages, p + 1))}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =======================================================
              SUBTAB 3: บุคลากร & วุฒิการศึกษา (Personnel)
             ======================================================= */}
          {activeSubTab === 'personnel' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#932d16]" />
                  <span>ข้อมูลบุคลากรทางการศึกษา จำแนกเพศ วิทยฐานะ และประเภทการจ้าง</span>
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  รวมครูผู้สอนทั้งจังหวัด {personnelDemographics.totalTeachers.toLocaleString()} คน
                </span>
              </div>

              {/* Top Row: 2 Visual Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart 1: Donut for Education Levels */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#932d16] mb-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>Education Distribution</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      สัดส่วนวุฒิการศึกษาของครูผู้สอน
                    </h4>
                  </div>
                  <div className="h-60 w-full flex items-center justify-center my-2">
                    {personnelEduChartData && (
                      <Doughnut
                        data={personnelEduChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                font: { family: 'Prompt, sans-serif', size: 11 },
                                boxWidth: 12,
                                padding: 10,
                              },
                            },
                          },
                          cutout: '66%',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Chart 2: Grouped Bar for Employment Types by Gender */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                      <BarChart3 className="w-4 h-4" />
                      <span>Employment & Gender</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      ประเภทการจ้างงานจำแนกตามเพศ ชาย - หญิง
                    </h4>
                  </div>
                  <div className="h-60 w-full pt-3">
                    {personnelEmploymentChartData && (
                      <Bar
                        data={personnelEmploymentChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: {
                                font: { family: 'Prompt, sans-serif', size: 11 },
                                boxWidth: 12,
                              },
                            },
                          },
                          scales: {
                            x: {
                              grid: { display: false },
                              ticks: {
                                font: { family: 'Prompt, sans-serif', size: 12, weight: 'bold' as const },
                                color: '#1e293b',
                              },
                            },
                            y: {
                              grid: { color: '#f1f5f9' },
                              ticks: {
                                font: { family: 'Prompt, sans-serif', size: 11 },
                                color: '#64748b',
                              },
                            },
                          },
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Detailed Table & Contract Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Box 1: จำแนกตามวุฒิการศึกษา ชาย-หญิง */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#932d16]" />
                    <span>ตารางรายละเอียดระดับวุฒิการศึกษา (ชาย / หญิง)</span>
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">ระดับการศึกษา</th>
                          <th className="py-2.5 px-3 text-center text-blue-700">ชาย</th>
                          <th className="py-2.5 px-3 text-center text-rose-700">หญิง</th>
                          <th className="py-2.5 px-3 text-right text-[#932d16]">รวม (คน)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold">
                        <tr>
                          <td className="py-2 px-3">อนุปริญญาหรือเทียบเท่า</td>
                          <td className="py-2 px-3 text-center text-blue-700">
                            {personnelDemographics.byEducation.associate.male}
                          </td>
                          <td className="py-2 px-3 text-center text-rose-700">
                            {personnelDemographics.byEducation.associate.female}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">
                            {personnelDemographics.byEducation.associate.total}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">ปริญญาตรี</td>
                          <td className="py-2 px-3 text-center text-blue-700">
                            {personnelDemographics.byEducation.bachelor.male}
                          </td>
                          <td className="py-2 px-3 text-center text-rose-700">
                            {personnelDemographics.byEducation.bachelor.female}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">
                            {personnelDemographics.byEducation.bachelor.total}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">ปริญญาโท</td>
                          <td className="py-2 px-3 text-center text-blue-700">
                            {personnelDemographics.byEducation.master.male}
                          </td>
                          <td className="py-2 px-3 text-center text-rose-700">
                            {personnelDemographics.byEducation.master.female}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">
                            {personnelDemographics.byEducation.master.total}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">ปริญญาเอก</td>
                          <td className="py-2 px-3 text-center text-blue-700">
                            {personnelDemographics.byEducation.doctor.male}
                          </td>
                          <td className="py-2 px-3 text-center text-rose-700">
                            {personnelDemographics.byEducation.doctor.female}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">
                            {personnelDemographics.byEducation.doctor.total}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Box 2: จำแนกตามประเภทการจ้างงาน */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#932d16]" />
                    <span>สรุปประเภทตำแหน่งและสัญญาจ้าง</span>
                  </h4>

                  <div className="space-y-3 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">ข้าราชการครู</span>
                        <span className="text-[11px] text-slate-500">
                          ชาย {personnelDemographics.civilTeachers.male} คน | หญิง{' '}
                          {personnelDemographics.civilTeachers.female} คน
                        </span>
                      </div>
                      <strong className="text-base font-black text-[#932d16]">
                        {personnelDemographics.civilTeachers.total.toLocaleString()} คน
                      </strong>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">ครูอัตราจ้าง / ลูกจ้างชั่วคราว</span>
                        <span className="text-[11px] text-slate-500">
                          ชาย {personnelDemographics.hiredTeachers.male} คน | หญิง{' '}
                          {personnelDemographics.hiredTeachers.female} คน
                        </span>
                      </div>
                      <strong className="text-base font-black text-[#932d16]">
                        {personnelDemographics.hiredTeachers.total.toLocaleString()} คน
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
