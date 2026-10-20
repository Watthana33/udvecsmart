/**
 * ย้ายรูปที่เคยเก็บเป็น base64 ในฐานข้อมูล (รูปผู้บริหาร, รูปหน้าข่าวสาร, แบนเนอร์) ไปเป็นไฟล์ในระบบรูปใหม่
 * รันครั้งเดียวหลัง deploy:  node dist/scripts/migrate_photos.js
 * ทำซ้ำได้ปลอดภัย (ข้ามรายการที่ย้ายแล้ว) และ "ไม่ลบ" ข้อมูลอื่นใด — ไฟล์ต้นฉบับ = ไบต์เดิมที่เคยเก็บไว้ (ชัดเท่าเดิมที่มี)
 */
import { PrismaClient } from '@prisma/client';
import { saveUploadedImage } from '../services/image.service.js';

const prisma = new PrismaClient();
const DATA_RE = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/s;

function decode(value: string): Buffer | null {
  const m = DATA_RE.exec(value);
  return m ? Buffer.from(m[2], 'base64') : null;
}

async function main() {
  let moved = 0;
  let skipped = 0;

  const people = await prisma.personnel.findMany({
    where: { photoUrl: { startsWith: 'data:image' } },
    include: { institution: { select: { code: true } } },
  });
  for (const p of people) {
    const buf = decode(p.photoUrl as string);
    if (!buf) {
      console.warn(`ข้าม (ถอดรหัสไม่ได้): ${p.name}`);
      skipped++;
      continue;
    }
    const saved = await saveUploadedImage(buf, `${p.institution.code}-director.jpg`);
    await prisma.personnel.update({ where: { id: p.id }, data: { photoUrl: saved.urls.display } });
    console.log(`ผู้บริหาร ${p.name}: ${(buf.length / 1024).toFixed(1)}KB ${saved.width}x${saved.height} -> ${saved.urls.display}`);
    moved++;
  }

  for (const key of ['welcome_image', 'banner_image']) {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (!row || !row.value.startsWith('data:image')) continue;
    const buf = decode(row.value);
    if (!buf) {
      console.warn(`ข้าม (ถอดรหัสไม่ได้): ${key}`);
      skipped++;
      continue;
    }
    const saved = await saveUploadedImage(buf, `${key}.jpg`);
    // ไม่แตะ updatedAt เกินจำเป็น: อัปเดตค่าเป็นลิงก์ (เวอร์ชันของรูปเปลี่ยนตามเวลาที่ย้าย ทำให้ cache รีเฟรชพอดี)
    await prisma.siteSetting.update({ where: { key }, data: { value: saved.urls.display } });
    console.log(`${key}: ${(buf.length / 1024).toFixed(1)}KB ${saved.width}x${saved.height} -> ${saved.urls.display}`);
    moved++;
  }

  console.log(`เสร็จ: ย้าย ${moved} รายการ, ข้าม ${skipped} รายการ`);
}

main()
  .catch((e) => {
    console.error('ย้ายรูปไม่สำเร็จ:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
