// ระบบอัปเดตเวอร์ชันเว็บด้วยตัวเอง (ไม่ต้องให้แอดมิน Docker rebuild)
// หลักการ: เวอร์ชันที่ build แล้วเก็บเป็นโฟลเดอร์ใน RELEASES_DIR/versions/<tag> ตัวชี้ `current` บอกว่าใช้เวอร์ชันไหน
//   - backend รันผ่าน launcher.mjs (อ่านตัวชี้ current ตอนเริ่ม และสลับกลับเวอร์ชันเดิมเองถ้าเวอร์ชันใหม่เริ่มไม่ขึ้น)
//   - nginx ของ frontend อ่านไฟล์เว็บจาก RELEASES_DIR/current/frontend
// อัปเกรด = ดาวน์โหลดไฟล์ release จาก GitHub → ตรวจ checksum → แตกไฟล์ → ทดสอบเริ่มเวอร์ชันใหม่ → สลับตัวชี้ → รีสตาร์ต backend
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip, createGunzip } from 'node:zlib';
import { prisma } from '../config/prisma.js';

const RELEASES_DIR = process.env.RELEASES_DIR || '/releases';
const ENABLED = process.env.UPDATER_MODE === 'launcher';
const REPO = process.env.GITHUB_REPO || 'Watthana33/udvecsmart';
const GITHUB_API = (process.env.GITHUB_API_BASE || 'https://api.github.com').replace(/\/$/, '');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const LAUNCHER_API = 1; // ถ้า release ต้องการ launcher รุ่นใหม่กว่านี้ ต้องให้แอดมินส่วนกลางอัปเดต launcher.mjs
const KEEP_VERSIONS = 3;
const KEEP_BACKUPS = 5;
const MIN_FREE_BYTES = 1.5 * 1024 * 1024 * 1024;
const SMOKE_PORT = 5099;
const TAG_RE = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;

const P = {
  versions: path.join(RELEASES_DIR, 'versions'),
  current: path.join(RELEASES_DIR, 'current'),
  previous: path.join(RELEASES_DIR, 'previous'),
  tmp: path.join(RELEASES_DIR, 'tmp'),
  backups: path.join(RELEASES_DIR, 'backups'),
  data: path.join(RELEASES_DIR, '.updater'),
  job: path.join(RELEASES_DIR, '.updater', 'job.json'),
  state: path.join(RELEASES_DIR, '.updater', 'state.json'),
  history: path.join(RELEASES_DIR, '.updater', 'history.json'),
  lastFailure: path.join(RELEASES_DIR, '.updater', 'last-failure.json'),
};

// ---------- ชนิดข้อมูล ----------
export interface JobStep { key: string; label: string; status: 'running' | 'done' | 'failed'; detail: string }
export interface UpdateJob {
  id: string;
  type: 'upgrade' | 'rollback';
  status: 'running' | 'restarting' | 'success' | 'failed' | 'rolled_back';
  from: string | null;
  to: string;
  startedAt: string;
  finishedAt: string | null;
  steps: JobStep[];
  log: string[];
  warnings: string[];
  error: string | null;
  backupFile?: string | null;
}
export interface HealthCheck { key: string; label: string; ok: boolean; detail: string }

// ---------- ไฟล์สถานะ ----------
async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fsp.readFile(file, 'utf8')) as T; } catch { return fallback; }
}
async function writeJson(file: string, value: unknown): Promise<void> {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(value, null, 2));
  await fsp.rename(tmp, file);
}

let busy = false;
let job: UpdateJob | null = null;

async function loadJob(): Promise<UpdateJob | null> {
  if (!job) job = await readJson<UpdateJob | null>(P.job, null);
  return job;
}
async function saveJob(): Promise<void> { if (job) await writeJson(P.job, job); }

function logLine(line: string): void {
  if (!job) return;
  job.log.push(`${new Date().toISOString().slice(11, 19)} ${line}`.slice(0, 400));
  if (job.log.length > 200) job.log.splice(0, job.log.length - 200);
}

async function runStep<T>(key: string, label: string, fn: () => Promise<T>, detailOf?: (v: T) => string): Promise<T> {
  const s: JobStep = { key, label, status: 'running', detail: '' };
  job!.steps.push(s);
  logLine(`>> ${label}`);
  await saveJob();
  try {
    const v = await fn();
    s.status = 'done';
    s.detail = detailOf ? detailOf(v) : '';
    await saveJob();
    return v;
  } catch (e: any) {
    s.status = 'failed';
    s.detail = e.message;
    logLine(`!! ${label}: ${e.message}`);
    await saveJob();
    throw e;
  }
}

