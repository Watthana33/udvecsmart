import React from 'react';
import { StatsOverview } from '../../types';
import { GraduationCap, School, Users, Briefcase, TrendingUp } from 'lucide-react';

interface StatCardsProps {
  stats: StatsOverview | null;
  loading: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <section id="stats" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-slate-200/70 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  const { students, institutions, personnel, graduatesEmployment } = stats;

  const totalEmployedReporting = graduatesEmployment.totalReported || 1;
  const employmentRate = ((graduatesEmployment.employed / totalEmployedReporting) * 100).toFixed(1);

  return (
    <section id="stats" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
      
      {/* Section Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
          <TrendingUp className="w-4 h-4" />
          <span>Real-time Statistics</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          สถิติภาพรวมอาชีวศึกษาจังหวัดอุดรธานี
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          ปีการศึกษา {stats.academicYear} ภาคเรียนที่ {stats.semester} (ข้อมูลรวบรวมจากสถานศึกษาในสังกัด)
        </p>
      </div>

      {/* 4 Main Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">นักเรียน / นักศึกษา</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {students.total.toLocaleString()} <span className="text-sm font-medium text-slate-500">คน</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>ระดับ ปวช.</span>
              <span className="font-semibold text-slate-900">{students.vocCert.toLocaleString()} คน</span>
            </div>
            <div className="flex justify-between">
              <span>ระดับ ปวส.</span>
              <span className="font-semibold text-slate-900">{students.highVocCert.toLocaleString()} คน</span>
            </div>
            {students.bachelor > 0 && (
              <div className="flex justify-between text-blue-700">
                <span>ปริญญาตรี (ทล.บ.)</span>
                <span className="font-semibold">{students.bachelor.toLocaleString()} คน</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Total Institutions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">สถานศึกษาในสังกัด</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {institutions.total} <span className="text-sm font-medium text-slate-500">แห่ง</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>สถานศึกษาภาครัฐ</span>
              </span>
              <span className="font-semibold text-slate-900">{institutions.public} แห่ง</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>สถานศึกษาภาคเอกชน</span>
              </span>
              <span className="font-semibold text-slate-900">{institutions.private} แห่ง</span>
            </div>
          </div>
        </div>

        {/* Card 3: Teachers & Personnel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ครูและบุคลากร</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {personnel.total.toLocaleString()} <span className="text-sm font-medium text-slate-500">คน</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>ครูผู้สอน</span>
              <span className="font-semibold text-slate-900">{personnel.teachers.toLocaleString()} คน</span>
            </div>
            <div className="flex justify-between">
              <span>บุคลากรสายสนับสนุน</span>
              <span className="font-semibold text-slate-900">{personnel.staff.toLocaleString()} คน</span>
            </div>
          </div>
        </div>

        {/* Card 4: Employment Rate */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ภาวะการมีงานทำ</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {employmentRate}%
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>มีงานทำ</span>
              <span className="font-semibold text-emerald-600">{graduatesEmployment.employed.toLocaleString()} คน</span>
            </div>
            <div className="flex justify-between">
              <span>ศึกษาต่อ</span>
              <span className="font-semibold text-blue-600">{graduatesEmployment.furtherStudy.toLocaleString()} คน</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
