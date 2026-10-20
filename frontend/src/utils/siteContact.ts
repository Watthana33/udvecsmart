import { SiteSettings } from '../types';

export interface SiteContact {
  address: string;
  phone: string;
  email: string;
  hours: string;
  facebook: string;
}

// ค่าเริ่มต้น (ใช้เมื่อแอดมินยังไม่เคยตั้งค่าข้อมูลติดต่อจากหลังบ้าน)
export const DEFAULT_CONTACT: SiteContact = {
  address: '3 ถนนวัฒนานุวงศ์ ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000',
  phone: '042-221538',
  email: 'admin@udpvec.go.th',
  hours: 'จันทร์ - ศุกร์: 08:30 น. - 16:30 น.',
  facebook: '',
};

const pick = (v: string | number | undefined, fallback: string) =>
  v === undefined ? fallback : String(v);

export function resolveContact(s: SiteSettings | null): SiteContact {
  return {
    address: pick(s?.contact_address, DEFAULT_CONTACT.address),
    phone: pick(s?.contact_phone, DEFAULT_CONTACT.phone),
    email: pick(s?.contact_email, DEFAULT_CONTACT.email),
    hours: pick(s?.contact_hours, DEFAULT_CONTACT.hours),
    facebook: pick(s?.contact_facebook, DEFAULT_CONTACT.facebook),
  };
}
