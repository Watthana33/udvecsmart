import React, { useState, useEffect } from 'react';

const DEFAULT_BANNER = '/banner.png';

interface BannerSectionProps {
  /** รูปแบนเนอร์ที่แอดมินเลือกใช้ที่หลังบ้าน — ไม่มี/โหลดไม่ได้ = ใช้แบนเนอร์เริ่มต้น */
  src?: string;
}

/** แบนเนอร์หัวเว็บ ขนาดแนะนำ 2129 x 739: แสดงรูปเดียวที่แอดมินเลือก (การเปลี่ยนรูปทำที่หลังบ้านเท่านั้น) */
export const BannerSection: React.FC<BannerSectionProps> = ({ src }) => {
  const [failed, setFailed] = useState(false);

  // เปลี่ยนรูปใหม่ → ลองโหลดอีกครั้ง
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const url = !src || failed ? DEFAULT_BANNER : src;

  return (
    <div className="w-full">
      <div
        className="w-full bg-slate-900 relative shadow-sm border-b-4 border-hx-932d16 overflow-hidden"
        style={{ aspectRatio: '2129 / 739' }}
      >
        <img
          src={url}
          alt="UDVECSmart Banner"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            if (url !== DEFAULT_BANNER) setFailed(true);
            else e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};
