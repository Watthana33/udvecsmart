import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Megaphone } from 'lucide-react';
import { WelcomeMode } from '../../types';

export const DEFAULT_WELCOME_BADGE = 'ประกาศ / ข่าวสารถึงผู้เข้าชม';

/** ข้อความป้ายที่จะแสดง: ปิดป้าย หรือเว้นข้อความว่าง = ไม่แสดง; ยังไม่เคยตั้งค่า = ใช้ข้อความเริ่มต้น */
export function resolveWelcomeBadge(enabled?: boolean, text?: string | number): string {
  if (enabled === false) return '';
  if (text === undefined) return DEFAULT_WELCOME_BADGE;
  return String(text).trim();
}

interface WelcomeGateProps {
  mode: WelcomeMode;
  badge?: string;
  title: string;
  content: string;
  image?: string;
  buttonText: string;
  onEnter: () => void;
}

/**
 * หน้าข่าวสารก่อนเข้าเว็บไซต์ (วาดที่ระดับ <body> ผ่าน portal เพื่อไม่ให้ถูกกรอบที่มี transform ของหน้าแอดมินทำให้ตำแหน่ง fixed เพี้ยน)
 * - fullpage: เต็มหน้าจอเหมือนเป็นหน้า HTML หน้าเดียว ไม่มีกรอบการ์ด มีปุ่มเข้าสู่เว็บไซต์
 * - modal: การ์ดใหญ่บังหน้าจอ (เห็นเว็บเบลอด้านหลัง) พร้อมปุ่มเข้าสู่เว็บไซต์
 */
export const WelcomeGate: React.FC<WelcomeGateProps> = ({ mode, badge, title, content, image, buttonText, onEnter }) => {
  // ล็อกการเลื่อนของหน้าเว็บด้านหลังระหว่างที่หน้านี้เปิดอยู่
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEnter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEnter]);

  const isFull = mode === 'fullpage';

  const content_ = (
    <div className={`text-center ${isFull ? 'space-y-7 sm:space-y-9' : 'space-y-6'}`}>
      {badge && (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hx-932d16/10 text-hx-932d16 text-xs sm:text-sm font-bold tracking-wide">
          <Megaphone className="w-4 h-4" />
          <span>{badge}</span>
        </div>
      )}

      {image && (
        <img
          src={image}
          alt={title || 'ข่าวสาร'}
          className={`mx-auto w-auto max-w-full object-contain ${
            isFull ? 'max-h-[52vh] rounded-xl' : 'max-h-[42vh] rounded-2xl'
          }`}
        />
      )}

      {title && (
        <h1
          className={`font-black text-slate-900 leading-[1.1] tracking-[-0.03em] ${
            isFull ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl'
          }`}
        >
          {title}
        </h1>
      )}

      {content && (
        <p
          className={`text-slate-600 leading-[1.7] whitespace-pre-line text-left sm:text-center mx-auto ${
            isFull ? 'text-base sm:text-lg max-w-3xl' : 'text-sm sm:text-base max-w-2xl'
          }`}
        >
          {content}
        </p>
      )}

      <button
        type="button"
        onClick={onEnter}
        autoFocus
        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-hx-932d16 hover:bg-hx-7a2411 text-white font-bold text-base shadow-[0_10px_24px_-10px_rgba(147,45,22,0.7)] transition-[background-color,transform] duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-hx-932d16/30"
      >
        <span>{buttonText}</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );

  if (isFull) {
    // เต็มหน้าจริง: พื้นหลังเต็มจอ เนื้อหาอยู่กลางหน้าเลย ไม่มีการ์ด/ขอบ/เงา
    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'ข่าวสารก่อนเข้าเว็บไซต์'}
        className="welcome-backdrop fixed inset-0 z-[100] overflow-y-auto bg-white"
      >
        <div className="min-h-full flex items-center justify-center px-5 py-10 sm:px-10 sm:py-14">
          <div className="welcome-card w-full max-w-4xl">{content_}</div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'ข่าวสารก่อนเข้าเว็บไซต์'}
      className="welcome-backdrop fixed inset-0 z-[100] overflow-y-auto bg-slate-900/65 backdrop-blur-sm"
    >
      <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
        <div className="welcome-card w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-[0_24px_60px_-20px_rgba(15,23,42,0.45)] overflow-hidden border border-slate-200">
          <div className="h-2 bg-gradient-to-r from-hx-932d16 via-hx-b2391e to-hx-f59e0b" />
          <div className="p-6 sm:p-10">{content_}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};
