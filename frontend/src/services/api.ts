import axios from 'axios';
import {
  StatsOverview,
  Institution,
  NewsItem,
  SiteSettings,
  AppearanceSettingsInput,
  UserProfile,
  InstitutionStatItem,
  ContactFormInput,
  DveDepartmentItem,
  CareerClassroomItem,
  DveAndCareerSummary,
} from '../types';


export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('udpvecsmart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// บัตรผ่านหมดอายุ (12 ชม.) หรือไม่ถูกต้อง → ล้าง token แล้วแจ้งให้ App ออกจากระบบ
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const hadToken = !!localStorage.getItem('udpvecsmart_token');
    const isLogin = String(err.config?.url || '').includes('/auth/login');
    if (err.response?.status === 401 && hadToken && !isLogin) {
      localStorage.removeItem('udpvecsmart_token');
      window.dispatchEvent(new Event('udpvecsmart:session-expired'));
    }
    return Promise.reject(err);
  }
);

export async function updateAppearanceSettings(data: AppearanceSettingsInput) {
  const res = await api.put('/settings/appearance', data);
  return res.data;
}

// ระบบอัปเดตเวอร์ชันเว็บ (เฉพาะ SUPER_ADMIN)
export async function getSystemStatus() {
  const res = await api.get('/system/status');
  return res.data;
}
export async function checkSystemUpdate() {
  const res = await api.post('/system/check', {}, { timeout: 160000 });
  return res.data;
}
export async function getSystemHealth() {
  const res = await api.get('/system/health');
  return res.data;
}
export async function startSystemUpgrade(tag: string) {
  const res = await api.post('/system/upgrade', { tag });
  return res.data;
}
export async function startSystemRollback(restoreDb: boolean) {
  const res = await api.post('/system/rollback', { restoreDb });
  return res.data;
}

export async function getSettings(): Promise<SiteSettings> {
  const res = await api.get('/settings/public');
  return res.data.data;
}

export async function getStatsOverview(
  academicYear?: number,
  semester?: number,
  institutionId?: string
): Promise<StatsOverview> {
  const params: any = {};
  if (academicYear) params.academicYear = academicYear;
  if (semester) params.semester = semester;
  if (institutionId && institutionId !== 'ALL') params.institutionId = institutionId;
  const res = await api.get('/stats/overview', { params });
  return res.data.data;
}

export async function getStatsByInstitution(
  academicYear?: number,
  semester?: number
): Promise<{ total: number; data: InstitutionStatItem[] }> {
  const params: any = {};
  if (academicYear) params.academicYear = academicYear;
  if (semester) params.semester = semester;
  const res = await api.get('/stats/by-institution', { params });
  return res.data;
}

export async function getInstitutions(params?: { search?: string; type?: string }): Promise<{ total: number; data: Institution[] }> {
  const res = await api.get('/institutions', { params });
  return res.data;
}

export async function getNewsList(params?: { category?: string; limit?: number; page?: number }): Promise<{ total: number; data: NewsItem[] }> {
  const res = await api.get('/news', { params });
  return {
    total: res.data.pagination.total,
    data: res.data.data,
  };
}

export async function submitContact(data: ContactFormInput): Promise<{ status: string; message: string }> {
  const res = await api.post('/contact', data);
  return res.data;
}

