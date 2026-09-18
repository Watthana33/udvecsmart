import axios from 'axios';
import { StatsOverview, Institution, NewsItem, SiteSettings, UserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ดักจับ Request เพื่อแนบ JWT Token จาก localStorage (ถ้ามี)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('udpvecsmart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Functions
export async function getSettings(): Promise<SiteSettings> {
  const res = await api.get('/settings/public');
  return res.data.data;
}

export async function getStatsOverview(academicYear?: number, semester?: number): Promise<StatsOverview> {
  const params: any = {};
  if (academicYear) params.academicYear = academicYear;
  if (semester) params.semester = semester;
  const res = await api.get('/stats/overview', { params });
  return res.data.data;
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

export async function login(email: string, password: string): Promise<{ accessToken: string; user: UserProfile }> {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function getMe(): Promise<UserProfile> {
  const res = await api.get('/auth/me');
  return res.data.user;
}
