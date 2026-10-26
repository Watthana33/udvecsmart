import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { resolveBanner } from './utils/bannerImages';
import { BannerSection } from './components/dashboard/BannerSection';
import { resolveContact } from './utils/siteContact';
import { OverviewHero } from './components/dashboard/OverviewHero';
import { FacebookFeed } from './components/dashboard/FacebookFeed';
import { FilterBar } from './components/dashboard/FilterBar';
import { StatCards } from './components/dashboard/StatCards';
import { OverviewCharts } from './components/dashboard/OverviewCharts';
import { InstitutionList } from './components/dashboard/InstitutionList';
import { EmploymentSection } from './components/dashboard/EmploymentSection';
import { EmploymentHero } from './components/dashboard/EmploymentHero';
import { DveCareerSection } from './components/dashboard/DveCareerSection';
import { DveCareerHero } from './components/dashboard/DveCareerHero';
import { ContactSection } from './components/dashboard/ContactSection';
import { SiteFlowchart } from './components/dashboard/SiteFlowchart';
import { AdminPortal } from './components/portal/AdminPortal';
import { LoginModal } from './components/auth/LoginModal';
import { WelcomeGate, resolveWelcomeBadge } from './components/appearance/WelcomeGate';
import { MourningRibbon } from './components/appearance/MourningRibbon';
import { applyCustomColors, parseCustomColors, CUSTOM_COLORS_CACHE_KEY } from './utils/themeColors';

import {
  getStatsOverview,
  getStatsByInstitution,
  getInstitutions,
  getNewsList,
  getMe,
  getAcademicPeriods,
  getSettings,
  API_BASE_URL,
} from './services/api';
import {
  StatsOverview,
  Institution,
  NewsItem,
  UserProfile,
  InstitutionStatItem,
  AcademicPeriodItem,
  SiteSettings,
} from './types';

const THEME_CACHE_KEY = 'udpvecsmart_site_theme';

// แต่ละแท็บมี URL ของตัวเอง (สลับหน้าแบบไม่โหลดใหม่ด้วย History API; nginx ส่งทุก path กลับ index.html อยู่แล้ว)
const TAB_PATHS: Record<string, string> = {
  overview: '/',
  dve_career: '/dve-career',
  employment: '/employment',
  institutions: '/institutions',
  contact: '/contact',
  oic_structure: '/oic-structure',
  portal: '/portal',
};

const TAB_TITLES: Record<string, string> = {
  overview: 'ข้อมูลพื้นฐาน',
  dve_career: 'ทวิภาคี & ห้องเรียนอาชีพ',
  employment: 'ภาวะการมีงานทำ',
  institutions: 'สถานศึกษาในสังกัด',
  contact: 'ติดต่อเรา',
  oic_structure: 'สอจ.อุดรธานี ประกอบด้วยส่วนไหน',
  portal: 'ระบบจัดการข้อมูล',
};

const BASE_TITLE = 'สำนักงานอาชีวศึกษาจังหวัดอุดรธานี - UDPVECSmart';

function pathToTab(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return Object.keys(TAB_PATHS).find((tab) => TAB_PATHS[tab] === clean) || 'overview';
}

// หน้าข่าวสารก่อนเข้าเว็บ: จำว่าผู้เข้าชมกดเข้าไปแล้วเพียง 1 ชั่วโมง (และถ้าแอดมินแก้เนื้อหา เลขเวอร์ชันเปลี่ยน จะแสดงใหม่)
const WELCOME_SEEN_KEY = 'udpvecsmart_welcome_seen';
const WELCOME_REMEMBER_MS = 60 * 60 * 1000;

function wasWelcomeSeenRecently(version: string): boolean {
  try {
    const raw = localStorage.getItem(WELCOME_SEEN_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw) as { at?: number; version?: string };
    return saved.version === version && typeof saved.at === 'number' && Date.now() - saved.at < WELCOME_REMEMBER_MS;
  } catch {
    return false;
  }
}

function markWelcomeSeen(version: string) {
  try {
    localStorage.setItem(WELCOME_SEEN_KEY, JSON.stringify({ at: Date.now(), version }));
  } catch {
    /* ใช้ localStorage ไม่ได้ก็แสดงตามปกติทุกครั้ง */
  }
}

