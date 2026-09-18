import React from 'react';
import { UserProfile } from '../../types';
import { LogIn, LogOut, Building2, ShieldCheck, BarChart3, School, Briefcase, Mail } from 'lucide-react';

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
    { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
    { id: 'employment', label: 'ภาวะการมีงานทำ', icon: Briefcase },
    { id: 'institutions', label: 'สถานศึกษาในสังกัด', icon: School },
    { id: 'contact', label: 'ติดต่อเรา', icon: Mail },
  ];

  // เมื่อคลิกที่แท็บใดก็ตาม ให้ระบบเลื่อนไปที่ตำแหน่งข้อมูลนั้นๆ อัตโนมัติ
  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setTimeout(() => {
      const element = document.getElementById('main-tab-content');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 380, behavior: 'smooth' });
      }
    }, 60);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#932d16] text-white shadow-md border-b border-[#742210]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => {
              setActiveTab('overview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3.5 cursor-pointer select-none"
          >
            <img 
              src="/vec.png" 
              alt="VEC Logo" 
              className="h-12 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform bg-white/90 p-1 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">
                  UDVEC<span className="text-amber-400">Smart</span>
                </span>
                <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-amber-200 border border-white/20">
                  สอจ.อุดรธานี
                </span>
              </div>
              <p className="text-xs text-white/80 hidden sm:block font-light">
                ระบบสารสนเทศ สำนักงานอาชีวศึกษาจังหวัดอุดรธานี
              </p>
            </div>
          </div>

          {/* 4 Main Tabs Nav */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-150 cursor-pointer ${
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

          {/* Auth Button / User Profile */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full py-1.5 px-3.5 text-white">
                <div className="w-8 h-8 rounded-full bg-amber-400 text-[#932d16] flex items-center justify-center font-bold text-xs shadow">
                  {user.fullName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    {user.fullName}
                    {user.role === 'SUPER_ADMIN' ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded font-semibold">
                        <ShieldCheck className="w-3 h-3" /> สอจ.
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-400 text-slate-900 px-1.5 py-0.2 rounded font-semibold">
                        <Building2 className="w-3 h-3" /> {user.institution?.name || 'วิทยาลัย'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/70">{user.email}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-98"
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
