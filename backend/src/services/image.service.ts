import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import { ENV } from '../config/env.js';
import { prisma } from '../config/prisma.js';

/** ขนาดไฟล์ต้นฉบับสูงสุดต่อรูป */
export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

export type ImageVariant = 'thumb' | 'display' | 'original';
export const IMAGE_VARIANTS: ImageVariant[] = ['thumb', 'display', 'original'];

// รูปแสดงผล (หน้าเว็บ/แบนเนอร์/หน้าข่าวสาร) และรูปย่อ (การ์ดผู้บริหาร) — ต้นฉบับเก็บแยกไว้ไม่แตะต้อง
const DISPLAY_MAX_SIDE = 2400;
const THUMB_MAX_SIDE = 480;

// ชนิดที่รับ (ตามที่ sharp ถอดรหัสได้จริง — ไม่รับ SVG/TIFF/HEIC)
const FORMAT_INFO: Record<string, { mime: string; ext: string }> = {
  jpeg: { mime: 'image/jpeg', ext: 'jpg' },
  png: { mime: 'image/png', ext: 'png' },
  webp: { mime: 'image/webp', ext: 'webp' },
  gif: { mime: 'image/gif', ext: 'gif' },
  avif: { mime: 'image/avif', ext: 'avif' },
};

const execFileAsync = promisify(execFile);

// ไฟล์ HEIC/HEIF (รูปจาก iPhone) ใช้ HEVC ซึ่ง sharp ที่ติดมาถอดรหัสไม่ได้ → ใช้ heif-dec (libheif + libde265) แปลงเป็น JPEG
const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1']);

/** ตรวจหัวไฟล์ (ftyp box) ว่าเป็น HEIC/HEIF หรือไม่ (AVIF ใช้ brand avif/avis จึงไม่ถูกจับ) */
function isHeic(buf: Buffer): boolean {
  return buf.length > 12 && buf.toString('ascii', 4, 8) === 'ftyp' && HEIC_BRANDS.has(buf.toString('ascii', 8, 12));
}

/** แปลง HEIC → JPEG คุณภาพสูง (หมุนตามทิศทางถ่ายแล้ว) */
async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'heic-'));
  try {
    const input = path.join(dir, 'in.heic');
    const output = path.join(dir, 'out.jpg');
    await fs.writeFile(input, buffer);
    await execFileAsync('heif-dec', ['-q', '95', input, output], { timeout: 90_000 });
    return await fs.readFile(output);
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      throw new ImageUploadError('เซิร์ฟเวอร์ยังไม่รองรับไฟล์ HEIC กรุณาแปลงเป็น JPEG ก่อนอัปโหลด', 415);
    }
    throw new ImageUploadError('แปลงไฟล์ HEIC ไม่สำเร็จ ไฟล์อาจเสียหายหรือเป็นชนิดที่ไม่รองรับ');
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export class ImageUploadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export interface SavedImage {
  id: string;
  width: number;
  height: number;
  size: number;
  urls: Record<ImageVariant, string>;
}

export function imageUrls(id: string): Record<ImageVariant, string> {
  return {
    thumb: `/api/images/${id}/thumb`,
    display: `/api/images/${id}/display`,
    original: `/api/images/${id}/original`,
  };
}

function safeFileName(name: string | undefined, ext: string): string {
  const base = (name || 'image').replace(/\.[^./\\]+$/, '').replace(/[^\p{L}\p{M}\p{N}._ -]/gu, '').trim().slice(0, 80);
  return `${base || 'image'}.${ext}`;
}

/**
 * บันทึกรูปที่อัปโหลด: ตรวจว่าเป็นรูปจริง → เก็บไฟล์ต้นฉบับตามที่ได้รับ (ไม่ย่อ/ไม่บีบ) → สร้าง display + thumb
 */
