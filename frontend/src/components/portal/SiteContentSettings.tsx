import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Building2, Eye, Save, Loader2, ImagePlus, RotateCcw, X, Check } from 'lucide-react';
import {
  uploadImage,
  getSettings,
  getVisitorCount,
  setVisitorCount,
  updateBannerImages,
  updateContactInfo,
} from '../../services/api';
import { MAX_BANNERS, resolveBanner } from '../../utils/bannerImages';
import { DEFAULT_CONTACT, resolveContact } from '../../utils/siteContact';

interface SiteContentSettingsProps {
  onToast: (type: 'success' | 'error', title: string, message: string) => void;
  /** แจ้งให้ App โหลดการตั้งค่าใหม่ เพื่อให้เห็นผลบนหน้าเว็บทันที */
  onChanged?: () => void;
}

const DEFAULT_BANNER = '/banner.png';

/** หลังบ้าน: แบนเนอร์หัวเว็บ + ข้อมูลติดต่อ สอจ. + ยอดผู้เข้าชม — เก็บที่เซิร์ฟเวอร์ทั้งหมด */
export const SiteContentSettings: React.FC<SiteContentSettingsProps> = ({ onToast, onChanged }) => {
  const [loading, setLoading] = useState(true);

  // แบนเนอร์ (สไลด์ไม่เกิน 5 รูป)
  const [serverBanner, setServerBanner] = useState<{ images: string[]; selected: string }>({ images: [], selected: '' }); // ที่บันทึกแล้ว
  const [banners, setBanners] = useState<string[]>([]); // รูปที่อัปโหลดไว้ (กำลังแก้ ยังไม่บันทึก)
  const [selectedBanner, setSelectedBanner] = useState(''); // รูปที่เลือกใช้แสดง ('' = รูปเริ่มต้น)
  const [savingBanner, setSavingBanner] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ข้อมูลติดต่อ
  const [address, setAddress] = useState(DEFAULT_CONTACT.address);
  const [phone, setPhone] = useState(DEFAULT_CONTACT.phone);
  const [email, setEmail] = useState(DEFAULT_CONTACT.email);
  const [hours, setHours] = useState(DEFAULT_CONTACT.hours);
  const [facebook, setFacebook] = useState(DEFAULT_CONTACT.facebook);
  const [savingContact, setSavingContact] = useState(false);
  const [contactBaseline, setContactBaseline] = useState(''); // ค่าที่บันทึกแล้ว ไว้เทียบว่าแก้อะไรค้างอยู่ไหม
  const contactKey = JSON.stringify([address, phone, email, hours, facebook]);
  const contactDirty = contactKey !== contactBaseline;

  // ยอดผู้เข้าชม
  const [visitorCount, setVisitorCountState] = useState<number | null>(null);
  const [visitorInput, setVisitorInput] = useState('');
  const [savingVisitor, setSavingVisitor] = useState(false);
  // ช่องตัวเลขต่างจากยอดปัจจุบัน = มีการแก้ค้างอยู่
  const visitorDirty = visitorCount !== null && visitorInput.replace(/,/g, '').trim() !== String(visitorCount);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    Promise.all([getSettings(), getVisitorCount().catch(() => null)])
      .then(([s, count]) => {
        const bl = resolveBanner(s);
        setServerBanner(bl);
        setBanners(bl.images);
        setSelectedBanner(bl.selected);
        const c = resolveContact(s);
        setAddress(c.address);
        setPhone(c.phone);
        setEmail(c.email);
        setHours(c.hours);
        setFacebook(c.facebook);
        setContactBaseline(JSON.stringify([c.address, c.phone, c.email, c.hours, c.facebook]));
        if (typeof count === 'number') {
          setVisitorCountState(count);
          setVisitorInput(String(count));
        }
      })
      .catch((err) => onToast('error', 'โหลดการตั้งค่าไม่สำเร็จ', err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bannerDirty = JSON.stringify(banners) !== JSON.stringify(serverBanner.images) || selectedBanner !== serverBanner.selected;

  const handlePickBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const room = MAX_BANNERS - banners.length;
    if (files.length > room) onToast('error', 'เลือกรูปเกินจำนวน', `แบนเนอร์มีได้ไม่เกิน ${MAX_BANNERS} รูป (เหลือที่ว่าง ${room} รูป) ระบบจะใช้ ${room} รูปแรก`);
    try {
      setUploadingBanner(true);
      const added: string[] = [];
      for (const f of files.slice(0, room)) {
        // อัปโหลดไฟล์ต้นฉบับขึ้นเซิร์ฟเวอร์ (ไม่ย่อ ไม่เกิน 50MB) แล้วใช้รูปแสดงผลเป็นแบนเนอร์
        const uploaded = await uploadImage(f);
        added.push(uploaded.urls.display);
      }
      setBanners((prev) => [...prev, ...added].slice(0, MAX_BANNERS));
    } catch (err: any) {
      onToast('error', 'อัปโหลดรูปไม่สำเร็จ', err.message);
    } finally {
      setUploadingBanner(false);
    }
  };

  const removeBanner = (url: string) => {
    setBanners((prev) => prev.filter((u) => u !== url));
    if (selectedBanner === url) setSelectedBanner(''); // ลบรูปที่ใช้อยู่ → กลับไปใช้รูปเริ่มต้น
  };

  const handleSaveBanner = async () => {
    try {
      setSavingBanner(true);
      await updateBannerImages(banners, selectedBanner);
      onToast('success', 'บันทึกแบนเนอร์สำเร็จ', selectedBanner === '' ? 'ใช้แบนเนอร์เริ่มต้น ทุกคนจะเห็นเมื่อเปิดหรือรีเฟรชหน้าเว็บ' : 'ใช้รูปที่เลือกเป็นแบนเนอร์ ทุกคนจะเห็นเมื่อเปิดหรือรีเฟรชหน้าเว็บ');
      setServerBanner({ images: banners, selected: selectedBanner });
      onChanged?.();
    } catch (err: any) {
      onToast('error', 'บันทึกแบนเนอร์ไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSavingBanner(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingContact(true);
      await updateContactInfo({
        contactAddress: address,
        contactPhone: phone,
        contactEmail: email,
        contactHours: hours,
        contactFacebook: facebook,
      });
      onToast('success', 'บันทึกข้อมูลติดต่อสำเร็จ', 'ข้อมูลใน Footer และหน้าติดต่อเราเปลี่ยนตามแล้ว');
      setContactBaseline(contactKey);
      onChanged?.();
    } catch (err: any) {
      onToast('error', 'บันทึกข้อมูลติดต่อไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSavingContact(false);
    }
  };

  // รีเซ็ตยอดเป็น 0 (กดสองครั้งเพื่อยืนยัน)
  const handleResetVisitor = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 5000);
      return;
    }
    try {
      setSavingVisitor(true);
      await setVisitorCount(0);
      setVisitorCountState(0);
      setVisitorInput('0');
      onToast('success', 'รีเซ็ตยอดผู้เข้าชมแล้ว', 'ยอดผู้เข้าชมกลับเป็น 0 ครั้ง');
    } catch (err: any) {
      onToast('error', 'รีเซ็ตยอดไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSavingVisitor(false);
      setConfirmReset(false);
    }
  };

  const handleSaveVisitor = async () => {
    const n = Number(visitorInput.replace(/,/g, ''));
    if (!Number.isInteger(n) || n < 0) {
      onToast('error', 'ตัวเลขไม่ถูกต้อง', 'ยอดผู้เข้าชมต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป');
      return;
    }
    try {
      setSavingVisitor(true);
      await setVisitorCount(n);
      setVisitorCountState(n);
      onToast('success', 'ตั้งค่ายอดผู้เข้าชมสำเร็จ', `ยอดผู้เข้าชมตอนนี้คือ ${n.toLocaleString()} ครั้ง`);
    } catch (err: any) {
      onToast('error', 'ตั้งค่ายอดไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSavingVisitor(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>กำลังโหลดการตั้งค่า...</span>
      </div>
    );
  }

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-hx-932d16/40 focus:border-hx-932d16';

  return (
    <div className="space-y-6">
      {/* แบนเนอร์ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-hx-932d16/10 text-hx-932d16">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">แบนเนอร์ส่วนหัวเว็บ (Header Banner)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
อัปโหลดรูปเก็บไว้ได้อีก 4 รูป (รูปที่ 1 เป็นรูปเริ่มต้นของระบบ รวม 5 ช่อง) แล้วเลือกใช้แสดงได้ทีละ 1 รูป ขนาดรูปที่แนะนำ 2129 x 739 พิกเซล (รูปอัตราส่วนอื่นจะถูกตัดขอบให้พอดี) ผู้เข้าชมทุกคนเห็นรูปเดียวกัน ระบบเก็บไฟล์ต้นฉบับไว้ให้ (ไม่เกิน 50MB ต่อรูป)
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[{ url: '', label: 'รูปที่ 1 · รูปเริ่มต้นของระบบ' }, ...banners.map((url, i) => ({ url, label: `รูปที่ ${i + 2}` }))].map((b) => {
            const active = selectedBanner === b.url;
            return (
              <li
                key={b.url || 'default'}
                className={`rounded-2xl overflow-hidden bg-white border-2 transition-colors ${active ? 'border-hx-932d16' : 'border-slate-200'}`}
              >
                <div className="bg-slate-900 relative" style={{ aspectRatio: '2129 / 739' }}>
                  <img src={b.url || DEFAULT_BANNER} alt={b.label} className="w-full h-full object-cover block" />
                  {active && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-hx-932d16 text-white text-[11px] font-bold shadow">
                      <Check className="w-3 h-3" />
                      กำลังใช้แสดง
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-xs font-bold text-slate-600">{b.label}</span>
                  <div className="flex gap-1.5">
                    {!active && (
                      <button
                        type="button"
                        onClick={() => setSelectedBanner(b.url)}
                        className="px-3 py-1.5 rounded-lg border border-hx-932d16 text-hx-932d16 hover:bg-hx-932d16/5 text-xs font-bold transition-colors"
                      >
                        ใช้รูปนี้
                      </button>
                    )}
                    {b.url !== '' && (
                      <button type="button" aria-label="ลบรูปนี้" onClick={() => removeBanner(b.url)} className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-slate-500">
          อัปโหลดแล้ว {banners.length}/{MAX_BANNERS} รูป (รวมรูปเริ่มต้นเป็น {banners.length + 1}/5) · แสดงทีละ 1 รูป
        </p>
        {bannerDirty && (
          <p className="text-xs font-bold text-amber-700">แก้ไขแล้ว — ยังไม่ได้บันทึก กดปุ่ม "บันทึกแบนเนอร์" ด้านล่าง</p>
        )}

        <input ref={fileRef} type="file" multiple accept="image/*,.heic,.heif" onChange={handlePickBanner} className="hidden" />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingBanner || banners.length >= MAX_BANNERS}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            <span>{uploadingBanner ? 'กำลังอัปโหลด...' : 'เพิ่มรูปแบนเนอร์'}</span>
          </button>
          <button
            type="button"
            onClick={handleSaveBanner}
            disabled={!bannerDirty || savingBanner}
            className="px-5 py-2.5 rounded-xl bg-hx-932d16 hover:bg-hx-7a2411 text-white text-xs font-bold shadow transition-colors flex items-center gap-2 disabled:opacity-40"
          >
            {savingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{savingBanner ? 'กำลังบันทึก...' : 'บันทึกแบนเนอร์'}</span>
          </button>
        </div>
      </div>

      {/* ข้อมูลติดต่อ */}
      <form onSubmit={handleSaveContact} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-hx-932d16/10 text-hx-932d16">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">ข้อมูลติดต่อ สอจ. (Footer และหน้าติดต่อเรา)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">แก้ไขที่นี่ที่เดียว ข้อมูลทั้งสองหน้าจะเปลี่ยนตามกัน</p>
          </div>
        </div>

        <div>
          <label htmlFor="contact-address" className="block text-xs font-bold text-slate-700 mb-1.5">ที่อยู่สำนักงาน</label>
          <textarea id="contact-address" rows={2} maxLength={400} value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-phone" className="block text-xs font-bold text-slate-700 mb-1.5">เบอร์โทรศัพท์</label>
            <input id="contact-phone" type="text" maxLength={60} value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-xs font-bold text-slate-700 mb-1.5">อีเมลทางการ</label>
            <input id="contact-email" type="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="contact-hours" className="block text-xs font-bold text-slate-700 mb-1.5">เวลาทำการ</label>
            <input id="contact-hours" type="text" maxLength={120} value={hours} onChange={(e) => setHours(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="contact-facebook" className="block text-xs font-bold text-slate-700 mb-1.5">ลิงก์เฟซบุ๊กแฟนเพจ (ไม่บังคับ — ถ้าใส่ จะแสดงโพสต์ล่าสุดที่หน้าแรกใต้สไลด์ข่าวด้วย)</label>
            <input id="contact-facebook" type="url" maxLength={300} value={facebook} onChange={(e) => setFacebook(e.target.value)} className={inputCls} />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingContact || !contactDirty}
          className="px-5 py-2.5 rounded-xl bg-hx-932d16 hover:bg-hx-7a2411 text-white text-xs font-bold shadow transition-colors flex items-center gap-2 disabled:opacity-40"
        >
          {savingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{savingContact ? 'กำลังบันทึก...' : 'บันทึกข้อมูลติดต่อ'}</span>
        </button>
      </form>

      {/* ยอดผู้เข้าชม */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-hx-932d16/10 text-hx-932d16">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">ยอดผู้เข้าชมเว็บไซต์</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              ระบบนับผู้เข้าชมแต่ละคนไม่เกิน 1 ครั้งต่อ 30 นาที (รีเฟรชไม่นับเพิ่ม) ยอดปัจจุบัน:{' '}
              <strong className="text-slate-800">{visitorCount === null ? '-' : visitorCount.toLocaleString()}</strong> ครั้ง
              กดปุ่มรีเซ็ตเพื่อเริ่มนับใหม่จาก 0 หรือตั้งเป็นตัวเลขที่ต้องการด้านล่างได้
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="visitor-count" className="block text-xs font-bold text-slate-700 mb-1.5">ตั้งยอดผู้เข้าชมเป็น</label>
            <input
              id="visitor-count"
              type="text"
              inputMode="numeric"
              value={visitorInput}
              onChange={(e) => setVisitorInput(e.target.value)}
              className={`${inputCls} w-48`}
            />
          </div>
          <button
            type="button"
            onClick={handleSaveVisitor}
            disabled={savingVisitor || !visitorDirty}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-40"
          >
            {savingVisitor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>บันทึกยอด</span>
          </button>
          <button
            type="button"
            onClick={handleResetVisitor}
            disabled={savingVisitor}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-40 ${
              confirmReset ? 'bg-red-600 hover:bg-red-700 text-white shadow' : 'border border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{confirmReset ? 'กดอีกครั้งเพื่อยืนยันรีเซ็ตเป็น 0' : 'รีเซ็ตยอดเป็น 0'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
