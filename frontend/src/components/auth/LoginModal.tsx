import React, { useState } from 'react';
import { login } from '../../services/api';
import { UserProfile } from '../../types';
import { X, Lock, Mail, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

// =========================================================================
// ⚙️ [จุดที่ 1 ชี้เป้า]: สวิตช์ เปิด/ปิด "ทางลัดสำหรับทดสอบระบบ" (Quick Presets)
// - เปลี่ยนเป็น true  => แสดงทางลัดสำหรับทดสอบ (สะดวกตอนพัฒนา/ทดลองระบบ)
// - เปลี่ยนเป็น false => ซ่อนทางลัดทั้งหมด (ใช้สำหรับขึ้น Production / อัพขึ้น GitHub)
// =========================================================================
const SHOW_DEV_PRESETS = false; // เปลี่ยนเป็น true เพื่อแสดงปุ่มทางลัดสำหรับทดสอบระบบ

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      // บันทึก JWT Token ลง localStorage
      localStorage.setItem('udpvecsmart_token', data.accessToken);
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // ⚙️ [จุดที่ 2 ชี้เป้า]: ฟังก์ชันช่วยกรอกรหัสผ่านสำหรับปุ่มทางลัด
  // สามารถเปลี่ยนรหัสผ่านเริ่มต้นตรงนี้ หรือระบุแยกตามแต่ละปุ่มด้านล่างได้
  // =========================================================================
  const fillCredentials = (testEmail: string, testPassword = 'Password@1234') => {
    setEmail(testEmail);
    setPassword(testPassword);
    setError(null);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">เข้าสู่ระบบเจ้าหน้าที่</h3>
              <p className="text-xs text-slate-500">สอจ.อุดรธานี & สถานศึกษาในสังกัด</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              อีเมลผู้ใช้งาน (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@udpvec.go.th"
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md transition-colors"
                tabIndex={-1}
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังตรวจสอบ...</span>
              </>
            ) : (
              <span>เข้าสู่ระบบ (Sign In)</span>
            )}
          </button>

          {/* Preset Buttons for Quick Testing (ควบคุมการเปิด/ปิด ด้วยตัวแปร SHOW_DEV_PRESETS ด้านบน) */}
          {SHOW_DEV_PRESETS && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>ทางลัดสำหรับทดสอบระบบ (Quick Presets):</span>
                </div>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                  โหมดทดสอบ
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* ⚙️ [จุดที่ 3 ชี้เป้า]: บัญชี Super Admin (สอจ.อุดรธานี) 
                    - ปรับรหัสผ่านตรงนี้: fillCredentials('อีเมล', 'รหัสผ่านใหม่') */}
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@udpvec.go.th', '@dmin1234')}
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs transition-colors group"
                >
                  <div className="font-semibold text-blue-600 group-hover:underline">สอจ.อุดรธานี</div>
                  <div className="text-[10px] text-slate-400">admin@udpvec.go.th</div>
                </button>

                {/* ⚙️ [จุดที่ 4 ชี้เป้า]: บัญชี School Admin (วท.อุดรธานี) */}
                <button
                  type="button"
                  onClick={() => fillCredentials('admin.udtc@udpvec.go.th', 'admin1234')}
                  className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs transition-colors group"
                >
                  <div className="font-semibold text-emerald-600 group-hover:underline">วท.อุดรธานี</div>
                  <div className="text-[10px] text-slate-400">admin.udtc@udpvec...</div>
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
