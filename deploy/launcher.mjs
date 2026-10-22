// launcher ของ backend — รันเป็นคำสั่งเริ่มต้นของ container (node /releases/launcher.mjs)
// หน้าที่: อ่านตัวชี้ current → db push → เริ่ม backend → รอ health; ถ้าไม่ขึ้นให้สลับกลับ previous เอง; ถ้า backend ปิดตัว (รีสตาร์ตตามคำสั่งอัปเดต) ให้เริ่มใหม่
// LAUNCHER_API = 1 (ต้องตรงกับค่าใน services/selfUpdate.ts)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const R = process.env.RELEASES_DIR || '/releases';
const PORT = process.env.PORT || '5000';
const READY_TIMEOUT_MS = Number(process.env.LAUNCHER_READY_TIMEOUT_MS || 120000);
const BAKED_DIR = '/app'; // โค้ดที่ฝังในอิมเมจ ใช้เมื่อยังไม่มี release เลย
const FAIL_FILE = path.join(R, '.updater', 'last-failure.json');

let child = null;
let stopping = false;
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    stopping = true;
    if (child) child.kill('SIGTERM'); else process.exit(0);
  });
}

const log = (m) => console.log(`[launcher] ${m}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const linkName = (name) => { try { return path.basename(fs.readlinkSync(path.join(R, name))); } catch { return null; } };

function atomicLink(name, version) {
  const link = path.join(R, name);
  const tmp = `${link}.new`;
  fs.rmSync(tmp, { force: true });
  fs.symlinkSync(path.join('versions', version), tmp);
  fs.renameSync(tmp, link);
}

function runOnce(cmd, args, cwd, env) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd, env, stdio: 'inherit' });
    child = p;
    p.on('error', () => resolve(-1));
    p.on('close', (code) => { child = null; resolve(code ?? -1); });
  });
}

async function healthy() {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/api/health`, { signal: AbortSignal.timeout(3000) });
    const j = await r.json().catch(() => null);
    return r.ok && j?.status === 'ok';
  } catch { return false; }
}

// เริ่ม backend ของเวอร์ชันนี้ คืน { ok:false, reason } ถ้าเริ่มไม่ขึ้น หรือ { ok:true } เมื่อทำงานจนปิดตัวลง
async function startVersion(version, dir) {
  const env = { ...process.env, APP_VERSION: version || 'baked', NODE_ENV: 'production' };
  log(`เริ่มเวอร์ชัน ${version || 'baked (ในอิมเมจ)'} จาก ${dir}`);

  const prisma = path.join(dir, 'node_modules', 'prisma', 'build', 'index.js');
  const push = await runOnce('node', [prisma, 'db', 'push', '--skip-generate'], dir, env);
  if (stopping) return { ok: true };
  if (push !== 0) return { ok: false, reason: `prisma db push ไม่สำเร็จ (exit ${push}) — โครงสร้างฐานข้อมูลไม่เข้ากับเวอร์ชันนี้` };

  const tsx = path.join(dir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const seed = await runOnce('node', [tsx, 'prisma/seed.ts'], dir, env);
  if (seed !== 0) log(`seed ไม่สำเร็จ (exit ${seed}) — ข้ามและไปต่อ`);
  if (stopping) return { ok: true };

  const srv = spawn('node', ['dist/server.js'], { cwd: dir, env, stdio: 'inherit' });
  child = srv;
  let exitCode = null;
  srv.on('close', (c) => { exitCode = c ?? -1; child = null; });
  srv.on('error', () => { exitCode = -1; child = null; });

  const end = Date.now() + READY_TIMEOUT_MS;
  let ready = false;
  while (Date.now() < end && exitCode === null && !stopping) {
    if (await healthy()) { ready = true; break; }
    await sleep(2000);
  }
  if (stopping) { if (child) child.kill('SIGTERM'); return { ok: true }; }
  if (!ready) {
    if (child) child.kill('SIGKILL');
    return { ok: false, reason: exitCode !== null ? `backend ปิดตัวทันทีหลังเริ่ม (exit ${exitCode})` : `backend ไม่ตอบ /api/health ภายใน ${Math.round(READY_TIMEOUT_MS / 1000)} วินาที` };
  }
  log(`เวอร์ชัน ${version || 'baked'} พร้อมใช้งาน`);
  while (exitCode === null) await sleep(1000);
  return { ok: true, startedAt: Date.now() };
}

async function main() {
  let crashes = 0;
  while (!stopping) {
    const cur = linkName('current');
    const dir = cur ? path.join(R, 'versions', cur, 'backend') : BAKED_DIR;
    const t0 = Date.now();
    const res = await startVersion(cur, dir);
    if (stopping) break;

    if (res.ok) {
      // ปิดตัวลงหลังใช้งานได้ (รีสตาร์ตตามคำสั่งอัปเดต หรือ crash) — ถ้าตายเร็วซ้ำ ๆ ให้ถอยเวลา
      crashes = Date.now() - t0 < 30000 ? crashes + 1 : 0;
      if (crashes >= 3) { log('backend ปิดตัวเร็วซ้ำ ๆ — ออกให้ docker จัดการ'); process.exit(1); }
      await sleep(1500);
      continue;
    }

    log(`เวอร์ชัน ${cur || 'baked'} เริ่มไม่ขึ้น: ${res.reason}`);
    const prev = linkName('previous');
    try {
      fs.mkdirSync(path.dirname(FAIL_FILE), { recursive: true });
      fs.writeFileSync(FAIL_FILE, JSON.stringify({ version: cur, reason: res.reason, at: new Date().toISOString() }, null, 2));
    } catch { /* บันทึกไม่ได้ก็ไม่เป็นไร */ }

    if (cur && prev && prev !== cur && fs.existsSync(path.join(R, 'versions', prev))) {
      log(`สลับกลับเป็นเวอร์ชันก่อนหน้า ${prev}`);
      atomicLink('current', prev);
      atomicLink('previous', cur);
      continue;
    }
    log('ไม่มีเวอร์ชันก่อนหน้าให้สลับกลับ — ออกให้ docker จัดการ');
    process.exit(1);
  }
  process.exit(0);
}

main();
