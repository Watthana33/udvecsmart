import React from 'react';
import { StatsOverview } from '../../types';
import { UserCheck, Users, GraduationCap, School } from 'lucide-react';

interface StatCardsProps {
  stats: StatsOverview | null;
  loading: boolean;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-slate-200/70 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const { students, institutions, personnel, executivesCount } = stats;

  // Calculate percentages for subtle visual indicators
  const studentTotal = students.total || 1;
  const malePercent = Math.round((students.male / studentTotal) * 100);

  const personnelTotal = personnel.total || 1;
  const teacherPercent = Math.round((personnel.teachers / personnelTotal) * 100);

  const instTotal = institutions.total || 1;
  const publicInstPercent = Math.round((institutions.public / instTotal) * 100);

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* ==========================================
            Card 1: ผู้บริหารสถานศึกษา (Executive)
           ========================================== */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_-8px_rgba(147,45,22,0.15)] border border-slate-200/90 hover:border-[#932d16]/30 transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                ผู้บริหาร
              </span>
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100/80 text-[#932d16] flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
                <UserCheck className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {executivesCount.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                ท่าน
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">ผู้อำนวยการสถานศึกษา</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#932d16] bg-[#932d16]/10 px-2.5 py-0.5 rounded-lg text-[11px]">
                {executivesCount} คน
              </span>
            </div>
          </div>
        </div>

        {/* ==========================================
            Card 2: ครูและบุคลากรทางการศึกษา (Personnel)
           ========================================== */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_-8px_rgba(245,158,11,0.2)] border border-slate-200/90 hover:border-amber-400/40 transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                ครูและบุคลากร
              </span>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100/80 text-amber-700 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
                <Users className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {personnel.total.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                คน
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-amber-50/70 px-2.5 py-1 rounded-xl border border-amber-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-600 text-[11px] truncate">ครู: <strong className="text-slate-900">{personnel.teachers.toLocaleString()}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1 rounded-xl border border-orange-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                <span className="text-slate-600 text-[11px] truncate">บุคลากร: <strong className="text-slate-900">{personnel.staff.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Subtle ratio bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
              <div style={{ width: `${teacherPercent}%` }} className="bg-amber-500 h-full" title={`ครู ${teacherPercent}%`} />
              <div style={{ width: `${100 - teacherPercent}%` }} className="bg-orange-400 h-full" title={`บุคลากร ${100 - teacherPercent}%`} />
            </div>
          </div>
        </div>

        {/* ==========================================
            Card 3: นักเรียน / นักศึกษา (Students)
           ========================================== */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_-8px_rgba(37,99,235,0.2)] border border-slate-200/90 hover:border-blue-400/40 transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                นักเรียน / นักศึกษา
              </span>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100/80 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
                <GraduationCap className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {students.total.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                คน
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-blue-50/70 px-2.5 py-1 rounded-xl border border-blue-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span className="text-slate-600 text-[11px] truncate">ชาย: <strong className="text-blue-700">{students.male.toLocaleString()}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-pink-50/70 px-2.5 py-1 rounded-xl border border-pink-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                <span className="text-slate-600 text-[11px] truncate">หญิง: <strong className="text-pink-700">{students.female.toLocaleString()}</strong></span>
              </div>
            </div>

            {/* Subtle ratio bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
              <div style={{ width: `${malePercent}%` }} className="bg-blue-500 h-full" title={`นักเรียนชาย ${malePercent}%`} />
              <div style={{ width: `${100 - malePercent}%` }} className="bg-pink-400 h-full" title={`นักเรียนหญิง ${100 - malePercent}%`} />
            </div>
          </div>
        </div>

        {/* ==========================================
            Card 4: สถานศึกษาในสังกัด (Institutions)
           ========================================== */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_-8px_rgba(16,185,129,0.2)] border border-slate-200/90 hover:border-emerald-400/40 transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                สถานศึกษาในสังกัด
              </span>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
                <School className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {institutions.total}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                แห่ง
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-[#932d16]/5 px-2.5 py-1 rounded-xl border border-[#932d16]/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#932d16] shrink-0" />
                <span className="text-slate-600 text-[11px] truncate">รัฐบาล: <strong className="text-[#932d16]">{institutions.public}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50/70 px-2.5 py-1 rounded-xl border border-amber-100/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-600 text-[11px] truncate">เอกชน: <strong className="text-amber-700">{institutions.private}</strong></span>
              </div>
            </div>

            {/* Subtle ratio bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
              <div style={{ width: `${publicInstPercent}%` }} className="bg-[#932d16] h-full" title={`รัฐบาล ${publicInstPercent}%`} />
              <div style={{ width: `${100 - publicInstPercent}%` }} className="bg-amber-400 h-full" title={`เอกชน ${100 - publicInstPercent}%`} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
