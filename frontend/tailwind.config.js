import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

/**
 * สีฝั่ง UI ทุกสี (ยกเว้นเทา/ขาว/ดำ) ผูกกับตัวแปร CSS --c-<ชื่อ> ที่มีค่าเริ่มต้นเป็นสีเดิม
 * ธีมขาวดำ (html.theme-mono) แค่ประกาศตัวแปรเหล่านี้เป็นสีเทา UI จึงเป็นขาวดำ
 * ส่วนรูปภาพและกราฟ (canvas ของ chart.js) ไม่ใช้ตัวแปรเหล่านี้ จึงยังเป็นสีปกติ
 */
const monoVars = {};

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

const themed = (name, hex) => {
  const [r, g, b] = hexToRgb(hex);
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  monoVars[`--c-${name}`] = `${gray} ${gray} ${gray}`;
  return `rgb(var(--c-${name}, ${r} ${g} ${b}) / <alpha-value>)`;
};

const FAMILIES = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
];

const familyColors = {};
for (const family of FAMILIES) {
  familyColors[family] = {};
  for (const [shade, hex] of Object.entries(colors[family])) {
    familyColors[family][shade] = themed(`${family}-${shade}`, hex);
  }
}

const vec = {
  primary: '#932d16',
  primaryDark: '#742210',
  primaryLight: '#b2391e',
  primaryBg: '#fdf6f4',
  blue: '#1e3a8a',
  navy: '#0f172a',
  gold: '#f59e0b',
};
const vecColors = {};
for (const [k, hex] of Object.entries(vec)) vecColors[k] = themed(`vec-${k}`, hex);

// สีเฉพาะที่เคยเขียนเป็น bg-[#xxxxxx] ในโค้ด (ย้ายมาเป็นชื่อ hx-xxxxxx เพื่อให้สลับเป็นเทาได้)
const HX = [
  '932d16', '7a2411', '742210', 'fdf6f4', 'e11d48', '059669', 'f59e0b',
  '0284c7', 'fbbf24', 'b2391e', '7d2511', '7c3aed', '782310', '451206',
];
const hxColors = {};
for (const hex of HX) hxColors[hex] = themed(`hx-${hex}`, `#${hex}`);

/**
 * ธีม "สีจังหวัด" (html.theme-province): ดึงสีจากแบนเนอร์รูปที่ 2 — ส้มพระอาทิตย์ตก/ทอง/กรมท่าของเสื้อนักเรียน
 * สลับเฉพาะกลุ่มสีแดงเลือดหมู (สีหลักของ สอศ.) และน้ำเงินเข้ม ที่เหลือคงเดิม
 * (ค่าสีหลักต้องตรงกับ frontend/src/utils/themeColors.ts ที่ใช้กับกราฟ canvas)
 */
const PROVINCE = {
  primary: '#c2410c',      // ส้มเข้ม (ตัวหนังสือสีขาวบนพื้นนี้อ่านชัด)
  primaryDark: '#9a3412',  // ส้มน้ำตาล (hover / ส่วนเข้ม)
  primaryDeep: '#7c2d12',  // น้ำตาลเข้มมาก
  primaryLight: '#ea580c', // ส้มสว่างเหมือนแถบส้มในแบนเนอร์
  primaryBg: '#fff7ed',    // พื้นส้มจาง
  navy: '#1b2a4e',         // กรมท่าของเสื้อช่าง
};
const rgbVar = (hex) => hexToRgb(hex).join(' ');
const provinceVars = {
  '--c-hx-932d16': rgbVar(PROVINCE.primary),
  '--c-hx-7a2411': rgbVar(PROVINCE.primaryDark),
  '--c-hx-742210': rgbVar(PROVINCE.primaryDark),
  '--c-hx-7d2511': rgbVar(PROVINCE.primaryDark),
  '--c-hx-782310': rgbVar(PROVINCE.primaryDark),
  '--c-hx-451206': rgbVar(PROVINCE.primaryDeep),
  '--c-hx-b2391e': rgbVar(PROVINCE.primaryLight),
  '--c-hx-fdf6f4': rgbVar(PROVINCE.primaryBg),
  '--c-vec-primary': rgbVar(PROVINCE.primary),
  '--c-vec-primaryDark': rgbVar(PROVINCE.primaryDark),
  '--c-vec-primaryLight': rgbVar(PROVINCE.primaryLight),
  '--c-vec-primaryBg': rgbVar(PROVINCE.primaryBg),
  '--c-vec-blue': rgbVar(PROVINCE.navy),
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ...familyColors,
        vec: vecColors,
        hx: hxColors,
      },
      // Sarabun จาก Google Fonts ก่อน ถ้าโหลดไม่ได้ให้ใช้ฟอนต์ไทยที่มีในแต่ละระบบ (Windows: Leelawadee UI/Tahoma, macOS: Thonburi)
      // mono ใช้ฟอนต์ชุดเดียวกัน (ไม่ใช้ Menlo/Consolas ที่หน้าตาต่างกันระหว่าง Mac กับ Windows) — ตัวเลขเรียงตรงด้วย tabular-nums ใน index.css
      fontFamily: {
        sans: ['Sarabun', 'Noto Sans Thai', 'Leelawadee UI', 'Tahoma', 'Thonburi', 'sans-serif'],
        mono: ['Sarabun', 'Noto Sans Thai', 'Leelawadee UI', 'Tahoma', 'Thonburi', 'sans-serif'],
      }
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ 'html.theme-mono': monoVars, 'html.theme-province': provinceVars });
    }),
  ],
}
