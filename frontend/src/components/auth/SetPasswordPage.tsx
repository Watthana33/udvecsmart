import React, { useEffect, useState } from 'react';
import { KeyRound, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { checkPasswordLink, applyPasswordLink } from '../../services/api';

import { PASSWORD_MIN, PASSWORD_MAX } from '../../utils/passwordRules';

// โทเคนอยู่หลังเครื่องหมาย # (ไม่ถูกส่งไปกับ request/บันทึกใน log ของเซิร์ฟเวอร์)
function readToken(): string {
  const m = /[#&]t=([A-Za-z0-9_-]+)/.exec(window.location.hash);
  return m ? m[1] : '';
}

/** หน้าตั้งรหัสผ่านจากลิงก์ที่แอดมินส่งให้ (/set-password#t=...) */
export const SetPasswordPage: React.FC = () => {
  const [token] = useState(readToken);
  const [state, setState] = useState<'checking' | 'ready' | 'invalid' | 'done'>('checking');
  const [account, setAccount] = useState<{ email: string; fullName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('ลิงก์ไม่ครบ กรุณาเปิดลิงก์จากข้อความที่แอดมินส่งให้อีกครั้ง');
      setState('invalid');
      return;
    }
    checkPasswordLink(token)
      .then((d) => {
        setAccount(d);
        setState('ready');
      })
      .catch((err) => {
        setError(err.response?.data?.message || `ตรวจสอบลิงก์ไม่สำเร็จ (${err.message})`);
        setState('invalid');
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return setError(`รหัสผ่านต้องยาว ${PASSWORD_MIN}-${PASSWORD_MAX} ตัวอักษร`);
    if (password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
    try {
      setSaving(true);
      await applyPasswordLink(token, password);
      // ลบโทเคนออกจากแถบที่อยู่ กันเผลอแชร์ลิงก์ที่ใช้แล้ว
      window.history.replaceState(null, '', '/set-password');
      setState('done');
    } catch (err: any) {
      setError(err.response?.data?.message || `ตั้งรหัสผ่านไม่สำเร็จ (${err.message})`);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-hx-932d16/40 focus:border-hx-932d16';

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-7 sm:p-8 border border-slate-200 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-hx-932d16/10 text-hx-932d16">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">ตั้งรหัสผ่าน</h1>
            <p className="text-xs text-slate-500">UDPVECSmart · สอจ.อุดรธานี</p>
          </div>
        </div>

        {state === 'checking' && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>กำลังตรวจสอบลิงก์...</span>
          </div>
        )}

        {state === 'invalid' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-2.5 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {state === 'done' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-2.5 text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>ตั้งรหัสผ่านเรียบร้อยแล้ว เข้าสู่ระบบด้วย {account?.email} และรหัสผ่านใหม่ได้เลย</span>
            </div>
          </div>
        )}

        {state === 'ready' && account && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
              <div className="text-xs text-slate-500">บัญชี</div>
              <div className="font-bold text-slate-900">{account.fullName}</div>
              <div className="font-mono text-xs text-slate-600">{account.email}</div>
            </div>
            <div>
              <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                รหัสผ่านใหม่ ({PASSWORD_MIN}-{PASSWORD_MAX} ตัวอักษร)
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  maxLength={PASSWORD_MAX}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                id="confirm-password"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls}
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-hx-932d16 hover:bg-hx-7a2411 text-white text-sm font-bold shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่าน'}</span>
            </button>
          </form>
        )}

        <a href="/" className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-hx-932d16 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับหน้าแรก</span>
        </a>
      </div>
    </div>
  );
};