async function finishJob(status: UpdateJob['status'], error: string | null = null): Promise<void> {
  if (!job) return;
  job.status = status;
  job.error = error;
  job.finishedAt = new Date().toISOString();
  await saveJob();
  const hist = await readJson<any[]>(P.history, []);
  hist.unshift({ id: job.id, type: job.type, status, from: job.from, to: job.to, startedAt: job.startedAt, finishedAt: job.finishedAt, error });
  await writeJson(P.history, hist.slice(0, 30));
}

// ---------- เวอร์ชันบนดิสก์ ----------
async function linkTarget(name: string): Promise<string | null> {
  try { return path.basename(await fsp.readlink(name)); } catch { return null; }
}
export const currentVersion = () => linkTarget(P.current);
const previousVersion = () => linkTarget(P.previous);

async function atomicLink(linkPath: string, version: string): Promise<void> {
  const tmp = `${linkPath}.new`;
  await fsp.rm(tmp, { force: true });
  await fsp.symlink(path.join('versions', version), tmp);
  await fsp.rename(tmp, linkPath);
}

async function readManifest(version: string): Promise<any | null> {
  return readJson<any | null>(path.join(P.versions, version, 'manifest.json'), null);
}

async function listVersions(): Promise<string[]> {
  try {
    const names = (await fsp.readdir(P.versions)).filter((n) => TAG_RE.test(n));
    return names.sort((a, b) => cmpSemver(b, a));
  } catch { return []; }
}

function parseSemver(tag: string): number[] {
  const m = tag.replace(/^v/, '').split('-')[0].split('.').map((n) => Number(n) || 0);
  return [m[0] || 0, m[1] || 0, m[2] || 0];
}
function cmpSemver(a: string, b: string): number {
  const x = parseSemver(a);
  const y = parseSemver(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

// ---------- ตรวจสุขภาพระบบ ----------
function pgEnv(): NodeJS.ProcessEnv {
  const url = new URL(process.env.DATABASE_URL || '');
  return {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || '5432',
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: decodeURIComponent(url.pathname.replace(/^\//, '')),
  };
}

function exec(cmd: string, args: string[], opts: { env?: NodeJS.ProcessEnv; cwd?: string; timeoutMs?: number; input?: string } = {}): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { env: opts.env || process.env, cwd: opts.cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = opts.timeoutMs ? setTimeout(() => child.kill('SIGKILL'), opts.timeoutMs) : null;
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (e) => { if (timer) clearTimeout(timer); resolve({ code: -1, stdout, stderr: String(e) }); });
    child.on('close', (code) => { if (timer) clearTimeout(timer); resolve({ code: code ?? -1, stdout: stdout.trim(), stderr: stderr.trim() }); });
    child.stdin.end(opts.input ?? '');
  });
}

async function freeBytes(dir: string): Promise<number> {
  const s = await fsp.statfs(dir);
  return Number(s.bavail) * Number(s.bsize);
}

export async function healthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [];
  try {
    await prisma.$queryRaw`SELECT 1`;
    const n = await prisma.institution.count();
    checks.push({ key: 'db', label: 'เชื่อมฐานข้อมูลและอ่านข้อมูลได้', ok: true, detail: `สถานศึกษา ${n} แห่ง` });
  } catch (e: any) {
    checks.push({ key: 'db', label: 'เชื่อมฐานข้อมูลและอ่านข้อมูลได้', ok: false, detail: e.message.slice(0, 200) });
  }
  const cur = await currentVersion();
  checks.push({ key: 'current', label: 'มีเวอร์ชันที่ใช้งานอยู่ในระบบอัปเดต', ok: !!cur, detail: cur || 'ยังไม่มี (ยังใช้โค้ดที่ฝังในอิมเมจ)' });
  const front = cur ? fs.existsSync(path.join(P.current, 'frontend', 'index.html')) : false;
  checks.push({ key: 'frontend', label: 'ไฟล์หน้าเว็บของเวอร์ชันปัจจุบัน', ok: front, detail: front ? 'พบ index.html' : 'ไม่พบ frontend/index.html' });
  try {
    await fsp.mkdir(P.tmp, { recursive: true });
    const probe = path.join(P.tmp, `.probe-${process.pid}`);
    await fsp.writeFile(probe, 'ok');
    await fsp.rm(probe);
    const free = await freeBytes(RELEASES_DIR);
    checks.push({ key: 'disk', label: 'เขียนไฟล์ได้และพื้นที่ดิสก์พอ', ok: free >= MIN_FREE_BYTES, detail: `ว่าง ${(free / 1024 ** 3).toFixed(1)} GB (ต้องการ ≥ ${(MIN_FREE_BYTES / 1024 ** 3).toFixed(1)} GB)` });
  } catch (e: any) {
    checks.push({ key: 'disk', label: 'เขียนไฟล์ได้และพื้นที่ดิสก์พอ', ok: false, detail: e.message.slice(0, 200) });
  }
  const dump = await exec('pg_dump', ['--version'], { timeoutMs: 8000 });
  checks.push({ key: 'pgdump', label: 'มีเครื่องมือสำรองฐานข้อมูล (pg_dump)', ok: dump.code === 0, detail: dump.code === 0 ? dump.stdout : 'ไม่พบ pg_dump ในอิมเมจ backend' });
  const lastFail = await readJson<any | null>(P.lastFailure, null);
  if (lastFail && lastFail.version === cur) {
    checks.push({ key: 'lastfail', label: 'เวอร์ชันนี้เคยเริ่มไม่ขึ้นมาก่อน', ok: false, detail: lastFail.reason });
  }
  return checks;
}

