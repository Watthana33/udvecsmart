import React, { useEffect, useState } from 'react';
import { Facebook, Save, Loader2, RefreshCw, KeyRound, PlugZap, CheckCircle2, XCircle } from 'lucide-react';
import { getFacebookSettings, updateFacebookSettings, clearFacebookToken, syncFacebookNow, testFacebookConnection } from '../../services/api';
import type { FacebookStatus } from '../../services/api';

interface FacebookSettingsProps {
  onToast: (type: 'success' | 'error', title: string, message: string) => void;
}

const inputCls =
  'w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-hx-932d16/40 focus:border-hx-932d16';

const formatTime = (iso: string) => {
  if (!iso) return 'ยังไม่เคยดึง';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '-' : d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
};

/** หลังบ้าน: ดึงโพสต์จาก Facebook Page เข้าระบบข่าว (token เก็บที่เซิร์ฟเวอร์ ไม่ส่งกลับมาแสดง) */
export const FacebookSettings: React.FC<FacebookSettingsProps> = ({ onToast }) => {
  const [status, setStatus] = useState<FacebookStatus | null>(null);
  const [pageId, setPageId] = useState('');
  const [token, setToken] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  const apply = (s: FacebookStatus) => {
    setStatus(s);
    setPageId(s.pageId);
    setEnabled(s.enabled);
    setToken('');
  };

  useEffect(() => {
    getFacebookSettings()
      .then(apply)
      .catch((err: any) => onToast('error', 'โหลดการตั้งค่า Facebook ไม่สำเร็จ', err.response?.data?.message || err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!confirmClear) return;
    const t = setTimeout(() => setConfirmClear(false), 4000);
    return () => clearTimeout(t);
  }, [confirmClear]);

  if (!status) return null;

  const dirty = pageId.trim() !== status.pageId || token.trim() !== '' || enabled !== status.enabled;
  const ready = !!status.pageId && status.hasToken;
  const canTest = (pageId.trim() !== '') && (token.trim() !== '' || status.hasToken);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const next = await updateFacebookSettings({
        pageId: pageId.trim(),
        ...(token.trim() ? { token: token.trim() } : {}),
        enabled,
      });
      apply(next);
      onToast('success', 'บันทึกการตั้งค่า Facebook สำเร็จ', next.enabled ? 'ระบบจะดึงโพสต์ใหม่ทุก 30 นาที' : 'ปิดการดึงอัตโนมัติอยู่');
    } catch (err: any) {
      onToast('error', 'บันทึกไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const r = await testFacebookConnection({ pageId: pageId.trim(), token: token.trim() });
      const text = `เชื่อมต่อสำเร็จ: เพจ "${r.pageName}" อ่านโพสต์ได้ (พบโพสต์ล่าสุด ${r.recentPosts} โพสต์)`;
      setTestResult({ ok: true, text });
      onToast('success', 'เชื่อมต่อ Facebook สำเร็จ', text);
    } catch (err: any) {
      const text = err.response?.data?.message || err.message;
      setTestResult({ ok: false, text });
      onToast('error', 'เชื่อมต่อ Facebook ไม่สำเร็จ', text);
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const r = await syncFacebookNow();
      setStatus(r);
      onToast('success', 'ดึงข่าวจาก Facebook สำเร็จ', r.added > 0 ? `เพิ่มข่าวใหม่ ${r.added} รายการ (จากโพสต์ล่าสุด ${r.fetched} โพสต์)` : `ไม่มีโพสต์ใหม่ (ตรวจ ${r.fetched} โพสต์)`);
    } catch (err: any) {
      onToast('error', 'ดึงข่าวไม่สำเร็จ', err.response?.data?.message || err.message);
      getFacebookSettings().then(setStatus).catch(() => {});
    } finally {
      setSyncing(false);
    }
  };

  const handleClearToken = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    try {
      setConfirmClear(false);
      apply(await clearFacebookToken());
      onToast('success', 'ลบ token แล้ว', 'ปิดการดึงอัตโนมัติให้แล้ว ข่าวที่ดึงมาก่อนหน้ายังอยู่');
    } catch (err: any) {
      onToast('error', 'ลบ token ไม่สำเร็จ', err.response?.data?.message || err.message);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-2xl bg-[#1877f2]/10 text-[#1877f2]">
          <Facebook className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">ดึงข่าวจาก Facebook Page</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            ระบบดึงโพสต์ที่มีข้อความจากเพจมาเป็นข่าวประชาสัมพันธ์ ตรวจโพสต์ใหม่ทุก 30 นาที
            หากลบข่าวที่ดึงมา ระบบจะซ่อนไว้และไม่ดึงกลับมาอีก ข่าวที่ดึงมาจะแสดงเป็นสไลด์ข่าวหน้าแรก (ใต้แบนเนอร์)
            และอยู่ในรายการสไลด์ข่าวประชาสัมพันธ์ด้านล่างของหน้านี้
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fb-page-id" className="block text-xs font-bold text-slate-700 mb-1.5">Page ID หรือชื่อผู้ใช้เพจ</label>
          <input id="fb-page-id" type="text" value={pageId} onChange={(e) => setPageId(e.target.value)} maxLength={100} className={inputCls} />
        </div>
        <div>
          <label htmlFor="fb-token" className="block text-xs font-bold text-slate-700 mb-1.5">
            Page Access Token {status.hasToken && <span className="font-normal text-emerald-700">(บันทึกไว้แล้ว)</span>}
          </label>
          <input
            id="fb-token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            maxLength={1000}
            placeholder={status.hasToken ? 'เว้นว่างเพื่อใช้ token เดิม' : ''}
            className={inputCls}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer w-fit">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-hx-932d16" />
        <span>เปิดดึงข่าวอัตโนมัติทุก 30 นาที</span>
      </label>

      <div className="text-xs text-slate-500 space-y-1">
        <p>ดึงล่าสุด: <strong className="text-slate-700">{formatTime(status.lastSync)}</strong> · ข่าวที่ดึงมาแล้ว {status.imported} รายการ</p>
        {status.lastError && <p className="text-red-600">ผิดพลาดครั้งล่าสุด: {status.lastError}</p>}
      </div>

      {testResult && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl px-4 py-3 text-xs font-bold ${
            testResult.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span className="select-text break-words">{testResult.text}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !canTest}
          className="px-5 py-2.5 rounded-xl border border-hx-932d16/40 text-xs font-bold text-hx-932d16 hover:bg-hx-932d16/5 transition-colors flex items-center gap-2 disabled:opacity-40"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
          <span>{testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
        </button>
        <button
          type="submit"
          disabled={saving || !dirty}
          className="px-5 py-2.5 rounded-xl bg-hx-932d16 hover:bg-hx-7a2411 text-white text-xs font-bold shadow transition-colors flex items-center gap-2 disabled:opacity-40"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>บันทึกการตั้งค่า</span>
        </button>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || !ready || dirty}
          title={dirty ? 'บันทึกการตั้งค่าก่อน' : undefined}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-40"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>{syncing ? 'กำลังดึงข่าว...' : 'ดึงข่าวตอนนี้'}</span>
        </button>
        {status.hasToken && (
          <button
            type="button"
            onClick={handleClearToken}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              confirmClear ? 'bg-red-600 hover:bg-red-700 text-white shadow' : 'border border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{confirmClear ? 'กดอีกครั้งเพื่อลบ token' : 'ลบ token'}</span>
          </button>
        )}
      </div>
    </form>
  );
};
