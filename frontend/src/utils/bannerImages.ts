import { API_BASE_URL } from '../services/api';
import type { SiteSettings } from '../types';

export const MAX_BANNERS = 4; // รูปที่เพิ่มเอง (รูปที่ 2-5) — รูปที่ 1 เป็นรูปเริ่มต้นของระบบเสมอ

/** รูปแบนเนอร์ที่แอดมินเพิ่ม (ต่อจากรูปเริ่มต้น): รายการสไลด์ใหม่ก่อน ไม่มีก็ใช้รูปเดี่ยวแบบเดิม */
export function resolveBanners(s?: SiteSettings | null): string[] {
  if (!s) return [];
  try {
    const list = JSON.parse(String(s.banner_images ?? '[]'));
    if (Array.isArray(list) && list.length > 0) return list.filter((x) => typeof x === 'string').slice(0, MAX_BANNERS);
  } catch { /* ค่าเสีย → ใช้รูปเดี่ยว */ }
  return s.banner_has_image ? [`${API_BASE_URL}/settings/banner-image?v=${s.banner_image_version ?? ''}`] : [];
}
