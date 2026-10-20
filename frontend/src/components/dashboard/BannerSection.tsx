import React, { useState, useEffect } from 'react';

const DEFAULT_BANNER = '/banner.png';

interface BannerSectionProps {
  /** รูปแบนเนอร์จากเซิร์ฟเวอร์ (แอดมินตั้งที่หลังบ้าน) — ไม่มี/โหลดไม่ได้ = ใช้แบนเนอร์เริ่มต้น */
  src?: string;
}

/** แบนเนอร์หัวเว็บ: แสดงผลอย่างเดียว (การเปลี่ยนรูปทำที่หลังบ้านเท่านั้น) */
export const BannerSection: React.FC<BannerSectionProps> = ({ src }) => {
  const [failed, setFailed] = useState(false);

  // เปลี่ยนรูปใหม่ → ลองโหลดอีกครั้ง
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const url = !src || failed ? DEFAULT_BANNER : src;

  return (
    <div className="w-full">
      {/* Full-width Hero Banner Image (Responsive Auto-Fit: 100% Uncropped) */}
      <div className="w-full bg-slate-900 relative shadow-sm border-b-4 border-hx-932d16 overflow-hidden">
        <img
          src={url}
          alt="UDVECSmart Banner"
          className="w-full h-auto block max-w-full"
          onError={(e) => {
            if (url !== DEFAULT_BANNER) {
              setFailed(true);
            } else {
              e.currentTarget.style.display = 'none';
            }
          }}
        />
      </div>
    </div>
  );
};
