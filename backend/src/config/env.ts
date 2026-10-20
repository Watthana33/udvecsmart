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
  // โฟลเดอร์เก็บไฟล์รูปที่อัปโหลด (ใน Docker ผูกกับ volume ./uploads — ต้องรวมไว้ในการสำรองข้อมูล)
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
};
