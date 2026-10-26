import { API_BASE_URL } from '../services/api';
import type { SiteSettings } from '../types';

export const MAX_BANNERS = 4; // รูปที่เพิ่มเองเก็บได้ (รูปที่ 1 เป็นรูปเริ่มต้นของระบบ รวมเป็น 5 ช่อง)

export interface BannerState {
  images: string[]; // รูปที่อัปโหลดไว้
  selected: string; // ลิงก์รูปที่ใช้แสดง ('' = รูปเริ่มต้น)
}

/** แบนเนอร์ที่ตั้งไว้: รายการรูป + รูปที่เลือก (ยังไม่เคยตั้งแบบใหม่ แต่มีรูปเดี่ยวแบบเดิม → ใช้รูปเดี่ยวนั้นต่อ) */
export function resolveBanner(s?: SiteSettings | null): BannerState {
  if (!s) return { images: [], selected: '' };
  let images: string[] = [];
  try {
    const list = JSON.parse(String(s.banner_images ?? '[]'));
    if (Array.isArray(list)) images = list.filter((x) => typeof x === 'string').slice(0, MAX_BANNERS);
  } catch { /* ค่าเสีย → ถือว่าไม่มีรายการ */ }
  const legacy = s.banner_has_image ? `${API_BASE_URL}/settings/banner-image?v=${s.banner_image_version ?? ''}` : '';
  if (images.length === 0 && legacy) return { images: [legacy], selected: legacy };
  const selected = typeof s.banner_selected === 'string' ? s.banner_selected : '';
  return { images, selected: images.includes(selected) ? selected : '' };
}
