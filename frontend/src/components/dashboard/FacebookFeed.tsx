import React, { useEffect, useRef, useState } from 'react';
import { Facebook, ExternalLink } from 'lucide-react';

interface FacebookFeedProps {
  /** ลิงก์เพจ Facebook (จากข้อมูลติดต่อ) — ถ้าไม่ใช่ลิงก์ facebook.com จะไม่แสดงส่วนนี้ */
  pageUrl: string;
}

const MIN_W = 280;
const MAX_W = 500; // ขนาดสูงสุดที่ Facebook Page Plugin รองรับ
const HEIGHT = 640;

/** คืนลิงก์ https ของ facebook.com ที่ปลอดภัยสำหรับฝัง หรือ null */
export function facebookPageHref(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    const host = u.hostname.toLowerCase();
    const ok = host === 'facebook.com' || host === 'www.facebook.com' || host === 'm.facebook.com' || host === 'web.facebook.com';
    if (u.protocol !== 'https:' || !ok) return null;
    return `https://www.facebook.com${u.pathname}${u.search}`;
  } catch {
    return null;
  }
}

/** หน้าแรก: กล่องโพสต์ล่าสุดจาก Facebook Page (Page Plugin แบบ iframe ไม่ต้องใช้ token) */
export const FacebookFeed: React.FC<FacebookFeedProps> = ({ pageUrl }) => {
  const href = facebookPageHref(pageUrl);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(MAX_W);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || !href) return;
    const measure = () => setWidth(Math.max(MIN_W, Math.min(MAX_W, Math.floor(el.clientWidth))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [href]);

  if (!href) return null;

  const src =
    'https://www.facebook.com/plugins/page.php?' +
    new URLSearchParams({
      href,
      tabs: 'timeline',
      width: String(width),
      height: String(HEIGHT),
      small_header: 'true',
      hide_cover: 'false',
      show_facepile: 'false',
    }).toString();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="ข่าวสารจาก Facebook">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-hx-932d16/10 text-hx-932d16">
              <Facebook className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">ข่าวสารล่าสุดจาก Facebook</h2>
              <p className="text-xs text-slate-500 mt-0.5">โพสต์ล่าสุดของเพจ อัปเดตอัตโนมัติ</p>
            </div>
          </div>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-hx-932d16 hover:underline"
          >
            <span>เปิดใน Facebook</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div ref={boxRef} className="w-full flex justify-center">
          <div className="relative rounded-2xl overflow-hidden bg-slate-100" style={{ width, height: HEIGHT, maxWidth: '100%' }}>
            {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200/80" />}
            <iframe
              key={width}
              title="โพสต์ล่าสุดจาก Facebook Page"
              src={src}
              width={width}
              height={HEIGHT}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="encrypted-media"
              onLoad={() => setLoaded(true)}
              style={{ border: 'none', overflow: 'hidden', display: 'block' }}
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 text-center">
          หากกล่องว่าง อาจเพราะเบราว์เซอร์เปิดตัวบล็อกการติดตามไว้ ให้กด "เปิดใน Facebook" แทน
        </p>
      </div>
    </section>
  );
};
