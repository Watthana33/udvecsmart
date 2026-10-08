import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

// ตรวจสอบความปลอดภัยของ JWT_SECRET ในโหมด Production
if (ENV.NODE_ENV === 'production' && (!process.env.JWT_SECRET || ENV.JWT_SECRET === 'fallback-secret-key')) {
  console.warn(
    '⚠️ [SECURITY WARNING] ระบบกำลังใช้งาน JWT_SECRET ค่าเริ่มต้น! กรุณาตั้งค่า JWT_SECRET สุ่มความยาวอย่างน้อย 32 ตัวอักษรในไฟล์ .env บน Production เพื่อความปลอดภัย'
  );
}
