import React, { useState, useMemo } from 'react';
import { Institution, InstitutionType } from '../../types';
import { imageVariant } from '../../utils/imageUrl';
import { PROGRAM_LEVELS, parsePrograms } from '../../utils/programs';
import {
  Search,
  Phone,
  MapPin,
  ExternalLink,
  School,
  UserCheck,
  CheckCircle2,
  User,
  BookOpen,
  X,
} from 'lucide-react';

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

  // State สำหรับดูภาพถ่ายผู้บริหารขนาดใหญ่ (Hover บนคอม / คลิกบนมือถือ)
  const [enlargedDirector, setEnlargedDirector] = useState<{
    name: string;
    position: string;
    instName: string;
    photoUrl: string;
  } | null>(null);

  // State สำหรับเปิด Popover รายชื่อสาขาบนมือถือ (หรือคลิก)
  const [activeProgramsPopoverId, setActiveProgramsPopoverId] = useState<string | null>(null);

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
          {/* <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-hx-932d16 bg-hx-932d16/10 px-3.5 py-1 rounded-full mb-2">
            <School className="w-3.5 h-3.5" />
            <span>Institution Directory</span>
          </div> */}
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
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-hx-932d16/20 focus:border-hx-932d16 transition-all shadow-sm"
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
                  ? 'bg-hx-932d16 text-white shadow-sm font-bold'
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
            const directorPersonnel = inst.personnels?.[0];
            const director = directorPersonnel?.name || 'ผู้อำนวยการวิทยาลัย';
            const directorPhoto = directorPersonnel?.photoUrl;
            const isSelected = selectedInstitutionId === inst.id;

            return (
              <div
                key={inst.id}
                className={`bg-white rounded-3xl p-6 shadow-sm border transition-all duration-200 flex flex-col justify-between hover:shadow-lg ${
                  isSelected
                    ? 'border-2 border-hx-932d16 ring-4 ring-hx-932d16/10'
                    : 'border-slate-200 hover:border-hx-932d16/40'
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
                          ? 'bg-hx-932d16/10 text-hx-932d16 border border-hx-932d16/20'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {inst.type === 'PUBLIC' ? 'สถานศึกษาภาครัฐ' : 'สถานศึกษาภาคเอกชน'}
                    </span>
                  </div>

                  {/* Institution Name */}
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug mb-3 hover:text-hx-932d16 transition-colors">
                    {inst.name}
                  </h3>

                  {/* Director Profile Section with Photo Frame (พื้นที่สำหรับใส่ภาพผู้บริหาร) */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 p-3 rounded-2xl border border-slate-200/80 mb-3 flex items-center gap-3">
                    {/* Portrait Photo Frame with Auto-Scale & Hover Zoom */}
                    <div className="relative shrink-0 group/director">
                      <div 
                        onClick={() => {
                          if (directorPhoto) {
                            setEnlargedDirector({
                              name: director,
                              position: directorPersonnel?.position || `ผู้อำนวยการ${inst.name.replace('วิทยาลัย', 'ว.')}`,
                              instName: inst.name,
                              // ภาพใหญ่ = ไฟล์ต้นฉบับ (คลิกขวาบันทึกรูปได้)
                              photoUrl: imageVariant(directorPhoto, 'original'),
                            });
                          }
                        }}
                        className={`w-16 h-20 sm:w-18 sm:h-22 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center transition-all duration-300 ${
                          directorPhoto ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-hx-932d16/30' : ''
                        }`}
                        title={directorPhoto ? "คลิก/แตะ เพื่อดูภาพขนาดใหญ่" : undefined}
                      >
                        {directorPhoto ? (
                          <img
                            src={imageVariant(directorPhoto, 'thumb')}
                            alt={director}
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/director:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-1 text-center">
                            <User className="w-6 h-6 text-slate-400" />
                            <span className="text-[8px] text-slate-400 font-medium mt-1 leading-tight">
                              ภาพผู้บริหาร
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-hx-932d16 text-white flex items-center justify-center text-[10px] shadow border border-white z-10 pointer-events-none">
                        <UserCheck className="w-3 h-3" />
                      </span>

                      {/* Desktop Hover Floating Zoom Card (เด้งภาพขนาดใหญ่เมื่อเอาเมาส์ไปวาง) */}
                      {directorPhoto && (
                        <div className="hidden lg:block absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/director:opacity-100 group-hover/director:pointer-events-auto transition-all duration-200 z-30 w-48 p-2.5 bg-white rounded-2xl shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
                          <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner mb-2">
                            <img
                              src={imageVariant(directorPhoto, 'thumb')}
                              alt={director}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="text-xs font-extrabold text-slate-900 leading-tight truncate" title={director}>
                            {director}
                          </div>
                          <div className="text-[10px] text-hx-932d16 font-bold mt-0.5 truncate">
                            {directorPersonnel?.position || 'ผู้อำนวยการวิทยาลัย'}
                          </div>
                          <span className="inline-block text-[9px] text-slate-400 mt-1 bg-slate-100 px-2 py-0.5 rounded-full">
                            คลิกเพื่อดูภาพขนาดเต็ม
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Director Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-hx-932d16 block">
                          ผู้บริหารสถานศึกษา
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug truncate mt-0.5" title={director}>
                        {director}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {directorPersonnel?.position || `ผู้อำนวยการ${inst.name.replace('วิทยาลัย', 'ว.')}`}
                      </p>
                    </div>
                  </div>

                  {/* Contact Details (Address & Phone) */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-5 bg-white p-3 rounded-2xl border border-slate-100">
                    {/* Address */}
                    {inst.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-[11px] text-slate-500">{inst.address}</span>
                      </div>
                    )}

                    {/* Phone & Programs Count in the same row */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                      {inst.phone ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold">{inst.phone}</span>
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Programs Badge with Interactive Hover Popover */}
                      {(() => {
                        const instPrograms = parsePrograms(inst.programsList);
                        const programsTotal = instPrograms.length > 0 ? instPrograms.length : inst.programsCount ?? 0;
                        const programsBadge = programsTotal > 0
                          ? <span>เปิดสอน <strong className="text-hx-932d16 font-bold">{programsTotal}</strong> สาขาวิชา</span>
                          : <span>สาขาวิชาที่เปิดสอน</span>;
                        const isPopoverOpen = activeProgramsPopoverId === inst.id;
                        return (
                          <div
                            className="relative group/programs"
                            onMouseLeave={() => {
                              if (activeProgramsPopoverId === inst.id) setActiveProgramsPopoverId(null);
                            }}
                          >
                            {inst.programsUrl ? (
                              <a
                                href={inst.programsUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                  // On touch screens, first tap toggles popover
                                  if (window.innerWidth < 768 && !isPopoverOpen) {
                                    e.preventDefault();
                                    setActiveProgramsPopoverId(inst.id);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 hover:border-amber-300 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer group-hover/programs:ring-2 group-hover/programs:ring-amber-400/40"
                                title="คลิกเพื่อดูหลักสูตร หรือวางเม้าส์เพื่อดูรายชื่อสาขาวิชา"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                {programsBadge}
                                <ExternalLink className="w-3 h-3 text-amber-600 opacity-60 group-hover/programs:opacity-100 shrink-0" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveProgramsPopoverId(isPopoverOpen ? null : inst.id)}
                                className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer group-hover/programs:ring-2 group-hover/programs:ring-amber-400/40"
                                title="ชี้หรือแตะเพื่อดูรายชื่อสาขาวิชา"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                {programsBadge}
                              </button>
                            )}

                            {/* Floating Hover & Tap Popover */}
                            <div
                              className={`transition-all duration-200 absolute right-0 bottom-full mb-2 w-72 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-300/80 p-3.5 z-40 text-left pointer-events-auto ${
                                isPopoverOpen
                                  ? 'visible opacity-100 scale-100'
                                  : 'invisible opacity-0 scale-95 group-hover/programs:visible group-hover/programs:opacity-100 group-hover/programs:scale-100'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-amber-100">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                                  <span>สาขาวิชาที่เปิดสอน{programsTotal > 0 ? ` (${programsTotal} สาขา)` : ''}</span>
                                </div>
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                                  {inst.name.replace('วิทยาลัย', 'ว.')}
                                </span>
                              </div>

                              {/* List of Programs */}
                              {instPrograms.length > 0 ? (
                                <div className="max-h-56 overflow-y-auto pr-1 space-y-2.5 text-xs">
                                  {PROGRAM_LEVELS.map((level) => {
                                    const levelPrograms = instPrograms.filter((p) => p.level === level.key);
                                    if (levelPrograms.length === 0) return null;
                                    return (
                                      <div key={level.key}>
                                        <div className="text-[10px] font-black text-hx-932d16 mb-1">
                                          {level.label} <span className="font-semibold text-slate-400">({levelPrograms.length} สาขา)</span>
                                        </div>
                                        <div className="space-y-1">
                                          {levelPrograms.map((prog, idx) => (
                                            <div key={idx} className="flex items-start gap-2 py-0.5 text-slate-700">
                                              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 rounded px-1.5 py-0.5 shrink-0 min-w-[20px] text-center mt-0.5">
                                                {idx + 1}
                                              </span>
                                              <span className="font-semibold text-slate-800 leading-snug">{prog.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="py-3 text-center text-xs text-slate-400">
                                  ยังไม่ได้บันทึกรายชื่อสาขาวิชาแบบละเอียด
                                </div>
                              )}

                              {/* Link to programsUrl */}
                              {inst.programsUrl && (
                                <a
                                  href={inst.programsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-hx-932d16 hover:bg-hx-7a2411 text-white text-[11px] font-bold rounded-xl shadow transition-colors"
                                >
                                  <span>ดูหลักสูตรและสาขาวิชาทั้งหมด</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons: Website Link + Select to view in Dashboard */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectInstitution(inst.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-hx-932d16 text-white shadow'
                        : 'bg-slate-100 hover:bg-hx-932d16/10 text-slate-700 hover:text-hx-932d16'
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
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-hx-932d16 hover:underline px-2.5 py-1.5 rounded-lg hover:bg-hx-932d16/5 transition-colors"
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

      {/* Modal: Full-scale Director Photo Lightbox (แตะบนมือถือเพื่อเด้งภาพใหญ่ หรือคลิกบนคอม) */}
      {enlargedDirector && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setEnlargedDirector(null)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full border border-white/20 p-5 flex flex-col items-center relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setEnlargedDirector(null)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors cursor-pointer shadow-sm"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Institution Badge */}
            <div className="text-center pt-1 px-6">
              <span className="text-[11px] font-bold text-hx-932d16 bg-hx-932d16/10 px-3 py-1 rounded-full border border-hx-932d16/20">
                {enlargedDirector.instName}
              </span>
            </div>

            {/* Full Auto-Scale Director Photo */}
            <div className="w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
              <img
                src={enlargedDirector.photoUrl}
                alt={enlargedDirector.name}
                className="w-full h-full object-contain sm:object-cover object-top"
              />
            </div>

            {/* Director Info */}
            <div className="text-center space-y-1 pb-1">
              <h4 className="text-base font-black text-slate-900 leading-snug">
                {enlargedDirector.name}
              </h4>
              <p className="text-xs font-bold text-hx-932d16">
                {enlargedDirector.position}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
