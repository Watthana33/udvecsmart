import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { getFacebookStatus, syncFacebookPosts, testFacebookConnection, writeSetting } from '../services/facebookSync.js';

/** GET /api/settings/facebook */
export async function getFacebook(_req: AuthRequest, res: Response): Promise<void> {
  try {
    res.json({ status: 'success', data: await getFacebookStatus() });
  } catch (e) {
    console.error('getFacebook error:', e);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถอ่านการตั้งค่า Facebook ได้' });
  }
}

/** PUT /api/settings/facebook  { pageId?, token?, enabled? } — token ว่าง/ไม่ส่ง = คงของเดิม */
export async function updateFacebook(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { pageId, token, enabled } = req.body ?? {};
    if (pageId !== undefined) {
      const id = String(pageId).trim();
      if (id && !/^[A-Za-z0-9._-]{3,100}$/.test(id)) {
        res.status(400).json({ status: 'error', message: 'Page ID ใช้ได้เฉพาะตัวอักษร ตัวเลข จุด ขีด (3-100 ตัว)' });
        return;
      }
      await writeSetting('fb_page_id', id);
    }
    if (typeof token === 'string' && token.trim()) {
      const t = token.trim();
      if (t.length < 20 || t.length > 1000 || /\s/.test(t)) {
        res.status(400).json({ status: 'error', message: 'รูปแบบ token ไม่ถูกต้อง' });
        return;
      }
      await writeSetting('fb_page_token', t);
    }
    if (typeof enabled === 'boolean') await writeSetting('fb_enabled', String(enabled));
    res.json({ status: 'success', data: await getFacebookStatus() });
  } catch (e) {
    console.error('updateFacebook error:', e);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถบันทึกการตั้งค่า Facebook ได้' });
  }
}

/** DELETE /api/settings/facebook/token — ลบ token ที่เก็บไว้ และปิดการดึงอัตโนมัติ */
export async function clearFacebookToken(_req: AuthRequest, res: Response): Promise<void> {
  try {
    await writeSetting('fb_page_token', '');
    await writeSetting('fb_enabled', 'false');
    res.json({ status: 'success', data: await getFacebookStatus() });
  } catch (e) {
    console.error('clearFacebookToken error:', e);
    res.status(500).json({ status: 'error', message: 'ไม่สามารถลบ token ได้' });
  }
}

/** POST /api/settings/facebook/sync */
export async function syncFacebook(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const r = await syncFacebookPosts();
    res.json({ status: 'success', data: { ...r, ...(await getFacebookStatus()) } });
  } catch (e: any) {
    res.status(502).json({ status: 'error', message: e?.message ?? 'ดึงข่าวจาก Facebook ไม่สำเร็จ' });
  }
}

/** POST /api/settings/facebook/test  { pageId?, token? } — ทดสอบเชื่อมต่อโดยไม่บันทึก */
export async function testFacebook(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { pageId, token } = req.body ?? {};
    const data = await testFacebookConnection({
      pageId: typeof pageId === 'string' ? pageId : undefined,
      token: typeof token === 'string' ? token : undefined,
    });
    res.json({ status: 'success', data });
  } catch (e: any) {
    res.status(502).json({ status: 'error', message: e?.message ?? 'เชื่อมต่อ Facebook ไม่สำเร็จ' });
  }
}