// ---------- ติดต่อ GitHub ----------
interface ReleaseInfo {
  tag: string;
  name: string;
  notes: string;
  publishedAt: string;
  archive: { name: string; url: string; size: number; sha256Url: string | null; sha256: string | null } | null;
  manifestUrl: string | null;
  manifest: any | null;
}

function archTag(): string {
  return os.arch() === 'arm64' ? 'arm64' : 'amd64';
}

async function gh(url: string, accept = 'application/vnd.github+json', timeoutMs = 20000): Promise<Response> {
  return fetch(url, {
    headers: { 'User-Agent': 'udvec-updater', Accept: accept, ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}) },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  const res = await gh(`${GITHUB_API}/repos/${REPO}/releases/latest`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ตอบกลับ HTTP ${res.status}${res.status === 403 ? ' (อาจเกินโควต้าเรียก API ชั่วคราว)' : ''}`);
  const j: any = await res.json();
  const tag: string = j.tag_name;
  if (!TAG_RE.test(tag)) throw new Error(`ชื่อแท็ก "${tag}" ไม่ตรงรูปแบบ vX.Y.Z`);
  const assets: any[] = j.assets || [];
  const archName = `udvec-release-${tag}-linux-${archTag()}.tar.gz`;
  const a = assets.find((x) => x.name === archName);
  const sha = assets.find((x) => x.name === `${archName}.sha256`);
  const man = assets.find((x) => x.name === `udvec-manifest-${tag}.json`);
  let manifest: any = null;
  if (man) {
    try {
      const mr = await gh(man.browser_download_url, '*/*');
      if (mr.ok) manifest = await mr.json();
    } catch { /* ไม่มี manifest ก็ยังแสดงรุ่นได้ */ }
  }
  return {
    tag,
    name: j.name || tag,
    notes: j.body || '',
    publishedAt: j.published_at || '',
    archive: a ? {
      name: a.name,
      url: a.browser_download_url,
      size: a.size,
      sha256Url: sha ? sha.browser_download_url : null,
      sha256: typeof a.digest === 'string' && a.digest.startsWith('sha256:') ? a.digest.slice(7) : null,
    } : null,
    manifestUrl: man ? man.browser_download_url : null,
    manifest,
  };
}

// ---------- สถานะ/ตรวจเวอร์ชัน ----------
export async function getStatus() {
  if (!ENABLED) {
    return { enabled: false, reason: 'ยังไม่ได้ตั้งค่าระบบอัปเดต (ต้องให้แอดมินส่วนกลางตั้งค่า compose ครั้งเดียว ตามคู่มือ deploy/central-setup/README.md)' };
  }
  const cur = await currentVersion();
  const prev = await previousVersion();
  const state = await readJson<any>(P.state, {});
  return {
    enabled: true,
    running: process.env.APP_VERSION || cur,
    current: cur ? { version: cur, manifest: await readManifest(cur) } : null,
    previous: prev && prev !== cur ? prev : null,
    versions: await listVersions(),
    job: await loadJob(),
    busy,
    rollback: {
      available: !!(prev && prev !== cur),
      to: prev && prev !== cur ? prev : null,
      hasBackup: !!(state.lastUpgrade?.backupFile && fs.existsSync(state.lastUpgrade.backupFile) && state.lastUpgrade.to === cur),
    },
    history: (await readJson<any[]>(P.history, [])).slice(0, 10),
  };
}

export async function checkForUpdate() {
  if (!ENABLED) throw new Error('ยังไม่ได้ตั้งค่าระบบอัปเดต');
  const cur = await currentVersion();
  const checks = await healthChecks();
  let latest: ReleaseInfo | null = null;
  let fetchError: string | null = null;
  try {
    latest = await fetchLatestRelease();
  } catch (e: any) {
    fetchError = `ติดต่อ GitHub ไม่ได้: ${e.cause?.code || e.message}`;
  }
  let status: 'unknown' | 'no_release' | 'up_to_date' | 'update_available' | 'ahead' = 'unknown';
  const blockers: string[] = [];
  if (latest) {
    status = !cur ? 'update_available' : cmpSemver(latest.tag, cur) > 0 ? 'update_available' : cmpSemver(latest.tag, cur) === 0 ? 'up_to_date' : 'ahead';
    if (status === 'update_available') {
      if (!latest.archive) blockers.push(`release ${latest.tag} ไม่มีไฟล์สำหรับเครื่องนี้ (linux-${archTag()})`);
      else if (!latest.archive.sha256 && !latest.archive.sha256Url) blockers.push('release ไม่มีไฟล์ checksum (.sha256) — ไม่ติดตั้งเพื่อความปลอดภัย');
      const m = latest.manifest;
      if (m?.needsRebuild) blockers.push(`เวอร์ชันนี้ต้องให้แอดมินส่วนกลางดำเนินการก่อน: ${m.needsRebuildReason || 'rebuild image/แก้ compose'}`);
      if (m && Number(m.launcherApi) > LAUNCHER_API) blockers.push('เวอร์ชันนี้ต้องใช้ launcher รุ่นใหม่ — ให้แอดมินส่วนกลางอัปเดตไฟล์ launcher.mjs');
    }
  } else if (!fetchError) {
    status = 'no_release';
  }
  return {
    current: cur,
    latest: latest ? { tag: latest.tag, name: latest.name, notes: latest.notes, publishedAt: latest.publishedAt, sizeMb: latest.archive ? Math.round(latest.archive.size / 1024 / 1024) : null, manifest: latest.manifest } : null,
    updateStatus: status,
    blockers,
    fetchError,
    checks,
    ready: checks.every((c) => c.ok || c.key === 'current'),
    checkedAt: new Date().toISOString(),
  };
}

// ---------- ดาวน์โหลด/ตรวจ/แตกไฟล์ ----------
async function download(url: string, dest: string, onProgress: (done: number, total: number) => void): Promise<{ sha256: string; bytes: number }> {
  const res = await gh(url, '*/*', 15 * 60 * 1000);
  if (!res.ok || !res.body) throw new Error(`ดาวน์โหลดไม่สำเร็จ HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const hash = crypto.createHash('sha256');
  let done = 0;
  let lastReport = 0;
  const src = Readable.fromWeb(res.body as any);
  src.on('data', (chunk: Buffer) => {
    hash.update(chunk);
    done += chunk.length;
    if (Date.now() - lastReport > 1500) { lastReport = Date.now(); onProgress(done, total); }
  });
  await pipeline(src, fs.createWriteStream(dest));
  return { sha256: hash.digest('hex'), bytes: done };
}

async function expectedSha(r: ReleaseInfo): Promise<string> {
  if (r.archive!.sha256) return r.archive!.sha256;
  const res = await gh(r.archive!.sha256Url!, '*/*');
  if (!res.ok) throw new Error(`อ่านไฟล์ checksum ไม่ได้ HTTP ${res.status}`);
  const m = (await res.text()).trim().match(/^[0-9a-fA-F]{64}/);
  if (!m) throw new Error('รูปแบบไฟล์ checksum ไม่ถูกต้อง');
  return m[0].toLowerCase();
}

async function extractSafely(archive: string, dest: string): Promise<void> {
  const list = await exec('tar', ['-tzf', archive], { timeoutMs: 120000 });
  if (list.code !== 0) throw new Error(`อ่านไฟล์บีบอัดไม่ได้: ${list.stderr.slice(0, 200)}`);
  for (const entry of list.stdout.split('\n')) {
    if (entry.startsWith('/') || entry.split('/').includes('..')) throw new Error(`ไฟล์ release มีพาธอันตราย: ${entry.slice(0, 100)}`);
  }
  await fsp.mkdir(dest, { recursive: true });
  const x = await exec('tar', ['-xzof', archive, '-C', dest], { timeoutMs: 10 * 60 * 1000 });
  if (x.code !== 0) throw new Error(`แตกไฟล์ไม่สำเร็จ: ${x.stderr.slice(0, 200)}`);
}

async function smokeTest(version: string, root: string): Promise<string> {
  const dir = path.join(root, 'backend');
  const child = spawn('node', ['dist/server.js'], {
    cwd: dir,
    env: { ...process.env, PORT: String(SMOKE_PORT), APP_VERSION: version, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  let exited: number | null = null;
  child.on('close', (c) => { exited = c ?? -1; });
  try {
    const end = Date.now() + 45000;
    while (Date.now() < end) {
      if (exited !== null) throw new Error(`เวอร์ชันใหม่เริ่มไม่ขึ้น (exit ${exited}): ${out.slice(-300)}`);
      try {
        const r = await fetch(`http://127.0.0.1:${SMOKE_PORT}/api/health`, { signal: AbortSignal.timeout(3000) });
        const j: any = await r.json().catch(() => null);
        if (r.ok && j?.status === 'ok') return 'เริ่มทำงานและตอบ /api/health ได้';
      } catch { /* ยังไม่พร้อม */ }
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error(`เวอร์ชันใหม่ไม่ตอบ health ภายใน 45 วินาที: ${out.slice(-300)}`);
  } finally {
    if (exited === null) child.kill('SIGTERM');
  }
}

// ---------- สำรอง/กู้ฐานข้อมูล ----------
async function backupDb(label: string): Promise<{ file: string; bytes: number }> {
  await fsp.mkdir(P.backups, { recursive: true });
  const file = path.join(P.backups, `db-${new Date().toISOString().replace(/[:.]/g, '-')}-${label}.sql.gz`);
  const child = spawn('pg_dump', ['--no-owner', '--no-privileges'], { env: pgEnv(), stdio: ['ignore', 'pipe', 'pipe'] });
  let err = '';
  child.stderr.on('data', (d) => { err += d; });
  const closed = new Promise<number>((resolve) => child.on('close', (c) => resolve(c ?? -1)));
  await pipeline(child.stdout, createGzip(), fs.createWriteStream(file));
  const code = await closed;
  const bytes = fs.existsSync(file) ? fs.statSync(file).size : 0;
  if (code !== 0 || bytes < 200) {
    await fsp.rm(file, { force: true });
    throw new Error(`สำรองฐานข้อมูลไม่สำเร็จ: ${err.slice(0, 200) || `exit ${code}`}`);
  }
  const all = (await fsp.readdir(P.backups)).filter((f) => /^db-.*\.sql\.gz$/.test(f)).sort();
  for (const old of all.slice(0, Math.max(0, all.length - KEEP_BACKUPS))) await fsp.rm(path.join(P.backups, old), { force: true });
  return { file, bytes };
}

async function restoreDb(file: string): Promise<void> {
  if (!file || !fs.existsSync(file)) throw new Error('ไม่พบไฟล์สำรองฐานข้อมูล');
  const reset = await exec('psql', ['-v', 'ON_ERROR_STOP=1', '-c', 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'], { env: pgEnv(), timeoutMs: 60000 });
  if (reset.code !== 0) throw new Error(`ล้างฐานข้อมูลก่อนกู้คืนไม่สำเร็จ: ${reset.stderr.slice(0, 200)}`);
  const child = spawn('psql', ['-v', 'ON_ERROR_STOP=1', '-q'], { env: pgEnv(), stdio: ['pipe', 'ignore', 'pipe'] });
  let err = '';
  child.stderr.on('data', (d) => { err += d; });
  const closed = new Promise<number>((resolve) => child.on('close', (c) => resolve(c ?? -1)));
  await pipeline(fs.createReadStream(file), createGunzip(), child.stdin);
  const code = await closed;
  if (code !== 0) throw new Error(`กู้คืนฐานข้อมูลไม่สำเร็จ: ${err.slice(0, 300)}`);
}

async function pruneVersions(): Promise<void> {
  const keep = new Set<string>([(await currentVersion()) || '', (await previousVersion()) || '']);
  const all = await listVersions();
  for (const v of all.slice(0, KEEP_VERSIONS)) keep.add(v);
  for (const v of all) if (!keep.has(v)) await fsp.rm(path.join(P.versions, v), { recursive: true, force: true });
}

// ขอให้ launcher เริ่ม backend ใหม่ (ส่ง SIGTERM ให้ตัวเอง → ปิดอย่างนุ่มนวล → launcher อ่านตัวชี้ current ใหม่แล้วเริ่มเอง)
function requestRestart(): void {
  setTimeout(() => process.kill(process.pid, 'SIGTERM'), 1500);
}

// ---------- อัปเกรด ----------
function startJob(type: UpdateJob['type'], from: string | null, to: string): void {
  job = { id: crypto.randomUUID(), type, status: 'running', from, to, startedAt: new Date().toISOString(), finishedAt: null, steps: [], log: [], warnings: [], error: null };
}

async function doUpgrade(expectedTag: string): Promise<void> {
  const from = await currentVersion();
  startJob('upgrade', from, expectedTag);
  await saveJob();
  const incoming = path.join(P.tmp, `incoming-${expectedTag}`);
  const archivePath = path.join(P.tmp, `${expectedTag}.tar.gz`);
  try {
    await runStep('preflight', 'ตรวจความพร้อมของระบบก่อนอัปเดต', async () => {
      const checks = await healthChecks();
      const bad = checks.filter((c) => !c.ok && c.key !== 'current' && c.key !== 'lastfail');
      if (bad.length) throw new Error(`ยังไม่พร้อมอัปเดต: ${bad.map((c) => `${c.label} (${c.detail})`).join('; ')}`);
      return checks.length;
    }, (n) => `ผ่าน ${n} รายการ`);

    const latest = await runStep('check', 'ตรวจเวอร์ชันล่าสุดบน GitHub', async () => {
      const r = await fetchLatestRelease();
      if (!r) throw new Error('ไม่พบ release บน GitHub');
      if (r.tag !== expectedTag) throw new Error(`เวอร์ชันล่าสุดตอนนี้คือ ${r.tag} ไม่ใช่ ${expectedTag} — ตรวจสอบเวอร์ชันใหม่อีกครั้ง`);
      if (!r.archive) throw new Error(`release ${r.tag} ไม่มีไฟล์สำหรับ linux-${archTag()}`);
      if (r.manifest?.needsRebuild) throw new Error(`เวอร์ชันนี้ต้องให้แอดมินส่วนกลางดำเนินการก่อน: ${r.manifest.needsRebuildReason || 'rebuild image/แก้ compose'}`);
      if (r.manifest && Number(r.manifest.launcherApi) > LAUNCHER_API) throw new Error('เวอร์ชันนี้ต้องใช้ launcher รุ่นใหม่ — ให้แอดมินส่วนกลางอัปเดต launcher.mjs');
      if (cmpSemver(r.tag, from || 'v0.0.0') <= 0 && from) throw new Error(`${r.tag} ไม่ใหม่กว่าเวอร์ชันที่ใช้อยู่ (${from})`);
      return r;
    }, (r) => r.tag);

    await fsp.rm(incoming, { recursive: true, force: true });
    await fsp.mkdir(P.tmp, { recursive: true });

    const dl = await runStep('download', `ดาวน์โหลดไฟล์ ${latest.archive!.name}`, async () => {
      const d = await download(latest.archive!.url, archivePath, (done, total) => {
        job!.steps[job!.steps.length - 1].detail = total ? `${Math.round((done / total) * 100)}% (${(done / 1048576).toFixed(0)}/${(total / 1048576).toFixed(0)} MB)` : `${(done / 1048576).toFixed(0)} MB`;
        saveJob().catch(() => {});
      });
      return d;
    }, (d) => `${(d.bytes / 1048576).toFixed(1)} MB`);

    await runStep('verify_sum', 'ตรวจความถูกต้องของไฟล์ (SHA-256)', async () => {
      const want = await expectedSha(latest);
      if (want !== dl.sha256) throw new Error('checksum ไม่ตรง — ไฟล์เสียหายหรือถูกแก้ไข ยกเลิกการอัปเดต');
    });

    await runStep('extract', 'แตกไฟล์และตรวจองค์ประกอบ', async () => {
      await extractSafely(archivePath, incoming);
      const need = ['manifest.json', 'backend/dist/server.js', 'backend/prisma/schema.prisma', 'backend/node_modules', 'frontend/index.html'];
      const missing = need.filter((f) => !fs.existsSync(path.join(incoming, f)));
      if (missing.length) throw new Error(`ไฟล์ release ไม่ครบ: ขาด ${missing.join(', ')}`);
      const m = JSON.parse(await fsp.readFile(path.join(incoming, 'manifest.json'), 'utf8'));
      if (m.version !== expectedTag) throw new Error(`manifest.version (${m.version}) ไม่ตรงกับแท็ก ${expectedTag}`);
      if (m.needsRebuild) throw new Error(`เวอร์ชันนี้ต้องให้แอดมินส่วนกลางดำเนินการก่อน: ${m.needsRebuildReason || 'rebuild image/แก้ compose'}`);
    });
    await fsp.rm(archivePath, { force: true });

    await runStep('smoke', 'ทดลองเริ่มเวอร์ชันใหม่ (ยังไม่สลับ เว็บเดิมใช้งานต่อได้)', () => smokeTest(expectedTag, incoming), (d) => d);

    const backup = await runStep('backup', 'สำรองฐานข้อมูล', () => backupDb(`${from || 'baked'}-to-${expectedTag}`), (b) => `${path.basename(b.file)} (${(b.bytes / 1024).toFixed(0)} KB)`);
    job!.backupFile = backup.file;

    await runStep('switch', 'สลับไปใช้เวอร์ชันใหม่และรีสตาร์ต', async () => {
      // วางโฟลเดอร์เวอร์ชันใหม่เข้าที่ (ถ้ามีโฟลเดอร์แท็กเดียวกันค้างจากการย้อนคืนครั้งก่อน ให้แทนที่) แล้วค่อยสลับตัวชี้
      await fsp.mkdir(P.versions, { recursive: true });
      const target = path.join(P.versions, expectedTag);
      if (expectedTag === from) throw new Error('เวอร์ชันใหม่ซ้ำกับเวอร์ชันที่ใช้อยู่');
      await fsp.rm(target, { recursive: true, force: true });
      await fsp.rename(incoming, target);
      if (from) await atomicLink(P.previous, from);
      await atomicLink(P.current, expectedTag);
      const state = await readJson<any>(P.state, {});
      state.lastUpgrade = { from, to: expectedTag, backupFile: backup.file, at: new Date().toISOString() };
      await writeJson(P.state, state);
      job!.status = 'restarting';
      logLine('สลับตัวชี้ current แล้ว — กำลังรีสตาร์ต backend (launcher จะตรวจสุขภาพและสลับกลับเองถ้าไม่ผ่าน)');
      await saveJob();
    });
    requestRestart();
  } catch (e: any) {
    await fsp.rm(incoming, { recursive: true, force: true }).catch(() => {});
    await fsp.rm(archivePath, { force: true }).catch(() => {});
    await finishJob('failed', `${e.message} (เว็บเดิมยังทำงานตามปกติ ไม่มีอะไรเปลี่ยน)`);
  }
}

// ---------- ย้อนคืน ----------
async function doRollback(withDb: boolean): Promise<void> {
  const cur = await currentVersion();
  const prev = await previousVersion();
  startJob('rollback', cur, prev || '');
  await saveJob();
  try {
    await runStep('rb_check', 'ตรวจเวอร์ชันก่อนหน้า', async () => {
      if (!prev || prev === cur) throw new Error('ไม่มีเวอร์ชันก่อนหน้าให้ย้อนคืน');
      if (!fs.existsSync(path.join(P.versions, prev, 'backend', 'dist', 'server.js'))) throw new Error(`ไม่พบไฟล์ของเวอร์ชัน ${prev} บนดิสก์`);
      return prev;
    }, (v) => v);
    if (withDb) {
      const state = await readJson<any>(P.state, {});
      const up = state.lastUpgrade;
      if (!up || up.to !== cur || !up.backupFile) throw new Error('ไม่มีไฟล์สำรองฐานข้อมูลที่ตรงกับเวอร์ชันนี้');
      await runStep('rb_db', 'กู้ฐานข้อมูลเป็นก่อนอัปเดต', async () => {
        await restoreDb(up.backupFile);
        job!.warnings.push('กู้ฐานข้อมูลกลับไปเป็นก่อนอัปเดต — ข้อมูลที่เพิ่ม/แก้หลังเวลาสำรองจะหายไป');
      });
    }
    await runStep('rb_switch', `สลับกลับเป็น ${prev} และรีสตาร์ต`, async () => {
      await atomicLink(P.previous, cur!);
      await atomicLink(P.current, prev!);
      job!.status = 'restarting';
      await saveJob();
    });
    requestRestart();
  } catch (e: any) {
    await finishJob('failed', e.message);
  }
}

// ---------- ตัวควบคุมสำหรับ API ----------
export async function startUpgrade(tag: string): Promise<void> {
  if (!ENABLED) throw new Error('ยังไม่ได้ตั้งค่าระบบอัปเดต');
  if (!TAG_RE.test(tag)) throw new Error('ชื่อเวอร์ชันไม่ถูกต้อง');
  const j = await loadJob();
  if (busy || j?.status === 'running' || j?.status === 'restarting') throw new Error('กำลังมีงานอัปเดต/ย้อนคืนอยู่');
  busy = true;
  doUpgrade(tag).catch((e) => console.error('upgrade crashed:', e)).finally(() => { busy = false; });
}

export async function startRollback(withDb: boolean): Promise<void> {
  if (!ENABLED) throw new Error('ยังไม่ได้ตั้งค่าระบบอัปเดต');
  const j = await loadJob();
  if (busy || j?.status === 'running' || j?.status === 'restarting') throw new Error('กำลังมีงานอัปเดต/ย้อนคืนอยู่');
  busy = true;
  doRollback(withDb).catch((e) => console.error('rollback crashed:', e)).finally(() => { busy = false; });
}

// ---------- เรียกตอน backend เริ่มทำงาน: สรุปผลงานที่ค้างอยู่ข้ามการรีสตาร์ต ----------
export async function reconcileOnBoot(): Promise<void> {
  if (!ENABLED) return;
  try {
    const j = await loadJob();
    if (!j) return;
    if (j.status === 'running') {
      // process ถูกปิดกลางงาน (เช่น container รีสตาร์ต) — เว็บเดิมยังอยู่ แต่อาจเหลือไฟล์ค้าง
      await finishJob('failed', 'ระบบถูกรีสตาร์ตระหว่างทำงาน — ตรวจสถานะแล้วลองใหม่ (ไม่มีการสลับเวอร์ชัน)');
      return;
    }
    if (j.status !== 'restarting') return;
    const cur = await currentVersion();
    if (cur === j.to) {
      const checks = await healthChecks();
      const bad = checks.filter((c) => !c.ok && c.key !== 'lastfail');
      if (bad.length) {
        logLine(`เริ่มเวอร์ชันใหม่ได้แต่ตรวจพบปัญหา: ${bad.map((c) => `${c.label} (${c.detail})`).join('; ')}`);
        job!.warnings.push(`เริ่มเวอร์ชันใหม่ได้ แต่ตรวจสุขภาพพบ: ${bad.map((c) => c.label).join(', ')}`);
      }
      job!.steps.push({ key: 'verify', label: 'ตรวจสุขภาพหลังรีสตาร์ต', status: bad.length ? 'failed' : 'done', detail: bad.length ? `พบปัญหา ${bad.length} รายการ` : `ผ่าน ${checks.length} รายการ` });
      if (j.type === 'upgrade') await pruneVersions();
      await finishJob('success');
    } else {
      const fail = await readJson<any | null>(P.lastFailure, null);
      job!.steps.push({ key: 'auto_rb', label: 'เวอร์ชันใหม่เริ่มไม่ขึ้น — launcher สลับกลับเวอร์ชันเดิมอัตโนมัติ', status: 'done', detail: cur || '' });
      await finishJob('rolled_back', `เวอร์ชัน ${j.to} เริ่มไม่ขึ้น: ${fail?.reason || 'ไม่ทราบสาเหตุ'} — กลับไปใช้ ${cur} แล้ว เว็บทำงานปกติ`);
    }
  } catch (e) {
    console.error('reconcileOnBoot error:', e);
  }
}