export async function login(email: string, password: string): Promise<{ accessToken: string; user: UserProfile }> {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function getMe(): Promise<UserProfile> {
  const res = await api.get('/auth/me');
  return res.data.user;
}

// Super Admin: เปิด-ปิดระบบรับข้อมูล
export async function toggleSubmissionOpen(isOpen: boolean): Promise<{ is_data_submission_open: boolean }> {
  const res = await api.put('/settings/submission-toggle', { isOpen });
  return res.data.data;
}

// Super Admin: ตรวจสอบสถานะการส่งข้อมูลของทั้ง 29 วิทยาลัย
export async function getSubmissionStatuses(
  academicYear?: number,
  semester?: number
): Promise<{
  academicYear: number;
  semester: number;
  isSubmissionOpen: boolean;
  permissions?: {
    allowSectionGeneral?: boolean;
    allowSectionTeachers?: boolean;
    allowSectionGrades?: boolean;
    allowSectionDve?: boolean;
    allowSectionCareer?: boolean;
    allowSectionGraduates?: boolean;
    glowSection?: string;
    allowSchoolExport?: boolean;
  };
  totalInstitutions: number;
  submittedCount: number;
  pendingCount: number;
  data: any[];
}> {
  const params: any = {};
  if (academicYear) params.academicYear = academicYear;
  if (semester) params.semester = semester;
  const res = await api.get('/stats/submission-status', { params });
  return res.data;
}

// ดึงสถิติของวิทยาลัย (School Admin ดึงของตนเอง, หรือ Super Admin ระบุ institutionId เพื่อดึงของวิทยาลัยใดๆ)
export async function getMySchoolStat(
  academicYear?: number,
  semester?: number,
  institutionId?: string
): Promise<{
  isSubmissionOpen: boolean;
  institution: any;
  academicYear: number;
  semester: number;
  data: any;
}> {
  const params: any = {};
  if (academicYear) params.academicYear = academicYear;
  if (semester) params.semester = semester;
  if (institutionId) params.institutionId = institutionId;
  const res = await api.get('/stats/my-school', { params });
  return res.data;
}

// School Admin: บันทึกข้อมูลสถิติของวิทยาลัย
export async function submitSchoolStat(data: any): Promise<{ status: string; message: string; data: any }> {
  const res = await api.post('/stats/submit', data);
  return res.data;
}

// Super Admin: เพิ่มข่าวสาร
export async function createNews(data: {
  title: string;
  content: string;
  category?: string;
  coverImageUrl?: string;
  linkUrl?: string;
}): Promise<NewsItem> {
  const res = await api.post('/news', data);
  return res.data.data;
}

// Super Admin: แก้ไขข่าวสาร
export async function updateNews(
  id: string,
  data: {
    title: string;
    content: string;
    category?: string;
    coverImageUrl?: string | null;
    linkUrl?: string | null;
  }
): Promise<NewsItem> {
  const res = await api.put(`/news/${id}`, data);
  return res.data.data;
}

// Super Admin: ลบข่าวสาร
export async function deleteNews(id: string): Promise<void> {
  await api.delete(`/news/${id}`);
}

// Super Admin: ปรับลำดับข่าวสาร
export async function reorderNews(orderedIds: string[]): Promise<any> {
  const res = await api.put('/news/reorder', { orderedIds });
  return res.data;
}

// เพิ่มยอดวิวข่าวสาร (+1 viewCount)
export async function incrementNewsView(id: string): Promise<{ status: string; data: { id: string; viewCount: number } }> {
  const res = await api.patch(`/news/${id}/view`);
  return res.data;
}


// อัปเดตข้อมูลผู้บริหาร / ภาพถ่าย / ข้อมูลติดต่อของวิทยาลัย
export async function updateInstitutionDirector(
  id: string,
  data: {
    name?: string;
    shortName?: string;
    directorName?: string;
    position?: string;
    photoUrl?: string;
    phone?: string;
    website?: string;
    address?: string;
    programsCount?: number;
    programsList?: string[] | string;
    programsUrl?: string;
  }
): Promise<any> {
  const res = await api.patch(`/institutions/${id}/director`, data);
  return res.data;
}

// Super Admin: เพิ่มสถานศึกษาใหม่
export async function createInstitution(data: {
  code: string;
  name: string;
  shortName?: string;
  order?: number;
  type: 'PUBLIC' | 'PRIVATE';
  directorName?: string;
  phone?: string;
  website?: string;
  address?: string;
  programsCount?: number;
  programsList?: string[] | string;
  programsUrl?: string;
}): Promise<any> {
  const res = await api.post('/institutions', data);
  return res.data;
}

// Super Admin: ลบสถานศึกษา
export async function deleteInstitution(id: string): Promise<any> {
  const res = await api.delete(`/institutions/${id}`);
  return res.data;
}

// Super Admin: ปรับลำดับการแสดงผลสถานศึกษา
export async function reorderInstitutions(orderedIds: string[]): Promise<any> {
  const res = await api.put('/institutions/reorder', { orderedIds });
  return res.data;
}

// Super Admin: บันทึกการตั้งค่าเปิด-ปิดรายหมวด & แสงกระพริบ & สิทธิ์ Export/พิมพ์
export async function updateSubmissionPermissions(data: {
  allowSectionGeneral: boolean;
  allowSectionTeachers?: boolean;
  allowSectionGrades: boolean;
  allowSectionDve?: boolean;
  allowSectionCareer?: boolean;
  allowSectionGraduates: boolean;
  glowSection: string;
  allowSchoolExport?: boolean;
}): Promise<any> {
  const res = await api.put('/settings/submission-permissions', data);
  return res.data;
}

// Super Admin: จัดการผู้ใช้งาน
export async function getUsers(): Promise<any[]> {
  const res = await api.get('/users');
  return res.data.data;
}

export async function createUser(data: {
  email: string;
  password: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN';
  institutionId?: string;
}): Promise<any> {
  const res = await api.post('/users', data);
  return res.data;
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    password?: string;
    fullName?: string;
    role?: 'SUPER_ADMIN' | 'SCHOOL_ADMIN';
    institutionId?: string;
  }
): Promise<any> {
  const res = await api.put(`/users/${id}`, data);
  return res.data;
}