export async function saveUploadedImage(inputBuffer: Buffer, originalName: string | undefined, uploadedById?: string): Promise<SavedImage> {
  let buffer = inputBuffer;
  if (buffer.length === 0) throw new ImageUploadError('ไม่พบไฟล์รูปภาพ');
  if (buffer.length > MAX_IMAGE_BYTES) throw new ImageUploadError('รูปภาพใหญ่เกิน 30MB', 413);

  // HEIC: เก็บไฟล์ HEIC ที่ส่งมาไว้เป็น source.heic แล้วใช้ JPEG ที่แปลงเป็น "ต้นฉบับ" ที่ใช้งาน/ดูภาพใหญ่ได้ในทุกเบราว์เซอร์
  let heicSource: Buffer | null = null;
  if (isHeic(buffer)) {
    heicSource = buffer;
    buffer = await convertHeicToJpeg(buffer);
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer, { limitInputPixels: 150_000_000 }).metadata();
  } catch {
    throw new ImageUploadError('ไฟล์นี้ไม่ใช่รูปภาพที่เปิดได้ หรือไฟล์เสียหาย');
  }

  // AVIF ถูกรายงานเป็น format "heif" ที่ compression = av1 (HEIC ของ iPhone เป็น hevc ซึ่งไม่รองรับ)
  let format = meta.format as string | undefined;
  if (format === 'heif') {
    if (meta.compression === 'av1') format = 'avif';
    else throw new ImageUploadError('ไม่รองรับไฟล์ HEIF ชนิดนี้ กรุณาแปลงเป็น JPEG หรือ PNG ก่อนอัปโหลด');
  }
  const info = format ? FORMAT_INFO[format] : undefined;
  if (!info || !meta.width || !meta.height) {
    throw new ImageUploadError('รองรับเฉพาะไฟล์ JPEG, PNG, WebP, GIF, AVIF และ HEIC');
  }

  const record = await prisma.uploadedImage.create({
    data: {
      originalName: safeFileName(originalName, info.ext),
      mime: info.mime,
      ext: info.ext,
      size: buffer.length,
      width: meta.width,
      height: meta.height,
      uploadedById: uploadedById ?? null,
    },
  });

  const dir = path.join(ENV.UPLOAD_DIR, record.id);
  try {
    await fs.mkdir(dir, { recursive: true });

    // 1) ต้นฉบับ: เขียนไบต์เดิมทั้งหมด
    await fs.writeFile(path.join(dir, `original.${info.ext}`), buffer);
    if (heicSource) await fs.writeFile(path.join(dir, 'source.heic'), heicSource);

    // 2) รูปแสดงผล / รูปย่อ: หมุนตาม EXIF, พื้นขาวแทนความโปร่งใส, JPEG
    const base = () => sharp(buffer, { limitInputPixels: 150_000_000 }).rotate().flatten({ background: '#ffffff' });
    await base()
      .resize({ width: DISPLAY_MAX_SIDE, height: DISPLAY_MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true, mozjpeg: true })
      .toFile(path.join(dir, 'display.jpg'));
    await base()
      .resize({ width: THUMB_MAX_SIDE, height: THUMB_MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toFile(path.join(dir, 'thumb.jpg'));
  } catch (err) {
    // สร้างไฟล์ไม่สำเร็จ → ล้างทิ้ง ไม่ให้เหลือรายการที่ไฟล์ไม่ครบ
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
    await prisma.uploadedImage.delete({ where: { id: record.id } }).catch(() => undefined);
    throw err;
  }

  return { id: record.id, width: meta.width, height: meta.height, size: buffer.length, urls: imageUrls(record.id) };
}

/** หา path ไฟล์ของรูปตามประเภท (ไม่พบ = null) */
export async function resolveImageFile(
  id: string,
  variant: ImageVariant
): Promise<{ file: string; mime: string; downloadName: string } | null> {
  const record = await prisma.uploadedImage.findUnique({ where: { id } });
  if (!record) return null;
  const dir = path.join(ENV.UPLOAD_DIR, record.id);
  if (variant === 'original') {
    return { file: path.join(dir, `original.${record.ext}`), mime: record.mime, downloadName: record.originalName };
  }
  return { file: path.join(dir, `${variant}.jpg`), mime: 'image/jpeg', downloadName: `${variant}-${record.originalName.replace(/\.[^.]+$/, '')}.jpg` };
}
