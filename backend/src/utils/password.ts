import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * แปลงรหัสผ่านข้อความธรรมดา (Plain text) เป็นข้อความเข้ารหัส (Hash)
 * @param password รหัสผ่านธรรมดา เช่น "Password@1234"
 * @returns รหัสผ่านที่เข้ารหัสแล้ว เช่น "$2a$10$e7Vj7B5..."
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * เปรียบเทียบรหัสผ่านที่ผู้ใช้พิมพ์เข้ามา กับ รหัสผ่านที่เข้ารหัสไว้ในฐานข้อมูล
 * @param password รหัสผ่านที่ผู้ใช้พิมพ์ตอน Login
 * @param hash รหัสผ่านที่เข้ารหัสแล้วที่ดึงมาจากฐานข้อมูล
 * @returns true ถ้ารหัสผ่านตรงกัน, false ถ้าไม่ตรง
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