export async function deleteUser(id: string): Promise<any> {
  const res = await api.delete(`/users/${id}`);
  return res.data;
}

// Academic Periods Management (รอบปีการศึกษาและภาคเรียน)
export async function getAcademicPeriods(): Promise<any[]> {
  const res = await api.get('/settings/academic-periods');
  return res.data.data;
}

export async function createAcademicPeriod(data: {
  year: number;
  semester: number;
  isCurrent?: boolean;
}): Promise<any[]> {
  const res = await api.post('/settings/academic-periods', data);
  return res.data.data || res.data;
}

export async function deleteAcademicPeriod(id: string): Promise<any[]> {
  const res = await api.delete(`/settings/academic-periods/${id}`);
  return res.data.data || res.data;
}

export async function setCurrentAcademicPeriod(id: string): Promise<any[]> {
  const res = await api.put(`/settings/academic-periods/${id}/current`);
  return res.data.data || res.data;
}

// Visitor Count (สถิติผู้เข้าชมเว็บไซต์)
export async function getVisitorCount(): Promise<number> {
  const res = await api.get('/settings/visitor-count');
  return res.data.count;
}

// crypto.randomUUID มีเฉพาะ secure context (HTTPS/localhost) — เปิดผ่าน HTTP ในวงแลนต้องสร้างเอง
function randomVisitorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// รหัสผู้เข้าชม (สุ่มสร้างเองในเบราว์เซอร์) ใช้ให้เซิร์ฟเวอร์ไม่นับซ้ำเมื่อรีเฟรช — ไม่ผูกกับตัวตนใคร
function getVisitorId(): string {
  try {
    let id = localStorage.getItem('udpvecsmart_visitor_id');
    if (!id) {
      id = randomVisitorId();
      localStorage.setItem('udpvecsmart_visitor_id', id);
    }
    return id;
  } catch {
    return randomVisitorId();
  }
}

export async function incrementVisitorCount(): Promise<number> {
  const res = await api.post('/settings/visitor-count/increment', { visitorId: getVisitorId() });
  return res.data.count;
}

export async function setVisitorCount(count: number): Promise<void> {
  await api.put('/settings/visitor-count', { count });
}

export const MAX_IMAGE_UPLOAD_BYTES = 30 * 1024 * 1024;

