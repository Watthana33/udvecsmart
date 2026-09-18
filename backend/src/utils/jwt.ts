import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  institutionId?: string | null;
}

/**
 * สร้างบัตรผ่านดิจิทัล (JWT Token) โดยนำข้อมูลผู้ใช้ฝังลงใน Token
 * @param payload ข้อมูลของผู้ใช้ (ID, Email, Role, วิทยาลัย)
 * @returns สตริง JWT Token เช่น "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  });
}

/**
 * ตรวจสอบความถูกต้องและแกะข้อมูลออกจาก JWT Token
 * @param token บัตรผ่านที่ส่งมาจาก Client
 * @returns ข้อมูลผู้ใช้ที่ฝังไว้ใน Token หรือ throw error หากบัตรหมดอายุ/ปลอมแปลง
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
}
