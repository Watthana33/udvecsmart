// สีหลักของ UI ตามธีม สำหรับกราฟ canvas (chart.js ใช้ตัวแปร CSS ไม่ได้)
// BRAND_PROVINCE ต้องตรงกับ PROVINCE ใน frontend/tailwind.config.js
const BRAND_DEFAULT = '#932d16';
const BRAND_PROVINCE = '#c2410c';

export const CUSTOM_COLOR_KEYS = ['primary', 'primaryDark', 'primaryDeep', 'primaryLight', 'primaryBg', 'navy'] as const;
export type CustomColorKey = (typeof CUSTOM_COLOR_KEYS)[number];
export type CustomColors = Record<CustomColorKey, string>;

// สีของแต่ละธีม (ใช้เป็นจุดเริ่มต้นตอนคัดลอกมาแก้ในธีม "ปรับแต่งเอง") — ค่าต้องตรงกับ tailwind.config.js
const NORMAL_COLORS: CustomColors = {
  primary: '#932d16',
  primaryDark: '#742210',
  primaryDeep: '#451206',
  primaryLight: '#b2391e',
  primaryBg: '#fdf6f4',
  navy: '#1e3a8a',
};
const PROVINCE_COLORS: CustomColors = {
  primary: '#c2410c',
  primaryDark: '#9a3412',
  primaryDeep: '#7c2d12',
  primaryLight: '#ea580c',
  primaryBg: '#fff7ed',
  navy: '#1b2a4e',
};
// ขาวดำ: แปลงเป็นเทาด้วยสูตรเดียวกับ monoVars ใน tailwind.config.js
const toGray = (hex: string): string => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const v = Math.round(0.299 * r + 0.587 * g + 0.114 * b).toString(16).padStart(2, '0');
  return `#${v}${v}${v}`;
};
const MONO_COLORS = Object.fromEntries(CUSTOM_COLOR_KEYS.map((k) => [k, toGray(NORMAL_COLORS[k])])) as CustomColors;

/** ธีมที่คัดลอกสีมาแก้ในธีม "ปรับแต่งเอง" ได้ */
export const COPYABLE_THEMES: { label: string; colors: CustomColors }[] = [
  { label: 'สอศ.', colors: NORMAL_COLORS },
  { label: 'สีจังหวัด', colors: PROVINCE_COLORS },
  { label: 'ขาวดำ', colors: MONO_COLORS },
];

// ค่าเริ่มต้นของธีมปรับแต่งเอง = สีของธีม สอศ. (ปุ่มคืนค่ากลับมาที่นี่)
export const CUSTOM_DEFAULTS: CustomColors = { ...NORMAL_COLORS };

// จุดที่ใช้แต่ละสี (แสดงในหน้าตั้งค่า)
export const CUSTOM_COLOR_INFO: Record<CustomColorKey, { label: string; desc: string }> = {
  primary: { label: 'สีหลัก', desc: 'แถบเมนูด้านบน ปุ่มหลัก และกราฟ' },
  primaryDark: { label: 'สีเข้ม', desc: 'ส่วนท้ายเว็บ (footer) และสีปุ่มตอนเมาส์ชี้' },
  primaryDeep: { label: 'สีเข้มมาก', desc: 'พื้นหรือตัวหนังสือส่วนที่ต้องการความเข้มสุด' },
  primaryLight: { label: 'สีสว่าง', desc: 'ส่วนไล่เฉดและจุดเน้นที่สว่างกว่าสีหลัก' },
  primaryBg: { label: 'พื้นจาง', desc: 'พื้นของการ์ดหรือตัวเลือกที่ถูกเลือก' },
  navy: { label: 'สีกรมท่า', desc: 'ส่วนที่เดิมเป็นน้ำเงินเข้ม' },
};

// ตัวแปร CSS ที่แต่ละสีไปควบคุม (กลุ่มเดียวกับ provinceVars ใน tailwind.config.js)
const VAR_MAP: Record<CustomColorKey, string[]> = {
  primary: ['hx-932d16', 'vec-primary'],
  primaryDark: ['hx-7a2411', 'hx-742210', 'hx-7d2511', 'hx-782310', 'vec-primaryDark'],
  primaryDeep: ['hx-451206'],
  primaryLight: ['hx-b2391e', 'vec-primaryLight'],
  primaryBg: ['hx-fdf6f4', 'vec-primaryBg'],
  navy: ['vec-blue'],
};

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;
export const CUSTOM_COLORS_CACHE_KEY = 'udpvecsmart_custom_colors';

let customPrimary: string | null = null;

/** แปลง JSON ที่เก็บในระบบเป็นชุดสี (ใช้เฉพาะค่าที่เป็น #rrggbb) — ไม่มีสีที่กำหนดเองเลยให้ null */
export function parseCustomColors(raw: unknown): CustomColors | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const obj = JSON.parse(raw);
    const out = { ...CUSTOM_DEFAULTS };
    let any = false;
    for (const k of CUSTOM_COLOR_KEYS) {
      if (typeof obj?.[k] === 'string' && HEX_RE.test(obj[k])) {
        out[k] = obj[k].toLowerCase();
        any = true;
      }
    }
    return any ? out : null;
  } catch {
    return null;
  }
}

/** ใส่สีที่ปรับแต่งเองลงที่ <html> (null = ล้างออก ใช้สีเริ่มต้นของธีม) */
export function applyCustomColors(colors: CustomColors | null): void {
  if (typeof document === 'undefined') return;
  const style = document.documentElement.style;
  for (const k of CUSTOM_COLOR_KEYS) {
    for (const v of VAR_MAP[k]) {
      if (!colors) {
        style.removeProperty(`--c-${v}`);
      } else {
        const h = colors[k].replace('#', '');
        style.setProperty(`--c-${v}`, [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' '));
      }
    }
  }
  customPrimary = colors ? colors.primary : null;
}

export function brandColor(): string {
  if (typeof document === 'undefined') return BRAND_DEFAULT;
  const cl = document.documentElement.classList;
  if (cl.contains('theme-custom')) return customPrimary || CUSTOM_DEFAULTS.primary;
  return cl.contains('theme-province') ? BRAND_PROVINCE : BRAND_DEFAULT;
}