export interface UploadedImageResult {
  id: string;
  width: number;
  height: number;
  size: number;
  urls: { thumb: string; display: string; original: string };
}

/**
 * อัปโหลดรูปขึ้นเซิร์ฟเวอร์ (ไฟล์ต้นฉบับ ไม่ย่อ ไม่เกิน 50MB) — คืนลิงก์รูปแสดงผล/รูปย่อ/ต้นฉบับ
 * ข้อความ error บอกสาเหตุจริงจากเซิร์ฟเวอร์ (ชนิดไฟล์ไม่รองรับ, ไฟล์ใหญ่เกิน ฯลฯ)
 */
export async function uploadImage(file: File, onProgress?: (percent: number) => void): Promise<UploadedImageResult> {
  // เบราว์เซอร์บน Windows/Chrome มักไม่ระบุชนิดไฟล์ของ .heic จึงดูนามสกุลด้วย
  const isHeic = /\.(heic|heif)$/i.test(file.name);
  if (!file.type.startsWith('image/') && !isHeic) {
    throw new Error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error(`รูปภาพใหญ่เกิน 50MB (ไฟล์นี้ ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
  }
  try {
    const res = await api.post('/images', file, {
      headers: { 'Content-Type': file.type || (isHeic ? 'image/heic' : 'application/octet-stream'), 'X-Filename': encodeURIComponent(file.name) },
      timeout: 5 * 60 * 1000,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return res.data.data;
  } catch (err: any) {
    const status = err?.response?.status;
    throw new Error(err?.response?.data?.message || (status ? `อัปโหลดไม่สำเร็จ (HTTP ${status})` : err?.message || 'อัปโหลดไม่สำเร็จ'));
  }
}

export async function updateBannerImages(images: string[]): Promise<void> {
  await api.put('/settings/banners', { images });
}
export async function updateBannerImage(image: string): Promise<void> {
  await api.put('/settings/banner', { image });
}

export async function updateContactInfo(data: {
  contactAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactHours?: string;
  contactFacebook?: string;
}): Promise<void> {
  await api.put('/settings/contact-info', data);
}

// ========================================================
// ทวิภาคี & ห้องเรียนอาชีพ (DVE & Career Classrooms)
// ========================================================

export async function getDveDepartments(
  academicYear?: number,
  semester?: number,
  institutionId?: string
): Promise<DveDepartmentItem[]> {
  const params: any = {};
  if (academicYear) params.academicYear = academicYear;
  if (semester) params.semester = semester;
  if (institutionId) params.institutionId = institutionId;
  const res = await api.get('/dve-career/departments', { params });
  return res.data.data;
}

export async function saveDveDepartments(data: {
  academicYear: number;
  semester?: number;
  institutionId?: string;
  departments: DveDepartmentItem[];
}): Promise<any> {
  const res = await api.post('/dve-career/departments', data);
  return res.data;
}

export async function getCareerClassrooms(
  academicYear?: number,
  semester?: number,
  institutionId?: string,
  trainingType?: string
): Promise<CareerClassroomItem[]> {
  const params: any = {};
  if (academicYear) params.academicYear = academicYear;
  if (semester) params.semester = semester;
  if (institutionId) params.institutionId = institutionId;
  if (trainingType) params.trainingType = trainingType;
  const res = await api.get('/dve-career/career-classrooms', { params });
  return res.data.data;
}

export async function saveCareerClassrooms(data: {
  academicYear: number;
  semester?: number;
  institutionId?: string;
  classrooms: CareerClassroomItem[];
}): Promise<any> {
  const res = await api.post('/dve-career/career-classrooms', data);
  return res.data;
}

export async function getDveAndCareerSummary(
  academicYear?: number,
  semester?: number,
  institutionId?: string
): Promise<DveAndCareerSummary> {
  const params: any = {};
  if (academicYear) params.academicYear = academicYear;
  if (semester) params.semester = semester;
  if (institutionId) params.institutionId = institutionId;
  const res = await api.get('/dve-career/summary', { params });
  return res.data.data;
}





