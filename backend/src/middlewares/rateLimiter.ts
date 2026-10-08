import rateLimit from 'express-rate-limit';

/**
 * 1. ตัวป้องกันการสุ่มรหัสผ่าน (Brute Force Protection สำหรับ Login)
 * จำกัดการพยายามล็อกอินไม่เกิน 10 ครั้งต่อ 15 นาที ต่อ 1 หมายเลข IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 10, // สูงสุด 10 ครั้ง
  standardHeaders: true, // ส่งข้อมูล RateLimit-* ใน Response Headers
  legacyHeaders: false, // ปิด X-RateLimit-* แบบเก่า
  message: {
    status: 'error',
    message: 'มีการพยายามเข้าสู่ระบบถี่เกินไป เพื่อความปลอดภัย กรุณารอ 15 นาที แล้วลองใหม่อีกครั้ง',
  },
});

/**
 * 2. ตัวป้องกันสแปมข้อความติดต่อ (Spam Protection สำหรับ Contact Form)
 * จำกัดการส่งข้อความไม่เกิน 10 ข้อความต่อ 15 นาที ต่อ 1 หมายเลข IP
 */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'คุณส่งข้อความติดต่อถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
  },
});

/**
 * 3. ตัวป้องกันการยิง Request ถล่มเซิร์ฟเวอร์ภาพรวม (General API DDoS / Flood Protection)
 * กำหนดไว้สูงพอ (300 requests/นาที) เพื่อให้ Dashboard โหลดข้อมูลหลาย API พร้อมกันได้อย่างราบรื่น
 */
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 นาที
  max: 300, // สูงสุด 300 ครั้งต่อนาที
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'มีการส่งคำขอเข้ามายังระบบถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
  },
});
