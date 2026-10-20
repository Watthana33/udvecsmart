import React, { useEffect, useRef, useState } from 'react';
import { UserProfile } from '../../types';
import { useSlidingPill } from '../../hooks/useSlidingPill';
import {
  LogIn,
  LogOut,
  BarChart3,
  School,
  Briefcase,
  Mail,
  Cog,
  Settings,
  ChevronDown,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface UserMenuProps {
  user: UserProfile;
  adminLabel: string;
  isPortalActive: boolean;
  onOpenPortal: () => void;
  onLogout: () => void;
}

/**
 * ปุ่มผู้ใช้ที่ล็อกอินอยู่: แสดงอักษรย่อ + ชื่อ (+ หน่วยงาน) กดแล้วเปิดเมนูเข้าหลังบ้าน/ออกจากระบบ
 * (ปิดเมื่อคลิกนอกเมนูหรือกด Esc)
 */
const UserMenu: React.FC<UserMenuProps> = ({ user, adminLabel, isPortalActive, onOpenPortal, onLogout }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const orgName = user.institution?.name || (isSuperAdmin ? 'สอจ.อุดรธานี' : user.email);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`${user.fullName} · ${orgName}`}
        className={`flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full border transition-colors duration-150 cursor-pointer ${
          open || isPortalActive
            ? 'bg-white text-hx-932d16 border-white shadow-md'
            : 'bg-white/10 hover:bg-white/20 text-white border-white/30'
        }`}
      >
        <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 ring-2 ring-white/40">
          {user.fullName ? user.fullName.charAt(0) : 'A'}
        </span>
        <span className="flex flex-col text-left min-w-0 leading-tight">
          <span className="text-xs 2xl:text-sm font-bold truncate max-w-[6.5rem] sm:max-w-[9rem] 2xl:max-w-[12rem]">{user.fullName}</span>
          <span className={`hidden sm:block text-[10px] truncate max-w-[9rem] 2xl:max-w-[12rem] ${open || isPortalActive ? 'text-slate-500' : 'text-white/70'}`}>
            {orgName}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        role="menu"
        className={`absolute z-50 right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white text-slate-800 border border-slate-200 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25)] overflow-hidden origin-top-right transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
          open ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 border-b border-slate-100">
          <span className="w-10 h-10 rounded-full bg-hx-932d16 text-white flex items-center justify-center font-black shrink-0">
            {user.fullName ? user.fullName.charAt(0) : 'A'}
          </span>
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-900 truncate">{user.fullName}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
            <span
              className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isSuperAdmin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isSuperAdmin ? <ShieldCheck className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
              {isSuperAdmin ? 'ผู้ดูแลระบบ สอจ.' : 'ผู้ดูแลสถานศึกษา'}
            </span>
          </div>
        </div>
        {user.institution?.name && (
          <div className="px-4 py-2.5 text-xs text-slate-600 border-b border-slate-100 flex items-start gap-2">
            <School className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
            <span className="leading-snug">{user.institution.name}</span>
          </div>
        )}
        <div className="p-1.5">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenPortal();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-hx-932d16" />
            <span>{adminLabel}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface NavbarProps {
  user: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenLogin,
  onLogout,
}) => {
  const navItems = [
    { id: 'overview', label: 'ข้อมูลพื้นฐาน', icon: BarChart3 }, // BarChart3 icon for Overview
    { id: 'dve_career', label: 'ทวิภาคี & ห้องเรียนอาชีพ', icon: Cog }, // Award icon for DVE Career
    { id: 'employment', label: 'ภาวะการมีงานทำ', icon: Briefcase },
    { id: 'institutions', label: 'สถานศึกษาในสังกัด', icon: School },
    { id: 'contact', label: 'ติดต่อเรา', icon: Mail },
  ];

  // เมนูสำหรับผู้ที่ล็อกอิน: แอดมิน สอจ. เข้าตั้งค่าระบบ, แอดมินสถานศึกษาเข้าหน้าจัดการข้อมูล (อยู่ในเมนูผู้ใช้ และแท็บล่างบนจอเล็ก)
  const adminMenu = user
    ? { id: 'portal', label: user.role === 'SUPER_ADMIN' ? 'ตั้งค่าระบบ' : 'จัดการข้อมูล', icon: Settings }
    : null;
  const mobileItems = adminMenu ? [...navItems, adminMenu] : navItems;

  const desktopPill = useSlidingPill(activeTab, navItems.map((i) => i.id).join());
  const mobilePill = useSlidingPill(activeTab, mobileItems.map((i) => i.id).join());

  // เมื่อคลิกที่แท็บใดก็ตาม ให้ระบบเลื่อนไปที่ตำแหน่งข้อมูลนั้นๆ อัตโนมัติ (Offset สำหรับ Sticky Navbar)
  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setTimeout(() => {
      const element = document.getElementById('main-tab-content');
      if (element) {
        const yOffset = -90;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }
    }, 80);
  };

  return (
    <header className="sticky top-0 z-40 bg-hx-932d16 text-white shadow-md border-b border-hx-742210">
      <div className="max-w-[94rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20 gap-3 sm:gap-6">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => {
              setActiveTab('overview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            <img 
              src="/vec.png" 
              alt="VEC Logo" 
              className="h-11 sm:h-12 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform bg-white/95 p-1 rounded-full shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  UDVEC<span className="text-amber-400">Smart</span>
                </span>
                <span className="hidden sm:inline text-[10px] sm:text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-amber-200 border border-white/20">
                  สอจ.อุดรธานี
                </span>
              </div>
              <p className="text-[11px] text-white/80 hidden 2xl:block font-light">
                ระบบสารสนเทศ สำนักงานอาชีวศึกษาจังหวัดอุดรธานี
              </p>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <nav ref={desktopPill.containerRef} className="relative hidden xl:flex items-center gap-0.5 2xl:gap-2 text-xs 2xl:text-sm font-medium whitespace-nowrap ml-4 2xl:ml-12 shrink-0">
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 rounded-xl bg-white shadow-md pointer-events-none duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
              style={desktopPill.pillStyle}
            />
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  ref={desktopPill.setItemRef(item.id)}
                  onClick={() => handleTabSelect(item.id)}
                  className={`relative z-10 flex items-center gap-1.5 px-2.5 2xl:px-3.5 py-2 rounded-xl transition-colors duration-300 cursor-pointer ${
                    isActive
                      ? 'text-hx-932d16 font-bold'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`hidden 2xl:block w-4 h-4 ${isActive ? 'text-hx-932d16' : 'text-amber-300'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Auth Button / User Profile (Pushed to Far Right) */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            {user && adminMenu ? (
              <UserMenu
                user={user}
                adminLabel={adminMenu.label}
                isPortalActive={activeTab === adminMenu.id}
                onOpenPortal={() => handleTabSelect(adminMenu.id)}
                onLogout={onLogout}
              />
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ<span className="hidden sm:inline">เจ้าหน้าที่</span></span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Tab Bar */}
        <div ref={mobilePill.containerRef as React.RefObject<HTMLDivElement>} className="relative flex xl:hidden overflow-x-auto py-2.5 gap-2 border-t border-white/10 no-scrollbar">
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 rounded-lg bg-white shadow pointer-events-none duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
            style={mobilePill.pillStyle}
          />
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                ref={mobilePill.setItemRef(item.id)}
                onClick={() => handleTabSelect(item.id)}
                className={`${item.id === 'portal' ? 'sm:hidden ' : ''}relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors duration-300 ${
                  isActive
                    ? 'text-hx-932d16 font-bold'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};

