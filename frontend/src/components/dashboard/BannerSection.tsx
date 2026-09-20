import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, RefreshCw, X, Check } from 'lucide-react';

interface BannerSectionProps {
  isAdmin?: boolean;
}

export const BannerSection: React.FC<BannerSectionProps> = ({ isAdmin = false }) => {
  // Banner State & Persistence (Default to official /banner.png)
  const [bannerUrl, setBannerUrl] = useState<string>(() => {
    return localStorage.getItem('udpvecsmart_banner_image') || '/banner.png';
  });

  // Modal State for Admin Banner Manager
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(bannerUrl);
  const [imgInfo, setImgInfo] = useState<{ width: number; height: number; ratio: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for banner update events across components and tabs
  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem('udpvecsmart_banner_image') || '/banner.png';
      setBannerUrl(stored);
    };
    window.addEventListener('udpvecsmart_banner_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('udpvecsmart_banner_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

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
    window.dispatchEvent(new Event('udpvecsmart_banner_updated'));
    setIsModalOpen(false);
  };

  // Reset to default official banner
  const handleResetDefault = () => {
    localStorage.removeItem('udpvecsmart_banner_image');
    setBannerUrl('/banner.png');
    setPreviewUrl('/banner.png');
    window.dispatchEvent(new Event('udpvecsmart_banner_updated'));
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

        {/* Admin Change Banner Quick Button (Only for logged-in Admins) */}
        {isAdmin && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-6 opacity-85 group-hover:opacity-100 transition-opacity">
            <button
              id="navbar-banner-changer-btn"
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
        )}
      </div>

      {/* 2. Modal: จัดการแบนเนอร์ (Admin Banner Manager & Auto-Fit Preview) */}
      {isAdmin && isModalOpen && (
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
              <Check className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
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
