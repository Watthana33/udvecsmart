import React from 'react';
import { Award } from 'lucide-react';

export const DveCareerHero: React.FC = () => {
  return (
    <div className="pt-4 sm:pt-5 pb-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#932d16] bg-[#932d16]/10 px-3.5 py-1 rounded-full">
              <Award className="w-3.5 h-3.5" />
              <span>นโยบายสำคัญด้านการจัดการศึกษาอาชีวศึกษา</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              การศึกษาระบบทวิภาคี & ห้องเรียนอาชีพ <br />
              <span className="block mt-1 text-[#932d16]">(Reskill / Upskill)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
              ศูนย์กลางข้อมูลการจัดการเรียนการสอนระบบทวิภาคีร่วมกับสถานประกอบการ โครงการห้องเรียนอาชีพร่วมกับโรงเรียนมัธยมศึกษา 
              และการยกระดับสมรรถนะกำลังคนอาชีวศึกษา สำนักงานอาชีวศึกษาจังหวัดอุดรธานี
            </p>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px] font-medium">สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี)</span>
            <span className="text-[11px] font-bold text-[#932d16]">UDVECSmart Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};
