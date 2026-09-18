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
            <div key={i} className="h-40 bg-slate-200/80 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { students, institutions, personnel, executivesCount } = stats;

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: ผู้บริหาร */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md hover:border-[#932d16]/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">ผู้บริหาร</span>
            <div className="w-10 h-10 rounded-xl bg-[#932d16]/10 text-[#932d16] flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {executivesCount.toLocaleString()}{' '}
            <span className="text-xs font-medium text-slate-500">ท่าน</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span>ผู้อำนวยการสถานศึกษา</span>
            <span className="font-semibold text-[#932d16]">{executivesCount} คน</span>
          </p>
        </div>

        {/* Card 2: ครูและบุคลากรทางการศึกษา */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md hover:border-amber-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">ครูและบุคลากร</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {personnel.total.toLocaleString()}{' '}
            <span className="text-xs font-medium text-slate-500">คน</span>
          </div>
          <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-600 flex justify-between">
            <span>ครู: <strong className="text-slate-900">{personnel.teachers.toLocaleString()}</strong></span>
            <span>บุคลากร: <strong className="text-slate-900">{personnel.staff.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Card 3: นักเรียนนักศึกษา */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md hover:border-blue-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">นักเรียน / นักศึกษา</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {students.total.toLocaleString()}{' '}
            <span className="text-xs font-medium text-slate-500">คน</span>
          </div>
          <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-600 flex justify-between">
            <span>ชาย: <strong className="text-blue-600">{students.male.toLocaleString()}</strong></span>
            <span>หญิง: <strong className="text-pink-600">{students.female.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Card 4: สถานศึกษาในสังกัด */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">สถานศึกษาในสังกัด</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {institutions.total}{' '}
            <span className="text-xs font-medium text-slate-500">แห่ง</span>
          </div>
          <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-600 flex justify-between">
            <span>รัฐบาล: <strong className="text-[#932d16]">{institutions.public}</strong></span>
            <span>เอกชน: <strong className="text-amber-600">{institutions.private}</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
};
