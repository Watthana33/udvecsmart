import React from 'react';
import { UserProfile } from '../../types';
import { ShieldCheck, Building2, ChevronUp } from 'lucide-react';

interface FloatingPortalButtonProps {
  user: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const FloatingPortalButton: React.FC<FloatingPortalButtonProps> = ({
  user,
  activeTab,
  setActiveTab,
}) => {
  if (!user) return null;

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isInPortal = activeTab === 'portal';

  const handleClick = () => {
    if (!isInPortal) {
      setActiveTab('portal');
      setTimeout(() => {
        const formEl = document.getElementById('college-edit-form') || document.getElementById('main-tab-content');
        if (formEl) {
          const yOffset = -90;
          const y = formEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }, 80);
    } else {
      // If already in portal, smooth scroll to the form box
      const formEl = document.getElementById('college-edit-form') || document.getElementById('main-tab-content');
      if (formEl) {
        const yOffset = -90;
        const y = formEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="fixed right-3 sm:right-5 bottom-4 sm:bottom-6 z-40 flex flex-col items-end gap-1.5 pointer-events-auto max-w-[calc(100vw-1.5rem)] select-none">
      <button
        type="button"
        onClick={handleClick}
        className={`group flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl sm:rounded-full text-slate-950 font-bold shadow-xl hover:shadow-2xl active:scale-95 transition-all cursor-pointer border border-amber-300/90 backdrop-blur-md ${
          isInPortal
            ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/30 ring-2 ring-amber-400/60'
            : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-105 shadow-amber-500/25 hover:ring-2 hover:ring-amber-400/50'
        }`}
        title={
          isSuperAdmin
            ? 'คลิกเพื่อเปิดศูนย์ควบคุม สอจ. (แอดมิน)'
            : 'คลิกเพื่อเข้าสู่ระบบบันทึกข้อมูลวิทยาลัย'
        }
      >
        {/* User Initial Avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xs sm:text-sm shadow-inner shrink-0 ring-2 ring-amber-200/50">
          {user.fullName ? user.fullName.charAt(0) : 'A'}
        </div>

        {/* User Details & Institution */}
        <div className="flex flex-col text-left min-w-0 pr-1">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="text-xs sm:text-sm font-black text-slate-950 truncate max-w-[130px] sm:max-w-[180px]">
              {user.fullName}
            </span>
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded-full font-black shrink-0 leading-none shadow-2xs">
                <ShieldCheck className="w-2.5 h-2.5" /> สอจ.
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[9px] bg-slate-950 text-emerald-300 px-1.5 py-0.5 rounded-full font-black shrink-0 leading-none shadow-2xs">
                <Building2 className="w-2.5 h-2.5" /> วิทยาลัย
              </span>
            )}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-800 font-bold truncate max-w-[150px] sm:max-w-[220px] leading-tight mt-0.5">
            {user.institution?.name || (isSuperAdmin ? 'ศูนย์ควบคุม สอจ.อุดรธานี' : user.email)}
          </div>
        </div>

        {/* Portal Status Indicator / Chevron */}
        <div className="pl-1 border-l border-slate-950/15 flex items-center shrink-0">
          <span className="p-1 bg-slate-950/10 rounded-full text-slate-900 group-hover:bg-slate-950/20 transition-all">
            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${isInPortal ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>
    </div>
  );
};
