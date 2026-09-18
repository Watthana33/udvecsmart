import React, { useState, useMemo } from 'react';
import { Institution, InstitutionType } from '../../types';
import { Search, Phone, MapPin, ExternalLink, School, UserCheck, CheckCircle2 } from 'lucide-react';

interface InstitutionListProps {
  institutions: Institution[];
  loading: boolean;
  selectedInstitutionId: string;
  onSelectInstitution: (id: string) => void;
}

export const InstitutionList: React.FC<InstitutionListProps> = ({
  institutions,
  loading,
  selectedInstitutionId,
  onSelectInstitution,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | InstitutionType>('ALL');

  const filtered = useMemo(() => {
    return institutions.filter((inst) => {
      const matchSearch =
        inst.name.toLowerCase().includes(search.toLowerCase()) ||
        inst.code.includes(search) ||
        (inst.personnels?.[0]?.name && inst.personnels[0].name.includes(search));
      const matchType = selectedType === 'ALL' || inst.type === selectedType;
      return matchSearch && matchType;
    });
  }, [institutions, search, selectedType]);

  const publicCount = institutions.filter((i) => i.type === 'PUBLIC').length;
  const privateCount = institutions.filter((i) => i.type === 'PRIVATE').length;

  return (
    <section id="institutions" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[#932d16] text-xs font-bold uppercase tracking-wider">
            <School className="w-4 h-4" />
            <span>Institution Directory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            ทำเนียบสถานศึกษาในสังกัด สอจ.อุดรธานี
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            รายชื่อสถานศึกษาอาชีวศึกษาภาครัฐและภาคเอกชน ทั้งหมด {institutions.length} แห่ง พร้อมข้อมูลผู้บริหารและช่องทางติดต่อ
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อวิทยาลัย, รหัส, หรือชื่อ ผอ...."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all shadow-sm"
            />
          </div>

          {/* Type Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-600 shrink-0">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                selectedType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({institutions.length})
            </button>
            <button
              onClick={() => setSelectedType('PUBLIC')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                selectedType === 'PUBLIC'
                  ? 'bg-[#932d16] text-white shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              รัฐบาล ({publicCount})
            </button>
            <button
              onClick={() => setSelectedType('PRIVATE')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                selectedType === 'PRIVATE'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              เอกชน ({privateCount})
            </button>
          </div>
        </div>
      </div>

      {/* 29 Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-200/80 rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
          <School className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">ไม่พบสถานศึกษาที่ตรงกับคำค้นหา</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกแท็บแสดงทั้งหมด</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((inst) => {
            const director = inst.personnels?.[0]?.name || 'ผู้อำนวยการวิทยาลัย';
            const isSelected = selectedInstitutionId === inst.id;

            return (
              <div
                key={inst.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition-all duration-200 flex flex-col justify-between hover:shadow-lg ${
                  isSelected
                    ? 'border-2 border-[#932d16] ring-4 ring-[#932d16]/10'
                    : 'border-slate-200 hover:border-[#932d16]/40'
                }`}
              >
                <div>
                  {/* Top: Code & Type Badges */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      {inst.code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-3 py-0.5 rounded-full ${
                        inst.type === 'PUBLIC'
                          ? 'bg-[#932d16]/10 text-[#932d16] border border-[#932d16]/20'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {inst.type === 'PUBLIC' ? 'สถานศึกษาภาครัฐ' : 'สถานศึกษาภาคเอกชน'}
                    </span>
                  </div>

                  {/* Institution Name */}
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug mb-3 hover:text-[#932d16] transition-colors">
                    {inst.name}
                  </h3>

                  {/* Director & Contact Details */}
                  <div className="space-y-2 text-xs text-slate-600 mb-6 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                    {/* Director */}
                    <div className="flex items-start gap-2">
                      <UserCheck className="w-4 h-4 text-[#932d16] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] text-slate-400 block">ผู้บริหารสถานศึกษา:</span>
                        <span className="font-bold text-slate-800">{director}</span>
                      </div>
                    </div>

                    {/* Address */}
                    {inst.address && (
                      <div className="flex items-start gap-2 pt-1 border-t border-slate-200/50">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-[11px] text-slate-500">{inst.address}</span>
                      </div>
                    )}

                    {/* Phone */}
                    {inst.phone && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700">{inst.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons: Website Link + Select to view in Dashboard */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectInstitution(inst.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#932d16] text-white shadow'
                        : 'bg-slate-100 hover:bg-[#932d16]/10 text-slate-700 hover:text-[#932d16]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'กำลังแสดงสถิติ' : 'ดูสถิติวิทยาลัยนี้'}</span>
                  </button>

                  {inst.website ? (
                    <a
                      href={inst.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#932d16] hover:underline px-2.5 py-1.5 rounded-lg hover:bg-[#932d16]/5 transition-colors"
                    >
                      <span>เว็บไซต์วิทยาลัย</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">ไม่มีเว็บไซต์</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
