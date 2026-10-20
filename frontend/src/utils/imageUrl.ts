// รูปที่อัปโหลดผ่านระบบรูปของเว็บ: /api/images/<id>/{thumb|display|original}
// thumb = รูปย่อ (การ์ด), display = รูปแสดงผล, original = ไฟล์ต้นฉบับที่ไม่ย่อ (ให้ผู้ชมกดดูภาพใหญ่แล้วคลิกขวาบันทึกได้)
export type ImageVariant = 'thumb' | 'display' | 'original';

const IMAGE_URL_RE = /^(\/api\/images\/[0-9a-f-]{36})\/(?:thumb|display|original)$/i;

/** สลับชนิดของรูปในระบบรูปของเว็บ; ถ้าเป็นลิงก์/ข้อมูลรูปแบบเก่า (base64 หรือ URL ภายนอก) คืนค่าเดิม */
export function imageVariant(url: string | null | undefined, variant: ImageVariant): string {
  if (!url) return '';
  const m = IMAGE_URL_RE.exec(url);
  return m ? `${m[1]}/${variant}` : url;
}
