import axios from 'axios';
import { StatsOverview, Institution, NewsItem, SiteSettings, UserProfile, InstitutionStatItem, ContactFormInput } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
}): Promise<NewsItem> {
  const res = await api.post('/news', data);
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


// อัปเดตข้อมูลผู้บริหาร / ภาพถ่าย / ข้อมูลติดต่อของวิทยาลัย
export async function updateInstitutionDirector(
  id: string,
  data: {
    directorName?: string;
    position?: string;
    photoUrl?: string;
    phone?: string;
    website?: string;
    address?: string;
    programsCount?: number;
  }
): Promise<any> {
  const res = await api.patch(`/institutions/${id}/director`, data);
  return res.data;
}

// Super Admin: เพิ่มสถานศึกษาใหม่
export async function createInstitution(data: {
  code: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE';
  directorName?: string;
  phone?: string;
  website?: string;
  address?: string;
  programsCount?: number;
}): Promise<any> {
  const res = await api.post('/institutions', data);
  return res.data;
}

// Super Admin: บันทึกการตั้งค่าเปิด-ปิดรายหมวด & แสงกระพริบ
export async function updateSubmissionPermissions(data: {
  allowSectionGeneral: boolean;
  allowSectionGrades: boolean;
  allowSectionGraduates: boolean;
  glowSection: string;
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
}): Promise<any> {
  const res = await api.post('/settings/academic-periods', data);
  return res.data;
}

export async function deleteAcademicPeriod(id: string): Promise<any> {
  const res = await api.delete(`/settings/academic-periods/${id}`);
  return res.data;
}

export async function setCurrentAcademicPeriod(id: string): Promise<any> {
  const res = await api.put(`/settings/academic-periods/${id}/current`);
  return res.data;
}



