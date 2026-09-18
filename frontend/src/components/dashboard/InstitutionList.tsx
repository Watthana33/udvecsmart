import React, { useState, useMemo } from 'react';
import { Institution, InstitutionType, UserProfile } from '../../types';
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
  Camera,
  Edit2,
  X,
  Upload,
  Save,
  Loader2,
} from 'lucide-react';
import { updateInstitutionDirector } from '../../services/api';

interface InstitutionListProps {
  institutions: Institution[];
  loading: boolean;
  selectedInstitutionId: string;
  onSelectInstitution: (id: string) => void;
  currentUser?: UserProfile | null;
  onRefreshInstitutions?: () => void;
}

export const InstitutionList: React.FC<InstitutionListProps> = ({
  institutions,
  loading,
  selectedInstitutionId,
  onSelectInstitution,
  currentUser,
  onRefreshInstitutions,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | InstitutionType>('ALL');

  // State สำหรับ Modal แก้ไขข้อมูล/ภาพถ่ายผู้บริหาร
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [directorName, setDirectorName] = useState('');
  const [directorPosition, setDirectorPosition] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string; type: 'success' | 'error' } | null>(null);

  // State สำหรับดูภาพถ่ายผู้บริหารขนาดใหญ่ (Hover บนคอม / คลิกบนมือถือ)
  const [enlargedDirector, setEnlargedDirector] = useState<{
    name: string;
    position: string;
    instName: string;
    photoUrl: string;
  } | null>(null);


  const openEditModal = (inst: Institution) => {
    setEditingInst(inst);
    const p = inst.personnels?.[0];
    setDirectorName(p?.name || '');
    setDirectorPosition(p?.position || 'ผู้อำนวยการวิทยาลัย');
    setPhotoUrl(p?.photoUrl || '');
    setPhone(inst.phone || '');
    setWebsite(inst.website || '');
  };

  const closeEditModal = () => {
    setEditingInst(null);
  };

  // บีบอัดและย่อขนาดภาพด้วย Canvas ก่อนแปลงเป็น Data URL
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDirector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst) return;

    try {
      setIsSaving(true);
      await updateInstitutionDirector(editingInst.id, {
        directorName,
        position: directorPosition,
        photoUrl,
        phone,
        website,
      });

      setToastMsg({
        title: 'บันทึกสำเร็จ!',
        desc: `อัปเดตข้อมูลและภาพถ่ายผู้บริหาร ${editingInst.name} เรียบร้อยแล้ว`,
        type: 'success',
      });
      setTimeout(() => setToastMsg(null), 4500);
      closeEditModal();
      if (onRefreshInstitutions) {
        onRefreshInstitutions();
      }
    } catch (err: any) {
      console.error('Failed to update director:', err);
      setToastMsg({
        title: 'บันทึกไม่สำเร็จ',
        desc: err?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้บริหาร',
        type: 'error',
      });
      setTimeout(() => setToastMsg(null), 4500);
    } finally {
      setIsSaving(false);
    }
  };

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
            const directorPersonnel = inst.personnels?.[0];
            const director = directorPersonnel?.name || 'ผู้อำนวยการวิทยาลัย';
            const directorPhoto = directorPersonnel?.photoUrl;
            const isSelected = selectedInstitutionId === inst.id;

            const canEdit =
              currentUser?.role === 'SUPER_ADMIN' ||
              (currentUser?.role === 'SCHOOL_ADMIN' && currentUser?.institution?.id === inst.id);

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
                              photoUrl: directorPhoto,
                            });
                          }
                        }}
                        className={`w-16 h-20 sm:w-18 sm:h-22 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center transition-all duration-300 ${
                          directorPhoto ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-[#932d16]/30' : ''
                        }`}
                        title={directorPhoto ? "คลิก/แตะ เพื่อดูภาพขนาดใหญ่" : undefined}
                      >
                        {directorPhoto ? (
                          <img
                            src={directorPhoto}
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
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#932d16] text-white flex items-center justify-center text-[10px] shadow border border-white z-10 pointer-events-none">
                        <UserCheck className="w-3 h-3" />
                      </span>
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(inst);
                          }}
                          title="อัปโหลด/เปลี่ยนภาพผู้บริหาร"
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-md border border-white transition-all transform hover:scale-110 z-20 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                      )}

                      {/* Desktop Hover Floating Zoom Card (เด้งภาพขนาดใหญ่เมื่อเอาเมาส์ไปวาง) */}
                      {directorPhoto && (
                        <div className="hidden lg:block absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 pointer-events-none group-hover/director:opacity-100 group-hover/director:pointer-events-auto transition-all duration-200 z-30 w-48 p-2.5 bg-white rounded-2xl shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
                          <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner mb-2">
                            <img
                              src={directorPhoto}
                              alt={director}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div className="text-xs font-extrabold text-slate-900 leading-tight truncate" title={director}>
                            {director}
                          </div>
                          <div className="text-[10px] text-[#932d16] font-bold mt-0.5 truncate">
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#932d16] block">
                          ผู้บริหารสถานศึกษา
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(inst)}
                            className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>แก้ไข</span>
                          </button>
                        )}
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

                      <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-lg text-xs font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>เปิดสอน <strong className="text-[#932d16] font-bold">{inst.programsCount || 12}</strong> สาขาวิชา</span>
                      </div>
                    </div>
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

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm ${
              toastMsg.type === 'success'
                ? 'bg-emerald-800 text-white border-emerald-700'
                : 'bg-rose-800 text-white border-rose-700'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">{toastMsg.title}</p>
              <p className="text-xs opacity-90">{toastMsg.desc}</p>
            </div>
            <button onClick={() => setToastMsg(null)} className="ml-2 opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal: อัปโหลด/แก้ไขภาพถ่ายและข้อมูลผู้บริหาร */}
      {editingInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative">
            <button
              onClick={closeEditModal}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold">
                <Camera className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">แก้ไขภาพถ่ายและข้อมูลผู้บริหาร</h3>
                <p className="text-xs text-slate-500 font-medium">{editingInst.name}</p>
              </div>
            </div>

            <form onSubmit={handleSaveDirector} className="space-y-4">
              {/* Photo Upload & Preview Frame */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="w-24 h-32 rounded-2xl overflow-hidden bg-white border-2 border-amber-500/30 shadow-md flex items-center justify-center shrink-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt="ตัวอย่างภาพผู้บริหาร" className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                      <User className="w-8 h-8 mb-1 opacity-50" />
                      <span className="text-[10px] leading-tight">ยังไม่มีภาพผู้บริหาร</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full text-left">
                  <label className="text-xs font-bold text-slate-700 block">อัปโหลดภาพผู้บริหารใหม่</label>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>เลือกไฟล์รูปภาพจากเครื่อง</span>
                    <input type="file" accept="image/*" onChange={handlePhotoFileChange} className="hidden" />
                  </label>
                  <div className="pt-1">
                    <span className="text-[11px] text-slate-400 block mb-1">หรือวางลิงก์รูปภาพ (Image URL):</span>
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={photoUrl.startsWith('data:') ? '' : photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Name and Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ชื่อ - นามสกุล ผู้บริหาร</label>
                  <input
                    type="text"
                    required
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    placeholder="เช่น นายสมหมาย มงคลชัย"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={directorPosition}
                    onChange={(e) => setDirectorPosition(e.target.value)}
                    placeholder="ผู้อำนวยการวิทยาลัย"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Phone & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 042-221538"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">เว็บไซต์วิทยาลัย</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold bg-[#932d16] hover:bg-[#7a2411] text-white rounded-xl shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลผู้บริหาร'}</span>
                </button>
              </div>
            </form>
          </div>
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
              <span className="text-[11px] font-bold text-[#932d16] bg-[#932d16]/10 px-3 py-1 rounded-full border border-[#932d16]/20">
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
              <p className="text-xs font-bold text-[#932d16]">
                {enlargedDirector.position}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
