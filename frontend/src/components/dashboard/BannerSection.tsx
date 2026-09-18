import React from 'react';
import { Institution } from '../../types';
import { Calendar, Layers, School, Filter, CheckCircle2 } from 'lucide-react';

interface BannerSectionProps {
  institutions: Institution[];
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  selectedSemester: number;
  setSelectedSemester: (s: number) => void;
  selectedInstitutionId: string;
  setSelectedInstitutionId: (id: string) => void;
}

export const BannerSection: React.FC<BannerSectionProps> = ({
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
    <div className="w-full">
      {/* 1. Full-width Hero Banner Image */}
      <div className="w-full bg-slate-900 overflow-hidden shadow-lg relative border-b-4 border-[#932d16]">
        <img
          src="/banner.png"
          alt="UDVECSmart Banner"
          className="w-full h-48 sm:h-72 md:h-96 lg:h-[420px] object-cover object-center transform hover:scale-[1.01] transition-transform duration-700"
          onError={(e) => {
            // Fallback gradient if banner image not found
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-8 max-w-2xl text-white">
          <span className="inline-block bg-[#932d16] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 shadow">
            สอจ.อุดรธานี
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow-md">
            อาชีวศึกษาจังหวัดอุดรธานี
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/90 drop-shadow line-clamp-1 sm:line-clamp-none">
            ขับเคลื่อนการศึกษา พัฒนาทักษะวิชาชีพ สร้างสรรค์นวัตกรรมสู่อนาคต
          </p>
        </div>
      </div>

      {/* 2. Headline & Interactive Real-time Filter Bar */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200 py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Headline */}
            <div className="lg:col-span-6 space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#932d16] bg-[#932d16]/10 px-3 py-1 rounded-full">
                <School className="w-3.5 h-3.5" />
                <span>ศูนย์กลางข้อมูลสารสนเทศ</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                ศูนย์รวมข้อมูลและสถิติ <br />
                <span className="text-[#932d16]">อาชีวศึกษาจังหวัดอุดรธานี</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                แพลตฟอร์มสารสนเทศอัจฉริยะ ติดตามสถิตินักเรียนนักศึกษา บุคลากรครู 
                และภาวะการมีงานทำของสถานศึกษาภาครัฐและเอกชนในสังกัด สอจ.อุดรธานี (ครบทั้ง 29 แห่ง)
              </p>
            </div>

            {/* Right Interactive Dropdowns Filter Card */}
            <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#932d16]/20 shadow-xl shadow-[#932d16]/5">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Filter className="w-4 h-4 text-[#932d16]" />
                  <span>ตัวกรองสถิติและข้อมูล (Filter Control)</span>
                </div>
                {selectedInstitutionId !== 'ALL' && (
                  <button
                    onClick={() => setSelectedInstitutionId('ALL')}
                    className="text-xs font-semibold text-[#932d16] hover:underline"
                  >
                    ล้างการกรอง (ดูภาพรวม)
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Dropdown 1: Academic Year */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#932d16]" />
                    <span>ปีการศึกษา</span>
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all cursor-pointer"
                  >
                    <option value={2570}>ปีการศึกษา 2570</option>
                    <option value={2569}>ปีการศึกษา 2569</option>
                    <option value={2568}>ปีการศึกษา 2568 (ปัจจุบัน)</option>
                    <option value={2567}>ปีการศึกษา 2567</option>
                  </select>
                </div>

                {/* Dropdown 2: Semester */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#932d16]" />
                    <span>ภาคเรียน</span>
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all cursor-pointer"
                  >
                    <option value={1}>ภาคเรียนที่ 1</option>
                    <option value={2}>ภาคเรียนที่ 2</option>
                  </select>
                </div>

                {/* Dropdown 3: Institution Selector (Full width) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-[#932d16]" />
                    <span>เลือกสถานศึกษา (แสดงสถิติเฉพาะวิทยาลัย)</span>
                  </label>
                  <select
                    value={selectedInstitutionId}
                    onChange={(e) => setSelectedInstitutionId(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all cursor-pointer"
                  >
                    <option value="ALL">🏛️ สถานศึกษาทั้งหมดในจังหวัด (ภาพรวม 29 แห่ง)</option>
                    
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

              {/* Status Alert Badge */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">สถานะการแสดงผล:</span>
                <span className="font-semibold text-[#932d16] flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {selectedInst ? `แสดงข้อมูลเฉพาะ: ${selectedInst.name}` : 'แสดงสถิติรวมทั้งจังหวัดอุดรธานี'}
                  </span>
                </span>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
