import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, ShieldCheck, Download, Undo2, CheckCircle2, XCircle, Loader2, PackageCheck, History, Info } from 'lucide-react';
import { getSystemStatus, checkSystemUpdate, getSystemHealth, startSystemUpgrade, startSystemRollback } from '../../services/api';

interface Props {
  onToast: (type: 'success' | 'error', title: string, message: string) => void;
}

interface Check { key: string; label: string; ok: boolean; detail: string }
interface Step { key: string; label: string; status: 'running' | 'done' | 'failed'; detail: string }
interface Job {
  type: 'upgrade' | 'rollback';
  status: 'running' | 'restarting' | 'success' | 'failed' | 'rolled_back';
  from: string | null;
  to: string;
  steps: Step[];
  warnings: string[];
  error: string | null;
}

const UPGRADE_STEP_TOTAL = 8;
const ACTIVE = ['running', 'restarting'];

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

export const SystemUpdate: React.FC<Props> = ({ onToast }) => {
  const [status, setStatus] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [release, setRelease] = useState<any>(null);
  const [health, setHealth] = useState<Check[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [confirmUpgrade, setConfirmUpgrade] = useState(false);
  const [confirmRollback, setConfirmRollback] = useState(false);
  const [restoreDb, setRestoreDb] = useState(false);
  const [starting, setStarting] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const lastJobId = useRef<string | null>(null);

  const errText = (e: any) => e.response?.data?.message || e.message || `HTTP ${e.response?.status ?? '-'}`;

  const load = useCallback(async () => {
    try {
      const s = await getSystemStatus();
      setStatus(s);
      setLoadError(null);
      setReconnecting(false);
      return s;
    } catch (e: any) {
      // ระหว่างรีสตาร์ต backend จะติดต่อไม่ได้ชั่วคราว — ไม่ถือเป็นข้อผิดพลาด
      if (status?.job && ACTIVE.includes(status.job.status)) setReconnecting(true);
      else setLoadError(errText(e));
      return null;
    }
  }, [status]);

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  const job: Job | null = status?.job || null;
  const active = !!job && ACTIVE.includes(job.status);

  // ติดตามความคืบหน้าขณะมีงานทำอยู่
  useEffect(() => {
    if (!active) return;
    setCardVisible(true);
    const t = window.setInterval(() => { void load(); }, 2500);
    return () => window.clearInterval(t);
  }, [active, load]);

  // งานจบ: แจ้งผล (ครั้งเดียวต่องาน) แล้วซ่อนการ์ดหลังหน่วงสั้น ๆ
  useEffect(() => {
    if (!job || ACTIVE.includes(job.status) || !cardVisible) return;
    const key = `${job.type}-${job.to}-${job.status}`;
    if (lastJobId.current !== key) {
      lastJobId.current = key;
      if (job.status === 'success') onToast('success', job.type === 'upgrade' ? 'อัปเดตสำเร็จ' : 'ย้อนคืนสำเร็จ', `ตอนนี้ใช้เวอร์ชัน ${job.to}`);
      else if (job.status === 'rolled_back') onToast('error', 'อัปเดตไม่ผ่าน — ย้อนคืนอัตโนมัติแล้ว', job.error || '');
      else onToast('error', job.type === 'upgrade' ? 'อัปเดตไม่สำเร็จ' : 'ย้อนคืนไม่สำเร็จ', job.error || '');
    }
    const t = window.setTimeout(() => setCardVisible(false), 1800);
    return () => window.clearTimeout(t);
  }, [job, cardVisible, onToast]);

  const doCheck = async () => {
    setChecking(true);
    try {
      const r = await checkSystemUpdate();
      setRelease(r);
      setHealth(r.checks);
    } catch (e: any) {
      onToast('error', 'ตรวจเวอร์ชันใหม่ไม่สำเร็จ', errText(e));
    } finally {
      setChecking(false);
    }
  };

  const doHealth = async () => {
    setCheckingHealth(true);
    try {
      const r = await getSystemHealth();
      setHealth(r.checks);
      onToast(r.ready ? 'success' : 'error', r.ready ? 'ระบบพร้อมทำงาน' : 'พบรายการที่ไม่ผ่าน', r.ready ? 'ผ่านการตรวจทุกข้อ' : 'ดูรายละเอียดในรายการตรวจสุขภาพ');
    } catch (e: any) {
      onToast('error', 'ตรวจสุขภาพระบบไม่สำเร็จ', errText(e));
    } finally {
      setCheckingHealth(false);
    }
  };

  const doUpgrade = async () => {
    if (!release?.latest) return;
    setStarting(true);
    try {
      await startSystemUpgrade(release.latest.tag);
      setConfirmUpgrade(false);
      setCardVisible(true);
      await load();
    } catch (e: any) {
      onToast('error', 'เริ่มอัปเดตไม่สำเร็จ', errText(e));
    } finally {
      setStarting(false);
    }
  };

  const doRollback = async () => {
    setStarting(true);
    try {
      await startSystemRollback(restoreDb);
      setConfirmRollback(false);
      setCardVisible(true);
      await load();
    } catch (e: any) {
      onToast('error', 'เริ่มย้อนคืนไม่สำเร็จ', errText(e));
    } finally {
      setStarting(false);
    }
  };

  if (loadError && !status) {
    return <div className="bg-white rounded-3xl p-6 border border-slate-200 text-sm text-red-600">โหลดสถานะระบบอัปเดตไม่สำเร็จ: {loadError}</div>;
  }
  if (!status) {
    return <div className="bg-white rounded-3xl p-8 border border-slate-200 flex items-center gap-3 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" />กำลังโหลด...</div>;
  }
  if (!status.enabled) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-black text-slate-900">ระบบอัปเดตเว็บยังไม่เปิดใช้งาน</h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{status.reason}</p>
          </div>
        </div>
      </div>
    );
  }

  const stepTotal = job?.type === 'rollback' ? 3 : UPGRADE_STEP_TOTAL;
  const stepsDone = job ? Math.min(stepTotal, job.steps.filter((s) => s.status === 'done').length + (job.status === 'success' ? 1 : 0)) : 0;
  const pct = job && job.status === 'success' ? 100 : Math.round((stepsDone / stepTotal) * 100);
  const currentStep = job?.steps[job.steps.length - 1];
  const blocked = !!release?.blockers?.length;
  const canUpgrade = release?.updateStatus === 'update_available' && !blocked && release.ready && !active;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">อัปเดตระบบ</h3>
            <p className="text-sm text-slate-600 mt-1">
              เวอร์ชันที่ใช้งานอยู่: <strong className="text-hx-932d16">{status.current?.version || 'ยังไม่มี (ใช้โค้ดในอิมเมจ)'}</strong>
              {status.current?.manifest?.builtAt && <span className="text-slate-400"> · build {fmtDate(status.current.manifest.builtAt)}</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={doHealth} disabled={checkingHealth || active} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors duration-150">
              {checkingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{checkingHealth ? 'กำลังตรวจ...' : 'ตรวจสุขภาพระบบ'}</span>
            </button>
            <button onClick={doCheck} disabled={checking || active} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-hx-932d16 text-white text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-[filter] duration-150">
              {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>{checking ? 'กำลังตรวจ...' : 'ตรวจสอบเวอร์ชันใหม่'}</span>
            </button>
          </div>
        </div>

        {release && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            {release.fetchError && <p className="text-sm text-red-600">{release.fetchError}</p>}
            {release.updateStatus === 'no_release' && <p className="text-sm text-slate-600">ยังไม่มี release บน GitHub</p>}
            {release.updateStatus === 'up_to_date' && (
              <p className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />ใช้เวอร์ชันล่าสุดแล้ว ({release.latest?.tag})</p>
            )}
            {release.updateStatus === 'ahead' && <p className="text-sm text-slate-600">เวอร์ชันที่ใช้งานใหม่กว่า release ล่าสุดบน GitHub ({release.latest?.tag})</p>}
            {release.updateStatus === 'update_available' && release.latest && (
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <PackageCheck className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-black text-slate-900">มีเวอร์ชันใหม่ {release.latest.tag}</span>
                  <span className="text-xs text-slate-500">{fmtDate(release.latest.publishedAt)}{release.latest.sizeMb ? ` · ${release.latest.sizeMb} MB` : ''}</span>
                </div>
                {release.latest.notes && <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-600 bg-slate-50 rounded-2xl p-4 border border-slate-100 font-sans leading-relaxed max-h-48 overflow-auto">{release.latest.notes}</pre>}
                {blocked && (
                  <ul className="mt-3 space-y-1">
                    {release.blockers.map((b: string) => <li key={b} className="text-sm text-red-600 flex gap-2"><XCircle className="w-4 h-4 shrink-0 mt-0.5" />{b}</li>)}
                  </ul>
                )}
                {!release.ready && !blocked && <p className="mt-3 text-sm text-red-600">ระบบยังไม่พร้อมอัปเดต — ดูรายการตรวจสุขภาพด้านล่าง</p>}
                <button onClick={() => setConfirmUpgrade(true)} disabled={!canUpgrade} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150">
                  <Download className="w-4 h-4" /><span>อัปเกรดเป็น {release.latest.tag}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {health && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-4">ผลตรวจสุขภาพระบบ</h3>
          <ul className="divide-y divide-slate-100">
            {health.map((c) => (
              <li key={c.key} className="py-2.5 flex items-start gap-3 text-sm">
                {c.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                <div className="min-w-0"><div className="font-bold text-slate-800">{c.label}</div><div className="text-xs text-slate-500 break-words">{c.detail}</div></div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">ย้อนคืนเวอร์ชัน</h3>
            <p className="text-sm text-slate-600 mt-1">{status.rollback.available ? <>เวอร์ชันก่อนหน้าที่ย้อนกลับได้: <strong>{status.rollback.to}</strong></> : 'ยังไม่มีเวอร์ชันก่อนหน้าให้ย้อนคืน'}</p>
          </div>
          <button onClick={() => { setRestoreDb(false); setConfirmRollback(true); }} disabled={!status.rollback.available || active} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 text-amber-800 bg-amber-50 text-sm font-bold hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150">
            <Undo2 className="w-4 h-4" /><span>ย้อนคืน</span>
          </button>
        </div>
      </div>

      {status.history?.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2"><History className="w-4 h-4" />ประวัติล่าสุด</h3>
          <ul className="divide-y divide-slate-100 text-sm">
            {status.history.map((h: any) => (
              <li key={h.id} className="py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-bold text-slate-800">{h.type === 'upgrade' ? 'อัปเกรด' : 'ย้อนคืน'} {h.from || '-'} → {h.to}</span>
                <span className={h.status === 'success' ? 'text-emerald-700' : h.status === 'rolled_back' ? 'text-amber-700' : 'text-red-600'}>
                  {h.status === 'success' ? 'สำเร็จ' : h.status === 'rolled_back' ? 'ย้อนคืนอัตโนมัติ' : 'ไม่สำเร็จ'}
                </span>
                <span className="text-xs text-slate-400">{fmtDate(h.finishedAt)}</span>
                {h.error && <span className="w-full text-xs text-slate-500 break-words">{h.error}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmUpgrade && release?.latest && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 flex items-center justify-center p-4" onClick={() => !starting && setConfirmUpgrade(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-[0_16px_40px_-8px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-base font-black text-slate-900">อัปเกรดเป็น {release.latest.tag}?</h4>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">ระบบจะดาวน์โหลด ตรวจไฟล์ ทดลองเริ่ม สำรองฐานข้อมูล แล้วสลับเวอร์ชัน เว็บจะสะดุดสั้น ๆ ตอนรีสตาร์ต ถ้าเวอร์ชันใหม่ไม่ผ่านการตรวจ ระบบจะย้อนกลับเองอัตโนมัติ</p>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setConfirmUpgrade(false)} disabled={starting} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors duration-150">ยกเลิก</button>
              <button onClick={doUpgrade} disabled={starting} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60 transition-colors duration-150">
                {starting && <Loader2 className="w-4 h-4 animate-spin" />}<span>{starting ? 'กำลังเริ่ม...' : 'เริ่มอัปเกรด'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRollback && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 flex items-center justify-center p-4" onClick={() => !starting && setConfirmRollback(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-[0_16px_40px_-8px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-base font-black text-slate-900">ย้อนคืนเป็น {status.rollback.to}?</h4>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">เว็บจะสะดุดสั้น ๆ ตอนรีสตาร์ต ข้อมูลในฐานข้อมูลคงเดิม เว้นแต่เลือกกู้ฐานข้อมูลด้วย</p>
            <label className={`mt-4 flex items-start gap-3 text-sm ${status.rollback.hasBackup ? 'cursor-pointer' : 'opacity-50'}`}>
              <input type="checkbox" checked={restoreDb} disabled={!status.rollback.hasBackup} onChange={(e) => setRestoreDb(e.target.checked)} className="mt-1 w-4 h-4 accent-hx-932d16" />
              <span><strong>กู้ฐานข้อมูลเป็นก่อนอัปเดตด้วย</strong><br /><span className="text-xs text-red-600">ข้อมูลที่เพิ่ม/แก้หลังอัปเดตจะหายไป ใช้เมื่อเวอร์ชันใหม่ทำข้อมูลเสียหายเท่านั้น</span>{!status.rollback.hasBackup && <><br /><span className="text-xs text-slate-500">ไม่มีไฟล์สำรองที่ตรงกับเวอร์ชันนี้</span></>}</span>
            </label>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setConfirmRollback(false)} disabled={starting} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors duration-150">ยกเลิก</button>
              <button onClick={doRollback} disabled={starting} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 disabled:opacity-60 transition-colors duration-150">
                {starting && <Loader2 className="w-4 h-4 animate-spin" />}<span>{starting ? 'กำลังเริ่ม...' : 'ย้อนคืน'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* การ์ดความคืบหน้า มุมขวาล่าง */}
      <div
        className={`fixed right-5 bottom-5 z-50 w-[19rem] max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl p-4 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.3)] border border-slate-200 transition-[opacity,transform] duration-200 ease-out ${cardVisible && job ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          {job?.status === 'success'
            ? <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
            : job?.type === 'rollback'
              ? <Undo2 className="w-8 h-8 text-hx-932d16 shrink-0 motion-safe:animate-bounce" />
              : <Download className="w-8 h-8 text-hx-932d16 shrink-0 motion-safe:animate-bounce" />}
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-900">{job?.type === 'rollback' ? 'กำลังย้อนคืนเวอร์ชัน' : `กำลังอัปเกรดเป็น ${job?.to ?? ''}`}</div>
            <div className="text-xs text-slate-500 mt-0.5 break-words">
              {reconnecting ? 'เว็บกำลังรีสตาร์ต รอสักครู่...' : job?.status === 'restarting' ? 'กำลังรีสตาร์ตและตรวจสุขภาพ...' : currentStep ? `ขั้นที่ ${stepsDone + (currentStep.status === 'running' ? 1 : 0)}/${stepTotal} · ${currentStep.label}${currentStep.detail ? ` (${currentStep.detail})` : ''}` : 'เตรียมการ...'}
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-hx-932d16 transition-[width] duration-[600ms]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
};
