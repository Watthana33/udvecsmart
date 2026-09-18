import React from 'react';
import { UserProfile } from '../../types';
import { LogIn, LogOut, Building2, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onOpenLogin, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3.5">
            <img 
              src="/vec.png" 
              alt="VEC Logo" 
              className="h-12 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform"
              onError={(e) => {
                // Fallback icon if image not found
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900 tracking-tight">UDPVEC<span className="text-blue-600">Smart</span></span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  สอจ.อุดรธานี
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                ระบบสารสนเทศ สำนักงานอาชีวศึกษาจังหวัดอุดรธานี
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#stats" className="hover:text-blue-600 transition-colors">
              สถิติภาพรวม
            </a>
            <a href="#institutions" className="hover:text-blue-600 transition-colors">
              สถานศึกษาในสังกัด
            </a>
            <a href="#news" className="hover:text-blue-600 transition-colors">
              ข่าวประชาสัมพันธ์
            </a>
          </nav>

          {/* Auth Button / User Profile */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full py-1.5 px-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
                  {user.fullName.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    {user.fullName}
                    {user.role === 'SUPER_ADMIN' ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">
                        <ShieldCheck className="w-3 h-3" /> สอจ.
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                        <Building2 className="w-3 h-3" /> {user.institution?.name || 'วิทยาลัย'}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">{user.email}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 active:scale-98"
              >
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบเจ้าหน้าที่</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
