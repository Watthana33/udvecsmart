// สีหลักของ UI ตามธีม สำหรับกราฟ canvas (chart.js ใช้ตัวแปร CSS ไม่ได้)
// ค่าต้องตรงกับ PROVINCE ใน frontend/tailwind.config.js
const BRAND_DEFAULT = '#932d16';
const BRAND_PROVINCE = '#c2410c';

export function brandColor(): string {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('theme-province')
    ? BRAND_PROVINCE
    : BRAND_DEFAULT;
}
