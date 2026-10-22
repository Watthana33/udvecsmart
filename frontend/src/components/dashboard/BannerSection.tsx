import React, { useState, useEffect } from 'react';

const DEFAULT_BANNER = '/banner.png';
const SLIDE_MS = 6000;

interface BannerSectionProps {
  /** รูปแบนเนอร์จากเซิร์ฟเวอร์ ที่แอดมินเพิ่มที่หลังบ้าน (ไม่เกิน 4 รูป) แสดงต่อจากรูปเริ่มต้น */
  srcs?: string[];
}

/** แบนเนอร์หัวเว็บ ขนาดแนะนำ 2129 x 739: สลับรูปอัตโนมัติ (การเปลี่ยนรูปทำที่หลังบ้านเท่านั้น) */
export const BannerSection: React.FC<BannerSectionProps> = ({ srcs }) => {
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const key = (srcs || []).join('|');
  useEffect(() => {
    setFailed(new Set());
    setIndex(0);
  }, [key]);

  const ok = (srcs || []).filter((s) => !failed.has(s));
  const slides = [DEFAULT_BANNER, ...ok]; // รูปที่ 1 = รูปเริ่มต้นเสมอ รูปที่ 2-5 = ที่แอดมินเพิ่ม
  const current = index % slides.length;

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => window.clearInterval(t);
  }, [slides.length, paused]);

  return (
    <div className="w-full">
      <div
        className="w-full bg-slate-900 relative shadow-sm border-b-4 border-hx-932d16 overflow-hidden"
        style={{ aspectRatio: '2129 / 739' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((url, i) => (
          <img
            key={url}
            src={url}
            alt={`UDVECSmart Banner ${i + 1}`}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 w-full h-full object-cover motion-safe:transition-opacity motion-safe:duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={i !== current}
            onError={(e) => {
              if (url !== DEFAULT_BANNER) setFailed((prev) => new Set(prev).add(url));
              else e.currentTarget.style.display = 'none';
            }}
          />
        ))}
        {slides.length > 1 && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`แสดงแบนเนอร์รูปที่ ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full motion-safe:transition-[width,background-color] duration-300 ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
