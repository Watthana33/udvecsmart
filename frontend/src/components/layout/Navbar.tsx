import React from 'react';
import { UserProfile } from '../../types';
import {
  LogIn,
  LogOut,
  BarChart3,
  School,
  Briefcase,
  Mail,
  Cog,
} from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-[#932d16] text-white shadow-md border-b border-[#742210]">
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
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-amber-200 border border-white/20">
                  สอจ.อุดรธานี
                </span>
              </div>
              <p className="text-[11px] text-white/80 hidden sm:block font-light">
                ระบบสารสนเทศ สำนักงานอาชีวศึกษาจังหวัดอุดรธานี
              </p>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs xl:text-sm font-medium whitespace-nowrap ml-7 xl:ml-12 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`flex items-center gap-1.5 px-3 xl:px-3.5 py-2 rounded-xl transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#932d16] font-bold shadow-md'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#932d16]' : 'text-amber-300'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Auth Button / User Profile (Pushed to Far Right) */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            {user ? (
              /* ปุ่ม ออกจากระบบ เด่นชัด */
              <button
                onClick={onLogout}
                title="คลิกเพื่อออกจากระบบ"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0 border border-rose-400/40"
              >
                <LogOut className="w-4 h-4 shrink-0 text-rose-100" />
                <span>ออกจากระบบ</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 whitespace-nowrap shrink-0"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบเจ้าหน้าที่</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Tab Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 gap-2 border-t border-white/10 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-[#932d16] font-bold shadow'
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

