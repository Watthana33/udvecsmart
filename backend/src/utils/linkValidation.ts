// ตรวจลิงก์ที่รับจากผู้ใช้ก่อนบันทึก (กัน javascript:/data: ที่นำไปใส่ href/src ได้)

const HTTP_URL_RE = /^https?:\/\/[^\s]{1,2000}$/i;
const SITE_PATH_RE = /^\/(?!\/)[^\s]{0,500}$/;
const HTTPS_URL_RE = /^https:\/\/[^\s]{1,2000}$/i;
const OWN_IMAGE_RE = /^\/api\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(?:thumb|display|original)$/i;

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === '';
}

/** ลิงก์เว็บทั่วไป (เว็บไซต์วิทยาลัย, ลิงก์ข่าว): ว่างได้, http(s)://..., หรือ path ภายในเว็บ */
export function linkError(value: unknown, label: string): string | null {
  if (isEmpty(value)) return null;
  if (typeof value === 'string' && (HTTP_URL_RE.test(value) || SITE_PATH_RE.test(value))) return null;
  return `${label}ต้องเป็นลิงก์ที่ขึ้นต้นด้วย http:// หรือ https://`;
}

/** รูปที่อ้างอิงในข้อมูล (รูปผู้บริหาร, ปกข่าว): ว่างได้, รูปในระบบอัปโหลดของเว็บ, หรือลิงก์ https — ไม่รับ base64 (ให้อัปโหลดผ่านระบบรูป)
 *  ไม่รับ http:// เพราะ CSP ของหน้าเว็บ (img-src) อนุญาตเฉพาะ https เบราว์เซอร์จะบล็อกจนรูปแตก */
export function imageRefError(value: unknown, label: string): string | null {
  if (isEmpty(value)) return null;
  if (typeof value === 'string') {
    if (OWN_IMAGE_RE.test(value) || HTTPS_URL_RE.test(value)) return null;
    if (value.startsWith('data:')) return `${label}ต้องอัปโหลดผ่านระบบรูปของเว็บ (ไม่รับข้อมูลรูปแบบฝังในข้อความ)`;
    if (/^http:\/\//i.test(value)) return `${label}ต้องเป็นลิงก์ https:// (เบราว์เซอร์จะบล็อกรูปจาก http://)`;
  }
  return `${label}ไม่ถูกต้อง (ต้องเป็นรูปที่อัปโหลดในระบบหรือลิงก์ https://)`;
}

/** รวมการตรวจหลายช่อง คืนข้อความ error แรกที่เจอ (ไม่มี = null) */
export function firstLinkError(links: Array<[unknown, string]>, images: Array<[unknown, string]> = []): string | null {
  for (const [v, label] of links) {
    const e = linkError(v, label);
    if (e) return e;
  }
  for (const [v, label] of images) {
    const e = imageRefError(v, label);
    if (e) return e;
  }
  return null;
}
