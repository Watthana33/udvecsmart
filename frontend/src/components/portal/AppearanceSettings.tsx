import React, { useEffect, useRef, useState } from 'react';
import { Palette, Megaphone, Save, Eye, ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { API_BASE_URL, getSettings, updateAppearanceSettings, uploadImage } from '../../services/api';
import { SiteTheme, WelcomeMode } from '../../types';
import { WelcomeGate, DEFAULT_WELCOME_BADGE, resolveWelcomeBadge } from '../appearance/WelcomeGate';

interface AppearanceSettingsProps {
  onToast: (type: 'success' | 'error', title: string, message: string) => void;
  /** บันทึกแล้ว ให้ App โหลดการตั้งค่าใหม่ (เห็นผลทันที) */
  onChanged?: () => void;
}

const THEME_OPTIONS: { value: SiteTheme; label: string; desc: string; swatch: string[] }[] = [
  { value: 'normal', label: 'ปกติ', desc: 'สีตามแบบเดิมของเว็บไซต์', swatch: ['#932d16', '#f59e0b', '#1e3a8a'] },
  { value: 'mono', label: 'ขาวดำ', desc: 'ส่วนติดต่อผู้ใช้เป็นขาว-ดำ-เทา แต่รูปภาพและกราฟยังเป็นสีปกติ', swatch: ['#111111', '#777777', '#ffffff'] },
  { value: 'gray', label: 'สีเทาทั้งเว็บ', desc: 'พื้นหลังและทั้งเว็บเป็นเทาหม่น ดูนุ่มและเศร้ากว่า', swatch: ['#2a2a2a', '#7d7d7d', '#c1c1c1'] },
];

const MODE_OPTIONS: { value: WelcomeMode; label: string; desc: string }[] = [
  { value: 'fullpage', label: 'เต็มหน้า', desc: 'แสดงข่าวสารเต็มหน้าจอ มีปุ่มเข้าสู่เว็บไซต์' },
  { value: 'modal', label: 'การ์ดใหญ่บังหน้าจอ', desc: 'การ์ดกลางจอทับหน้าเว็บ (เว็บเบลอด้านหลัง) มีปุ่มเข้าสู่เว็บไซต์' },
];

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ onToast, onChanged }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [siteTheme, setSiteTheme] = useState<SiteTheme>('normal');
  const [mourningRibbon, setMourningRibbon] = useState(false);

  const [welcomeEnabled, setWelcomeEnabled] = useState(false);
  const [welcomeMode, setWelcomeMode] = useState<WelcomeMode>('fullpage');
  const [welcomeBadgeEnabled, setWelcomeBadgeEnabled] = useState(true);
  const [welcomeBadgeText, setWelcomeBadgeText] = useState(DEFAULT_WELCOME_BADGE);
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [welcomeContent, setWelcomeContent] = useState('');
  // รูปที่ใช้อยู่จากเซิร์ฟเวอร์ (เป็น URL) และรูปใหม่ที่เลือก (data URL; null = ไม่เปลี่ยน, '' = ลบรูป)
  const [serverImage, setServerImage] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const welcomeImage = newImage !== null ? newImage : serverImage;
  const [welcomeButtonText, setWelcomeButtonText] = useState('เข้าสู่เว็บไซต์');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setSiteTheme(s.site_theme || 'normal');
        setMourningRibbon(!!s.mourning_ribbon);
        setWelcomeEnabled(!!s.welcome_enabled);
        setWelcomeMode(s.welcome_mode === 'modal' ? 'modal' : 'fullpage');
        setWelcomeBadgeEnabled(s.welcome_badge_enabled !== false);
        setWelcomeBadgeText(s.welcome_badge_text === undefined ? DEFAULT_WELCOME_BADGE : String(s.welcome_badge_text));
        setWelcomeTitle(String(s.welcome_title ?? ''));
        setWelcomeContent(String(s.welcome_content ?? ''));
        setServerImage(s.welcome_has_image ? `${API_BASE_URL}/settings/welcome-image?v=${s.welcome_image_version ?? ''}` : '');
        setWelcomeButtonText(String(s.welcome_button_text || 'เข้าสู่เว็บไซต์'));
      })
      .catch((err) => onToast('error', 'โหลดการตั้งค่าไม่สำเร็จ', err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploadingImage(true);
      // อัปโหลดไฟล์ต้นฉบับขึ้นเซิร์ฟเวอร์ (ไม่ย่อ ไม่เกิน 50MB) แล้วใช้รูปแสดงผลในหน้าข่าวสาร
      const uploaded = await uploadImage(file);
      setNewImage(uploaded.urls.display);
    } catch (err: any) {
      onToast('error', 'อัปโหลดรูปไม่สำเร็จ', err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (welcomeEnabled && !welcomeTitle.trim() && !welcomeContent.trim() && !welcomeImage) {
      onToast('error', 'ยังไม่มีเนื้อหา', 'เปิดหน้าข่าวสารแล้ว ต้องมีอย่างน้อยหัวข้อ เนื้อหา หรือรูปภาพ 1 อย่าง');
      return;
    }
    try {
      setSaving(true);
      await updateAppearanceSettings({
        siteTheme,
        mourningRibbon,
        welcomeEnabled,
        welcomeMode,
        welcomeBadgeEnabled,
        welcomeBadgeText,
        welcomeTitle,
        welcomeContent,
        // ส่งรูปเฉพาะตอนเปลี่ยน/ลบ (ไม่ส่งซ้ำทุกครั้ง)
        ...(newImage !== null ? { welcomeImage: newImage } : {}),
        welcomeButtonText: welcomeButtonText.trim() || 'เข้าสู่เว็บไซต์',
      });
      onToast('success', 'บันทึกสำเร็จ!', 'ผู้เข้าชมจะเห็นการเปลี่ยนแปลงเมื่อเปิดหรือรีเฟรชหน้าเว็บ');
      if (newImage !== null) {
        setServerImage(newImage);
        setNewImage(null);
      }
      onChanged?.();
    } catch (err: any) {
      onToast('error', 'บันทึกไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>กำลังโหลดการตั้งค่ารูปลักษณ์เว็บไซต์...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ธีมไว้อาลัย */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-900/10 text-slate-800">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">ธีมสีเว็บไซต์ (ไว้อาลัย)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              เปลี่ยนสีทั้งเว็บไซต์ในคราวเดียว ใช้ในช่วงไว้อาลัยหรือวันสำคัญ แล้วสลับกลับเป็นปกติได้ทุกเมื่อ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const active = siteTheme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSiteTheme(opt.value)}
                className={`text-left p-4 rounded-2xl border-2 transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 ${
                  active ? 'border-hx-932d16 bg-hx-fdf6f4' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex gap-1.5 mb-3">
                  {opt.swatch.map((c) => (
                    <span key={c} className="w-7 h-7 rounded-full border border-slate-200" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
          <div>
            <h4 className="text-sm font-bold text-slate-900">แสดงริบบิ้นไว้อาลัยมุมขวาบน</h4>
            <p className="text-xs text-slate-500">ริบบิ้นดำตามธรรมเนียมเว็บไซต์ราชการ เปิดคู่กับธีมใดก็ได้</p>
          </div>
          <input
            type="checkbox"
            checked={mourningRibbon}
            onChange={(e) => setMourningRibbon(e.target.checked)}
            className="w-5 h-5 text-hx-932d16 rounded border-slate-300 focus:ring-hx-932d16"
          />
        </label>
      </div>

      {/* หน้าข่าวสารก่อนเข้าเว็บ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-hx-932d16/10 text-hx-932d16">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">หน้าข่าวสารก่อนเข้าเว็บไซต์</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              แสดงประกาศหรือข่าวสำคัญให้ผู้เข้าชมเห็นก่อน แล้วกดปุ่มเข้าสู่เว็บไซต์ (แสดงทุกครั้งที่ผู้เข้าชมเปิดหรือรีเฟรชหน้าเว็บ)
            </p>
          </div>
        </div>

        <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
          <div>
            <h4 className="text-sm font-bold text-slate-900">เปิดใช้หน้าข่าวสาร</h4>
            <p className="text-xs text-slate-500">{welcomeEnabled ? 'ปัจจุบัน: เปิด (ผู้เข้าชมจะเห็นก่อนเข้าเว็บ)' : 'ปัจจุบัน: ปิด'}</p>
          </div>
          <input
            type="checkbox"
            checked={welcomeEnabled}
            onChange={(e) => setWelcomeEnabled(e.target.checked)}
            className="w-5 h-5 text-hx-932d16 rounded border-slate-300 focus:ring-hx-932d16"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODE_OPTIONS.map((opt) => {
            const active = welcomeMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWelcomeMode(opt.value)}
                className={`text-left p-4 rounded-2xl border-2 transition-[border-color,background-color] duration-150 ${
                  active ? 'border-hx-932d16 bg-hx-fdf6f4' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* ภาพย่อบอกรูปแบบ */}
                <div className="h-16 mb-3 rounded-lg bg-slate-100 border border-slate-200 relative overflow-hidden">
                  {opt.value === 'fullpage' ? (
                    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-1">
                      <span className="w-10 h-1.5 rounded bg-slate-400" />
                      <span className="w-14 h-1 rounded bg-slate-300" />
                      <span className="w-8 h-2.5 rounded bg-hx-932d16" />
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-slate-400/50" />
                      <div className="absolute left-4 right-4 top-2 bottom-2 rounded bg-white border border-slate-300 flex flex-col items-center justify-center gap-1">
                        <span className="w-10 h-1.5 rounded bg-slate-400" />
                        <span className="w-8 h-2.5 rounded bg-hx-932d16" />
                      </div>
                    </>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <h4 className="text-sm font-bold text-slate-900">แสดงป้ายข้อความเหนือหัวข้อ</h4>
                <p className="text-xs text-slate-500">ป้ายเล็กด้านบน เช่น "ประกาศ / ข่าวสารถึงผู้เข้าชม" ปิดได้ถ้าไม่ต้องการ</p>
              </div>
              <input
                type="checkbox"
                checked={welcomeBadgeEnabled}
                onChange={(e) => setWelcomeBadgeEnabled(e.target.checked)}
                className="w-5 h-5 text-hx-932d16 rounded border-slate-300 focus:ring-hx-932d16"
              />
            </label>
            <div>
              <label htmlFor="welcome-badge" className="block text-xs font-bold text-slate-700 mb-1.5">ข้อความบนป้าย</label>
              <input
                id="welcome-badge"
                type="text"
                value={welcomeBadgeText}
                maxLength={80}
                disabled={!welcomeBadgeEnabled}
                onChange={(e) => setWelcomeBadgeText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-hx-932d16/40 focus:border-hx-932d16 disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="welcome-title" className="block text-xs font-bold text-slate-700 mb-1.5">หัวข้อ</label>
            <input
              id="welcome-title"
              type="text"
              value={welcomeTitle}
              maxLength={200}
              onChange={(e) => setWelcomeTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-hx-932d16/40 focus:border-hx-932d16"
            />
          </div>

          <div>
            <label htmlFor="welcome-content" className="block text-xs font-bold text-slate-700 mb-1.5">เนื้อหาข่าวสาร</label>
            <textarea
              id="welcome-content"
              value={welcomeContent}
              maxLength={5000}
              rows={6}
              onChange={(e) => setWelcomeContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-hx-932d16/40 focus:border-hx-932d16"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-right">{welcomeContent.length}/5000</p>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-700 mb-1.5">รูปประกอบ (ไม่บังคับ)</span>
            <input ref={fileRef} type="file" accept="image/*,.heic,.heif" onChange={handlePickImage} className="hidden" />
            {welcomeImage ? (
              <div className="flex items-start gap-3">
                <img src={welcomeImage} alt="รูปประกอบหน้าข่าวสาร" className="h-28 max-w-[50%] rounded-xl border border-slate-200 object-contain bg-slate-50" />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    เปลี่ยนรูป
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewImage('')}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรูป</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full py-6 rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-hx-932d16 hover:text-hx-932d16 transition-colors flex items-center justify-center gap-2"
              >
                <ImagePlus className="w-5 h-5" />
                <span>{uploadingImage ? 'กำลังอัปโหลด...' : 'เลือกรูปภาพ (เก็บไฟล์ต้นฉบับไว้ให้ ไม่เกิน 50MB)'}</span>
              </button>
            )}
          </div>

          <div>
            <label htmlFor="welcome-button" className="block text-xs font-bold text-slate-700 mb-1.5">ข้อความบนปุ่ม</label>
            <input
              id="welcome-button"
              type="text"
              value={welcomeButtonText}
              maxLength={60}
              onChange={(e) => setWelcomeButtonText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-hx-932d16/40 focus:border-hx-932d16"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPreviewing(true)}
          className="w-full py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          <span>ดูตัวอย่างหน้าข่าวสาร</span>
        </button>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-hx-932d16 hover:bg-hx-7a2411 text-white font-bold text-sm rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        <span>{saving ? 'กำลังบันทึก...' : 'บันทึกธีมและหน้าข่าวสาร'}</span>
      </button>

      {previewing && (
        <WelcomeGate
          mode={welcomeMode}
          badge={resolveWelcomeBadge(welcomeBadgeEnabled, welcomeBadgeText)}
          title={welcomeTitle}
          content={welcomeContent}
          image={welcomeImage}
          buttonText={welcomeButtonText || 'เข้าสู่เว็บไซต์'}
          onEnter={() => setPreviewing(false)}
        />
      )}
    </div>
  );
};
