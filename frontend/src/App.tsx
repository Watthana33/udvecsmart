import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BannerSection } from './components/dashboard/BannerSection';
import { NewsSection } from './components/dashboard/NewsSection';
import { StatCards } from './components/dashboard/StatCards';
import { OverviewCharts } from './components/dashboard/OverviewCharts';
import { InstitutionList } from './components/dashboard/InstitutionList';
import { EmploymentSection } from './components/dashboard/EmploymentSection';
import { ContactSection } from './components/dashboard/ContactSection';
import { LoginModal } from './components/auth/LoginModal';
import {
  getStatsOverview,
  getStatsByInstitution,
  getInstitutions,
  getNewsList,
  getMe,
} from './services/api';
import {
  StatsOverview,
  Institution,
  NewsItem,
  UserProfile,
  InstitutionStatItem,
} from './types';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Filter State (Reactive Filters)
  const [selectedYear, setSelectedYear] = useState<number>(2568);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('ALL');

  // Data States
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [institutionStats, setInstitutionStats] = useState<InstitutionStatItem[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);

  // Loading States
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  // Check login token
  useEffect(() => {
    const token = localStorage.getItem('udpvecsmart_token');
    if (token) {
      getMe()
        .then((profile) => setUser(profile))
        .catch(() => {
          localStorage.removeItem('udpvecsmart_token');
          setUser(null);
        });
    }
  }, []);

  // Fetch Institutions & News on initial load
  useEffect(() => {
    getInstitutions()
      .then((res) => setInstitutions(res.data))
      .catch((err) => console.error('Failed to load institutions:', err))
      .finally(() => setLoadingInstitutions(false));

    getNewsList({ limit: 10 })
      .then((res) => setNewsList(res.data))
      .catch((err) => console.error('Failed to load news:', err))
      .finally(() => setLoadingNews(false));
  }, []);

  // Fetch Stats dynamically whenever filters change (Year, Semester, or Selected Institution)
  const loadStats = useCallback(() => {
    setLoadingStats(true);
    Promise.all([
      getStatsOverview(selectedYear, selectedSemester, selectedInstitutionId),
      getStatsByInstitution(selectedYear, selectedSemester),
    ])
      .then(([overviewData, instStatsData]) => {
        setStats(overviewData);
        setInstitutionStats(instStatsData.data);
      })
      .catch((err) => console.error('Failed to load statistics:', err))
      .finally(() => setLoadingStats(false));
  }, [selectedYear, selectedSemester, selectedInstitutionId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleLogout = () => {
    localStorage.removeItem('udpvecsmart_token');
    setUser(null);
  };

  const handleSelectInstitution = (id: string) => {
    setSelectedInstitutionId(id);
    setActiveTab('overview');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* 1. Header with #932d16 theme and Tab Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Content */}
      <main className="flex-grow">
        {/* Banner Section with Full-Width Banner & Reactive Filter Dropdowns */}
        <BannerSection
          institutions={institutions}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedSemester={selectedSemester}
          setSelectedSemester={setSelectedSemester}
          selectedInstitutionId={selectedInstitutionId}
          setSelectedInstitutionId={setSelectedInstitutionId}
        />

        {/* News Section (Slide/Carousel) */}
        <NewsSection newsList={newsList} loading={loadingNews} />

        {/* Tab 1: ภาพรวมสถิติ (Overview Dashboard) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <StatCards stats={stats} loading={loadingStats} />
            <OverviewCharts
              stats={stats}
              institutionStats={institutionStats}
              loading={loadingStats}
            />
          </div>
        )}

        {/* Tab 2: สถานศึกษาในสังกัด (Affiliated Institutions Directory - 29 Colleges) */}
        {activeTab === 'institutions' && (
          <InstitutionList
            institutions={institutions}
            loading={loadingInstitutions}
            selectedInstitutionId={selectedInstitutionId}
            onSelectInstitution={handleSelectInstitution}
          />
        )}

        {/* Tab 3: ข้อมูลผู้สำเร็จการศึกษาและภาวะการมีงานทำ */}
        {activeTab === 'employment' && (
          <EmploymentSection
            stats={stats}
            institutionStats={institutionStats}
            loading={loadingStats}
          />
        )}

        {/* Tab 4: ติดต่อเรา (Contact Us & Form) */}
        {activeTab === 'contact' && <ContactSection />}
      </main>

      {/* 3. Footer with #932d16 theme */}
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
