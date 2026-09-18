import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BannerSection } from './components/dashboard/BannerSection';
import { StatCards } from './components/dashboard/StatCards';
import { InstitutionList } from './components/dashboard/InstitutionList';
import { NewsSection } from './components/dashboard/NewsSection';
import { LoginModal } from './components/auth/LoginModal';
import { getSettings, getStatsOverview, getInstitutions, getNewsList, getMe } from './services/api';
import { StatsOverview, Institution, NewsItem, SiteSettings, UserProfile } from './types';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Dashboard Data State
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  // Loading States
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  // ตรวจสอบสถานะการเข้าสู่ระบบจาก Token ใน localStorage
  useEffect(() => {
    const token = localStorage.getItem('udpvecsmart_token');
    if (token) {
      getMe()
        .then((profile) => setUser(profile))
        .catch(() => {
          // Token หมดอายุหรือไม่ถูกต้อง
          localStorage.removeItem('udpvecsmart_token');
          setUser(null);
        });
    }
  }, []);

  // ดึงข้อมูลภาพรวมสำหรับหน้าสาธารณะ (Public Dashboard)
  useEffect(() => {
    // 1. ดึง Settings
    getSettings()
      .then((data) => setSettings(data))
      .catch((err) => console.error('Failed to load settings:', err));

    // 2. ดึง Stats Overview
    getStatsOverview()
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setLoadingStats(false));

    // 3. ดึงรายชื่อสถานศึกษา
    getInstitutions()
      .then((res) => setInstitutions(res.data))
      .catch((err) => console.error('Failed to load institutions:', err))
      .finally(() => setLoadingInstitutions(false));

    // 4. ดึงข่าวสาร
    getNewsList({ limit: 6 })
      .then((res) => setNewsList(res.data))
      .catch((err) => console.error('Failed to load news:', err))
      .finally(() => setLoadingNews(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('udpvecsmart_token');
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 1. Header & Navigation */}
      <Navbar
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Content */}
      <main className="flex-grow">
        {/* Banner / Hero Section */}
        <BannerSection settings={settings} />

        {/* Real-time Statistics Cards */}
        <StatCards stats={stats} loading={loadingStats} />

        {/* Colleges Directory (Search & Filter) */}
        <InstitutionList institutions={institutions} loading={loadingInstitutions} />

        {/* News & Activity Section */}
        <NewsSection newsList={newsList} loading={loadingNews} />
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(loggedUser) => setUser(loggedUser)}
      />
    </div>
  );
}

export default App;
