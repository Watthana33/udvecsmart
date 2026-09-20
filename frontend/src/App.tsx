import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BannerSection } from './components/dashboard/BannerSection';
import { OverviewHero } from './components/dashboard/OverviewHero';
import { FilterBar } from './components/dashboard/FilterBar';
import { StatCards } from './components/dashboard/StatCards';
import { OverviewCharts } from './components/dashboard/OverviewCharts';
import { InstitutionList } from './components/dashboard/InstitutionList';
import { EmploymentSection } from './components/dashboard/EmploymentSection';
import { EmploymentHero } from './components/dashboard/EmploymentHero';
import { DveCareerSection } from './components/dashboard/DveCareerSection';
import { DveCareerHero } from './components/dashboard/DveCareerHero';
import { ContactSection } from './components/dashboard/ContactSection';
import { AdminPortal } from './components/portal/AdminPortal';
import { LoginModal } from './components/auth/LoginModal';
import { FloatingPortalButton } from './components/layout/FloatingPortalButton';

import {
  getStatsOverview,
  getStatsByInstitution,
  getInstitutions,
  getNewsList,
  getMe,
  getAcademicPeriods,
} from './services/api';
import {
  StatsOverview,
  Institution,
  NewsItem,
  UserProfile,
  InstitutionStatItem,
  AcademicPeriodItem,
} from './types';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Academic Periods State
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriodItem[]>([]);

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

  // ดึงข้อมูลรอบปีการศึกษาและตั้งค่าเริ่มต้นตามรอบปัจจุบันที่แอดมินตั้งไว้
  const loadAcademicPeriods = useCallback(async () => {
    try {
      const data = await getAcademicPeriods();
      if (Array.isArray(data) && data.length > 0) {
        setAcademicPeriods(data);
        const curr = data.find((p) => p.isCurrent) || data[0];
        if (curr) {
          setSelectedYear(curr.year);
          setSelectedSemester(curr.semester);
        }
      }
    } catch (err) {
      console.error('Failed to load academic periods:', err);
    }
  }, []);

  useEffect(() => {
    loadAcademicPeriods();
  }, [loadAcademicPeriods]);

  // รีเฟรชรอบปีการศึกษาเมื่อสลับกลับมาที่หน้าภาพรวมหรือการมีงานทำ เพื่อซิงค์กับที่แอดมินตั้งค่าเสมอ
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'employment' || activeTab === 'dve_career') {
      loadAcademicPeriods();
    }
  }, [activeTab, loadAcademicPeriods]);


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
  const loadStats = useCallback((year = selectedYear, semester = selectedSemester, instId = selectedInstitutionId) => {
    setLoadingStats(true);
    Promise.all([
      getStatsOverview(year, semester, instId),
      getStatsByInstitution(year, semester),
    ])
      .then(([overviewData, instStatsData]) => {
        setStats(overviewData);
        setInstitutionStats(instStatsData.data);
      })
      .catch((err) => console.error('Failed to load statistics:', err))
      .finally(() => setLoadingStats(false));
  }, [selectedYear, selectedSemester, selectedInstitutionId]);

  const handleRefreshStats = (year?: number, semester?: number) => {
    const targetYear = year || selectedYear;
    const targetSemester = semester || selectedSemester;
    if (year && year !== selectedYear) setSelectedYear(year);
    if (semester && semester !== selectedSemester) setSelectedSemester(semester);
    loadStats(targetYear, targetSemester, selectedInstitutionId);
  };

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleLogout = () => {
    localStorage.removeItem('udpvecsmart_token');
    setUser(null);
    if (activeTab === 'portal') {
      setActiveTab('overview');
    }
  };

  const handleSelectInstitution = (id: string) => {
    setSelectedInstitutionId(id);
    setActiveTab('overview');
    setTimeout(() => {
      const element = document.getElementById('main-tab-content');
      if (element) {
        const yOffset = -90;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 80);
  };

  // เฉพาะ Super Admin (สอจ.อุดรธานี) เท่านั้นที่มีสิทธิ์เปลี่ยนภาพแบนเนอร์
  const isSuperAdmin = !!user && user.role === 'SUPER_ADMIN';

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
        {/* Full-width Hero Banner with Auto-Fit & Super Admin Changer (Only for Super Admin) */}
        <BannerSection isAdmin={isSuperAdmin} />

        {/* Anchor point for automatic smooth scrolling to tab content */}
        <div id="main-tab-content" className="scroll-mt-24" />

        {/* Tab 1: ภาพรวมสถิติ (Overview Dashboard) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Headline & News side-by-side */}
            <OverviewHero newsList={newsList} loading={loadingNews} />

            {/* Horizontal Filter Bar across the page */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FilterBar
                institutions={institutions}
                academicPeriods={academicPeriods}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedSemester={selectedSemester}
                setSelectedSemester={setSelectedSemester}
                selectedInstitutionId={selectedInstitutionId}
                setSelectedInstitutionId={setSelectedInstitutionId}
              />
            </div>

            <StatCards stats={stats} loading={loadingStats} />
            <OverviewCharts
              stats={stats}
              institutionStats={institutionStats}
              loading={loadingStats}
            />
          </div>
        )}

        {/* Tab: ทวิภาคี & ห้องเรียนอาชีพ (Dual Vocational Education & Career Classrooms) */}
        {activeTab === 'dve_career' && (
          <div className="space-y-6">
            <DveCareerHero />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FilterBar
                institutions={institutions}
                academicPeriods={academicPeriods}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedSemester={selectedSemester}
                setSelectedSemester={setSelectedSemester}
                selectedInstitutionId={selectedInstitutionId}
                setSelectedInstitutionId={setSelectedInstitutionId}
              />
            </div>

            <DveCareerSection
              selectedYear={selectedYear}
              selectedSemester={selectedSemester}
              selectedInstitutionId={selectedInstitutionId}
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
            currentUser={user}
            onRefreshInstitutions={() => {
              getInstitutions().then((res) => setInstitutions(res.data)).catch(console.error);
            }}
          />
        )}

        {/* Tab 3: ข้อมูลผู้สำเร็จการศึกษาและภาวะการมีงานทำ (Graduates & Employment) */}
        {activeTab === 'employment' && (
          <div className="space-y-6">
            <EmploymentHero
              academicYear={stats?.academicYear}
              semester={stats?.semester}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FilterBar
                institutions={institutions}
                academicPeriods={academicPeriods}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedSemester={selectedSemester}
                setSelectedSemester={setSelectedSemester}
                selectedInstitutionId={selectedInstitutionId}
                setSelectedInstitutionId={setSelectedInstitutionId}
              />
            </div>

            <EmploymentSection
              stats={stats}
              institutionStats={institutionStats}
              loading={loadingStats}
            />
          </div>
        )}

        {/* Tab 4: ติดต่อเรา (Contact Us & Form) */}
        {activeTab === 'contact' && <ContactSection />}

        {/* Tab Portal: ระบบจัดการข้อมูล / ศูนย์ควบคุม สอจ. / บันทึกข้อมูลสถิติ */}
        {activeTab === 'portal' && user && (
          <AdminPortal
            user={user}
            onRefreshStats={handleRefreshStats}
            onAcademicPeriodsChange={loadAcademicPeriods}
          />
        )}

      </main>

      {/* 3. Footer with #932d16 theme */}
      <Footer />

      {/* 4. Floating Action Button for Logged in Admin (follows screen on right) */}
      <FloatingPortalButton
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 5. Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(loggedUser) => {
          setUser(loggedUser);
          setActiveTab('portal');
          setTimeout(() => {
            const element = document.getElementById('main-tab-content');
            if (element) {
              const yOffset = -90;
              const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            }
          }, 80);
        }}
      />
    </div>
  );
}

export default App;
