import React, { useState, useEffect, useRef } from 'react';
import { Institution } from '../../types';
import {
  Calendar,
  Layers,
  School,
  Filter,
  CheckCircle2,
  Camera,
  Upload,
  RefreshCw,
  X,
  Sparkles,
  Check,
} from 'lucide-react';

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

  // Banner State & Persistence (Default to official /banner.png)
  const [bannerUrl, setBannerUrl] = useState<string>(() => {
    return localStorage.getItem('udpvecsmart_banner_image') || '/banner.png';
  });

  // Modal State for Admin Banner Manager
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(bannerUrl);
  const [imgInfo, setImgInfo] = useState<{ width: number; height: number; ratio: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect image aspect ratio when preview URL changes
  useEffect(() => {
    if (!previewUrl) return;
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const ratio = (w / (h || 1)).toFixed(2);
      setImgInfo({ width: w, height: h, ratio });
    };
    img.src = previewUrl;
  }, [previewUrl]);

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Save new banner
  const handleSaveBanner = () => {
    localStorage.setItem('udpvecsmart_banner_image', previewUrl);
    setBannerUrl(previewUrl);
    setIsModalOpen(false);
  };

  // Reset to default official banner
  const handleResetDefault = () => {
    localStorage.removeItem('udpvecsmart_banner_image');
    setBannerUrl('/banner.png');
    setPreviewUrl('/banner.png');
    setIsModalOpen(false);
  };

  return (
    <div className="w-full">
      {/* 1. Full-width Hero Banner Image (Responsive Auto-Fit: 100% Uncropped) */}
      <div className="w-full bg-slate-900 relative shadow-sm border-b-4 border-[#932d16] group overflow-hidden">
        <img
          src={bannerUrl}
          alt="UDVECSmart Banner"
          className="w-full h-auto block max-w-full transition-all duration-300"
          onError={(e) => {
            // Fallback to default banner if custom URL fails
            if (bannerUrl !== '/banner.png') {
              setBannerUrl('/banner.png');
            } else {
              e.currentTarget.style.display = 'none';
            }
          }}
        />

        {/* Admin Change Banner Quick Button */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-6 opacity-85 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setPreviewUrl(bannerUrl);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-[#932d16] text-white text-xs font-semibold rounded-lg backdrop-blur-md border border-white/20 shadow-lg transition-all active:scale-95 cursor-pointer"
            title="เปลี่ยนภาพแบนเนอร์และทดสอบ Auto-Fit"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>เปลี่ยนแบนเนอร์ (Admin)</span>
          </button>
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

      {/* 3. Modal: จัดการแบนเนอร์ (Admin Banner Manager & Auto-Fit Preview) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 border border-slate-100 my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#932d16]/10 text-[#932d16] rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    จัดการภาพแบนเนอร์ (Responsive Auto-Fit)
                  </h3>
                  <p className="text-xs text-slate-500">
                    ระบบปรับสัดส่วนอัตโนมัติ รองรับทุกขนาดภาพ ไม่ถูกตัดขอบบน-ล่าง
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Feature Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-bold">ฟีเจอร์ปรับขนาดพอดีอัตโนมัติ (Auto Aspect Ratio):</span>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  ไม่ว่าแอดมินจะอัปโหลดภาพขนาดใด (เช่น 16:9, 21:9 หรือแบนเนอร์แบบพาโนรามา) โค้ดจะคำนวณความสูงให้แสดงผลพอดี 100% เสมอโดยไม่มีการ Crop ตัดขอบ และไม่บวมยืด
                </p>
              </div>
            </div>

            {/* Upload Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. อัปโหลดภาพจากเครื่องคอมพิวเตอร์ (PNG, JPG, WebP)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-[#932d16] hover:bg-[#932d16]/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-[#932d16] transition-all cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-semibold">
                    คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่อง
                  </span>
                  <span className="text-[11px] text-slate-400">
                    รองรับไฟล์ภาพความละเอียดสูง
                  </span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. หรือระบุ URL รูปภาพโดยตรง
                </label>
                <input
                  type="text"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  placeholder="https://example.com/banner.png หรือ /banner.png"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] text-slate-800"
                />
              </div>
            </div>

            {/* Live Auto-fit Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>ตัวอย่างการแสดงผลแบบ Auto-Fit:</span>
                {imgInfo && (
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    ขนาดจริง: {imgInfo.width} × {imgInfo.height} px (สัดส่วน {imgInfo.ratio}:1)
                  </span>
                )}
              </div>

              <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner">
                <img
                  src={previewUrl}
                  alt="Banner Preview"
                  className="w-full h-auto block"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetDefault}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-[#932d16] hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>คืนค่าแบนเนอร์ทางการ</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveBanner}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-[#932d16] hover:bg-[#782310] rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกและใช้งาน</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
