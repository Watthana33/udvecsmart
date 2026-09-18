import React from 'react';
import { Institution } from '../../types';
import { Calendar, Layers, School, Filter, CheckCircle2, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  institutions: Institution[];
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  selectedSemester: number;
  setSelectedSemester: (s: number) => void;
  selectedInstitutionId: string;
  setSelectedInstitutionId: (id: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  institutions,
  selectedYear,
  setSelectedYear,
  selectedSemester,
  setSelectedSemester,
  selectedInstitutionId,
  setSelectedInstitutionId,
}) => {
  const publicColleges = institutions.filter((i) => i.type === 'PUBLIC');
  const privateColleges = institutions.filter((i) => i.type === 'PRIVATE');
  const selectedInst = institutions.find((i) => i.id === selectedInstitutionId);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left: Filter Title & Active Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 bg-[#932d16]/10 text-[#932d16] rounded-xl">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#932d16]">
                ตัวกรองสถิติและข้อมูล
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                Filter Control
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[280px] sm:max-w-xs font-medium text-slate-700">
                {selectedInst ? selectedInst.name : 'แสดงสถิติรวมทั้งจังหวัด (29 แห่ง)'}
              </span>
            </p>
          </div>
        </div>

        {/* Middle: Horizontal 3 Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 flex-1 lg:max-w-4xl items-center">
          
          {/* 1. Academic Year */}
          <div className="sm:col-span-3 relative">
            <Calendar className="w-3.5 h-3.5 text-[#932d16] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all cursor-pointer"
              title="เลือกปีการศึกษา"
            >
              <option value={2570}>ปีการศึกษา 2570</option>
              <option value={2569}>ปีการศึกษา 2569</option>
              <option value={2568}>ปีการศึกษา 2568 (ปัจจุบัน)</option>
              <option value={2567}>ปีการศึกษา 2567</option>
            </select>
          </div>

          {/* 2. Semester */}
          <div className="sm:col-span-3 relative">
            <Layers className="w-3.5 h-3.5 text-[#932d16] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all cursor-pointer"
              title="เลือกภาคเรียน"
            >
              <option value={1}>ภาคเรียนที่ 1</option>
              <option value={2}>ภาคเรียนที่ 2</option>
            </select>
          </div>

          {/* 3. Institution Selector (Wider) */}
          <div className="sm:col-span-6 relative">
            <School className="w-3.5 h-3.5 text-[#932d16] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedInstitutionId}
              onChange={(e) => setSelectedInstitutionId(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all cursor-pointer truncate"
              title="เลือกสถานศึกษา"
            >
              <option value="ALL">🏛️ แสดงทุกสถานศึกษาในจังหวัด (29 แห่ง)</option>
              <optgroup label="── ภาครัฐบาล (10 แห่ง) ──">
                {publicColleges.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name} ({col.code})
                  </option>
                ))}
              </optgroup>
              <optgroup label="── ภาคเอกชน (19 แห่ง) ──">
                {privateColleges.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name} ({col.code})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

        </div>

        {/* Right: Reset Filter Button (Shown when a specific college is selected) */}
        {selectedInstitutionId !== 'ALL' && (
          <button
            onClick={() => setSelectedInstitutionId('ALL')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-[#932d16]/10 text-xs font-semibold text-[#932d16] rounded-xl transition-all shrink-0 cursor-pointer"
            title="ล้างการเลือกวิทยาลัยเพื่อดูภาพรวมทั้งจังหวัด"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ล้างตัวกรอง</span>
          </button>
        )}

      </div>
    </div>
  );
};
