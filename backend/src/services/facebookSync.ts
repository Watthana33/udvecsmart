import { prisma } from '../config/prisma.js';
import { NewsCategory } from '@prisma/client';

const KEYS = ['fb_page_id', 'fb_page_token', 'fb_enabled', 'fb_last_sync', 'fb_last_error'] as const;
export const SYNC_INTERVAL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 15_000;

async function readSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: [...KEYS] } } });
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function writeSetting(key: string, value: string): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value, description: 'Facebook' },
  });
}

/** สถานะสำหรับหน้าหลังบ้าน (ไม่ส่ง token กลับ) */
export async function getFacebookStatus() {
  const s = await readSettings();
  const imported = await prisma.news.count({ where: { fbPostId: { not: null } } });
  return {
    pageId: s.fb_page_id ?? '',
    hasToken: !!s.fb_page_token,
    enabled: s.fb_enabled === 'true',
    lastSync: s.fb_last_sync ?? '',
    lastError: s.fb_last_error ?? '',
    imported,
  };
}

interface FbPost {
  id: string;
  message?: string;
  full_picture?: string;
  permalink_url?: string;
  created_time?: string;
}

const httpsOnly = (u?: string) => (u && u.startsWith('https://') ? u : null);

/** ดึงโพสต์ล่าสุดของเพจเข้าตารางข่าว — โพสต์ที่มีอยู่แล้ว (รวมที่ซ่อนไว้) ไม่ถูกแก้ซ้ำ */
export async function syncFacebookPosts(): Promise<{ added: number; fetched: number }> {
  const s = await readSettings();
  const pageId = (s.fb_page_id ?? '').trim();
  const token = s.fb_page_token ?? '';
  if (!pageId || !token) throw new Error('ยังไม่ได้ตั้งค่า Page ID หรือ token');

  try {
    const url =
      `https://graph.facebook.com/${encodeURIComponent(pageId)}/posts` +
      '?fields=id,message,full_picture,permalink_url,created_time&limit=20';
    // ส่ง token ทาง header ไม่ใส่ใน URL กันหลุดลง log
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const body: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const code = body?.error?.code ? ` (code ${body.error.code})` : '';
      throw new Error(`Facebook ตอบ HTTP ${resp.status}: ${body?.error?.message ?? 'ไม่ทราบสาเหตุ'}${code}`);
    }

    const posts: FbPost[] = Array.isArray(body.data) ? body.data : [];
    let added = 0;
    // เก่า → ใหม่ เพื่อให้ลำดับเวลาถูก
    for (const p of [...posts].reverse()) {
      const text = (p.message ?? '').trim();
      if (!p.id || !text) continue; // ข้ามโพสต์ที่ไม่มีข้อความ
      const exists = await prisma.news.findUnique({ where: { fbPostId: p.id }, select: { id: true } });
      if (exists) continue;
      const firstLine = text.split('\n')[0].trim();
      const title = firstLine.length > 120 ? firstLine.slice(0, 117) + '...' : firstLine;
      await prisma.news.create({
        data: {
          title,
          content: text,
          coverImageUrl: httpsOnly(p.full_picture),
          linkUrl: httpsOnly(p.permalink_url),
          category: NewsCategory.ANNOUNCEMENT,
          isPublished: true,
          fbPostId: p.id,
          createdAt: p.created_time ? new Date(p.created_time) : undefined,
        },
      });
      added++;
    }
    await writeSetting('fb_last_sync', new Date().toISOString());
    await writeSetting('fb_last_error', '');
    return { added, fetched: posts.length };
  } catch (e: any) {
    const msg = String(e?.message ?? e).slice(0, 300);
    await writeSetting('fb_last_error', msg).catch(() => {});
    throw new Error(msg);
  }
}

/** ทดสอบการเชื่อมต่อ (ไม่บันทึกอะไร) — ใช้ค่าจากฟอร์มก่อน ถ้าว่างใช้ค่าที่บันทึกไว้ */
export async function testFacebookConnection(input: { pageId?: string; token?: string }) {
  const s = await readSettings();
  const pageId = (input.pageId?.trim() || s.fb_page_id || '').trim();
  const token = input.token?.trim() || s.fb_page_token || '';
  if (!pageId) throw new Error('ยังไม่ได้ใส่ Page ID');
  if (!token) throw new Error('ยังไม่ได้ใส่ token');

  const call = async (path: string) => {
    const resp = await fetch(`https://graph.facebook.com/${encodeURIComponent(pageId)}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const body: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const code = body?.error?.code ? ` (code ${body.error.code})` : '';
      throw new Error(`Facebook ตอบ HTTP ${resp.status}: ${body?.error?.message ?? 'ไม่ทราบสาเหตุ'}${code}`);
    }
    return body;
  };

  const page = await call('?fields=name');
  const posts = await call('/posts?fields=id&limit=5');
  return { pageName: String(page.name ?? pageId), postsReadable: true, recentPosts: Array.isArray(posts.data) ? posts.data.length : 0 };
}

let timer: NodeJS.Timeout | null = null;
let running = false;

/** ตั้งเวลาดึงอัตโนมัติ — ทำงานเฉพาะเมื่อเปิดใช้และมี Page ID + token */
export function startFacebookScheduler(): void {
  if (timer) return;
  timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const s = await readSettings();
      if (s.fb_enabled === 'true' && s.fb_page_id && s.fb_page_token) await syncFacebookPosts();
    } catch (e: any) {
      console.warn('facebook sync failed:', e?.message);
    } finally {
      running = false;
    }
  }, SYNC_INTERVAL_MS);
  timer.unref();
}