// ใส่/ถอดคลาสธีมที่ <html> (สไตล์อยู่ใน index.css)
function applySiteTheme(theme: string | undefined) {
  const root = document.documentElement;
  root.classList.remove('theme-mono', 'theme-gray', 'theme-province', 'theme-custom');
  if (theme === 'mono' || theme === 'gray' || theme === 'province' || theme === 'custom') root.classList.add(`theme-${theme}`);
}

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [tokenTick, setTokenTick] = useState(0); // บัตรผ่านถูกเปลี่ยนเป็นใบใหม่ → ตั้งเวลาหมดอายุใหม่
  const [activeTab, setActiveTabState] = useState<string>(() => pathToTab(window.location.pathname));
  const [authChecked, setAuthChecked] = useState(false);

  // เปลี่ยนแท็บ + เปลี่ยน URL (ไม่โหลดหน้าใหม่) ให้ปุ่มย้อนกลับ/ลิงก์ตรง/รีเฟรชใช้งานได้
  const setActiveTab = useCallback((tab: string, replace = false) => {
    setActiveTabState(tab);
    const path = TAB_PATHS[tab] || '/';
    if (window.location.pathname !== path) {
      if (replace) window.history.replaceState(null, '', path);
      else window.history.pushState(null, '', path);
    }
  }, []);

  // ปุ่มย้อนกลับ/เดินหน้าของเบราว์เซอร์
  useEffect(() => {
    const onPop = () => setActiveTabState(pathToTab(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // ชื่อแท็บของเบราว์เซอร์ตามหน้าปัจจุบัน
  useEffect(() => {
    document.title = activeTab === 'overview' ? BASE_TITLE : `${TAB_TITLES[activeTab]} - UDPVECSmart`;
  }, [activeTab]);

  // รูปลักษณ์เว็บ: ธีมไว้อาลัย & หน้าข่าวสารก่อนเข้าเว็บ (ตั้งค่าจากหลังบ้าน)
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [settingsReady, setSettingsReady] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

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

  // ให้ส่วนหัวเว้นที่ให้ริบบิ้นไว้อาลัยมุมขวาบน (สไตล์อยู่ใน index.css)
  useEffect(() => {
    document.documentElement.classList.toggle('has-ribbon', !!siteSettings?.mourning_ribbon);
  }, [siteSettings?.mourning_ribbon]);

  // โหลดการตั้งค่าเว็บ (ธีม ข่าวสาร แบนเนอร์ ข้อมูลติดต่อ) — ถ้าโหลดไม่ได้ก็แสดงเว็บปกติ ไม่บล็อกผู้เข้าชม
  const loadSiteSettings = useCallback(() => {
    return getSettings()
      .then((data) => {
        setSiteSettings(data);
        const theme = data.site_theme || 'normal';
        applySiteTheme(theme);
        const custom = theme === 'custom' ? parseCustomColors(data.custom_colors) : null;
        applyCustomColors(custom);
        try {
          localStorage.setItem(CUSTOM_COLORS_CACHE_KEY, custom ? JSON.stringify(custom) : '');
          localStorage.setItem(THEME_CACHE_KEY, theme);
        } catch {
          /* ใช้ localStorage ไม่ได้ก็ข้าม */
        }
      })
      .catch((err) => console.error('Failed to load site settings:', err));
  }, []);

  useEffect(() => {
    loadSiteSettings().finally(() => setSettingsReady(true));
  }, [loadSiteSettings]);

  // แอดมินบันทึกการตั้งค่าจากหลังบ้าน → โหลดใหม่ให้เห็นผลทันที (และไม่เด้งหน้าข่าวสารทับหน้าแอดมิน)
  const handleSiteSettingsChange = useCallback(() => {
    setWelcomeDismissed(true);
    return loadSiteSettings();
  }, [loadSiteSettings]);

  // Check login token
  useEffect(() => {
    const token = localStorage.getItem('udpvecsmart_token');
    if (token) {
      getMe()
        .then((profile) => setUser(profile))
        .catch(() => {
          localStorage.removeItem('udpvecsmart_token');
          setUser(null);
        })
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  // เซสชัน 12 ชม.: หมดอายุแล้วออกจากระบบอัตโนมัติ (ทั้งตอนเรียก API ได้ 401 และตั้งเวลาตาม exp ใน token)
  useEffect(() => {
    const expire = () => {
      localStorage.removeItem('udpvecsmart_token');
      setUser(null);
      setActiveTab("overview");
      setSessionExpired(true);
      setIsLoginOpen(true);
    };
    const refreshed = () => setTokenTick((n) => n + 1);
    window.addEventListener('udpvecsmart:session-expired', expire);
    window.addEventListener('udpvecsmart:token-refreshed', refreshed);
    let timer: number | undefined;
    if (user) {
      try {
        const token = localStorage.getItem('udpvecsmart_token') || '';
        const exp = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp;
        const ms = exp * 1000 - Date.now();
        timer = window.setTimeout(expire, Math.min(Math.max(ms, 0), 2 ** 31 - 1));
      } catch { /* token อ่านไม่ได้ → ปล่อยให้ 401 จัดการ */ }
    }
    return () => {
      window.removeEventListener('udpvecsmart:session-expired', expire);
      window.removeEventListener('udpvecsmart:token-refreshed', refreshed);
      if (timer) window.clearTimeout(timer);
    };
  }, [user, tokenTick]);

  // เปิดลิงก์ /portal ตรง ๆ แต่ยังไม่ได้ล็อกอิน → กลับหน้าแรก
  useEffect(() => {
    if (authChecked && !user && activeTab === 'portal') {
      setActiveTab('overview', true);
    }
  }, [authChecked, user, activeTab, setActiveTab]);

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

  // หน้าข่าวสารก่อนเข้าเว็บ: แสดงเมื่อเข้าเว็บครั้งแรก เปิดใช้ และมีเนื้อหา; กดเข้าแล้วจำไว้ 1 ชั่วโมง
  const welcomeVersion = String(siteSettings?.welcome_version ?? '');
  const welcomeTitle = String(siteSettings?.welcome_title ?? '');
  const welcomeContent = String(siteSettings?.welcome_content ?? '');
  const welcomeImage = siteSettings?.welcome_has_image
    ? `${API_BASE_URL}/settings/welcome-image?v=${siteSettings.welcome_image_version ?? ''}`
    : '';
  const bannerSrc = resolveBanner(siteSettings).selected || undefined;
  const contact = resolveContact(siteSettings);
  const showWelcome =
    settingsReady &&
    !!siteSettings?.welcome_enabled &&
    !!(welcomeTitle || welcomeContent || welcomeImage) &&
    !welcomeDismissed &&
    !wasWelcomeSeenRecently(welcomeVersion);

  const handleEnterSite = () => {
    markWelcomeSeen(welcomeVersion);
    setWelcomeDismissed(true);
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
        {/* Full-width Hero Banner with Auto-Fit & Super Admin Changer (Only for Super Admin) */}
        <BannerSection src={bannerSrc} />

        {/* Anchor point for automatic smooth scrolling to tab content */}
        <div id="main-tab-content" className="scroll-mt-24" />

        {/* เนื้อหาแต่ละแท็บ: key เปลี่ยนตามแท็บเพื่อให้เล่น fade เข้าทุกครั้งที่สลับหน้า (ไร้รอยต่อ) */}
        <div key={activeTab} className="tab-enter">
        {/* Tab 1: ภาพรวมสถิติ (Overview Dashboard) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Headline & News side-by-side */}
            <OverviewHero newsList={newsList} loading={loadingNews} />

            {/* โพสต์ล่าสุดจาก Facebook Page (แสดงเมื่อใส่ลิงก์เพจในข้อมูลติดต่อ) */}
            <FacebookFeed pageUrl={contact.facebook} />

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

            <StatCards stats={stats} loading={loadingStats} institutions={institutions} selectedInstitutionId={selectedInstitutionId} />
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
        {activeTab === 'contact' && <ContactSection contact={contact} />}

        {/* ผังโครงสร้าง สอจ.อุดรธานี */}
        {activeTab === 'oic_structure' && (
          <SiteFlowchart
            savedCards={siteSettings?.oic_structure}
            onSaved={handleSiteSettingsChange}
          />
        )}

        {/* Tab Portal: ระบบจัดการข้อมูล / ศูนย์ควบคุม สอจ. / บันทึกข้อมูลสถิติ */}
        {activeTab === 'portal' && user && (
          <AdminPortal
            user={user}
            onRefreshStats={handleRefreshStats}
            onAcademicPeriodsChange={loadAcademicPeriods}
            onSiteSettingsChange={handleSiteSettingsChange}
          />
        )}
        </div>

      </main>

      {/* 3. Footer with #932d16 theme */}
      <Footer contact={contact} />

      {/* ปิดบังหน้าเว็บไว้ชั่วครู่ระหว่างรอค่าตั้งค่า กันหน้าเว็บแวบก่อนหน้าข่าวสาร */}
      {!settingsReady && <div className="fixed inset-0 z-[110] bg-white" />}

      {/* 6. ริบบิ้นไว้อาลัยมุมขวาบน (เปิดจากหลังบ้าน) */}
      {siteSettings?.mourning_ribbon && <MourningRibbon />}

      {/* 7. หน้าข่าวสารก่อนเข้าเว็บไซต์ (เปิดจากหลังบ้าน) */}
      {showWelcome && (
        <WelcomeGate
          mode={siteSettings?.welcome_mode === 'modal' ? 'modal' : 'fullpage'}
          badge={resolveWelcomeBadge(siteSettings?.welcome_badge_enabled, siteSettings?.welcome_badge_text)}
          title={welcomeTitle}
          content={welcomeContent}
          image={welcomeImage}
          buttonText={String(siteSettings?.welcome_button_text || 'เข้าสู่เว็บไซต์')}
          onEnter={handleEnterSite}
        />
      )}

      {/* 5. Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        notice={sessionExpired ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง' : undefined}
        onClose={() => { setIsLoginOpen(false); setSessionExpired(false); }}
        onLoginSuccess={(loggedUser) => {
          setSessionExpired(false);
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
