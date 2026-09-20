import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  SubmissionStatusItem,
  NewsItem,
  AcademicPeriodItem,
  DveDepartmentItem,
  CareerClassroomItem,
  CareerPartnerSchoolItem,
} from '../../types';
import {
  toggleSubmissionOpen,
  getSubmissionStatuses,
  getMySchoolStat,
  submitSchoolStat,
  getNewsList,
  createNews,
  updateNews,
  deleteNews,
  updateSubmissionPermissions,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  createInstitution,
  deleteInstitution,
  getAcademicPeriods,
  createAcademicPeriod,
  deleteAcademicPeriod,
  setCurrentAcademicPeriod,
  reorderNews,
  getDveDepartments,
  saveDveDepartments,
  getCareerClassrooms,
  saveCareerClassrooms,
} from '../../services/api';

import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Search,
  Save,
  PlusCircle,
  Users,
  GraduationCap,
  AlertTriangle,
  School,
  Edit3,
  Image as ImageIcon,
  X,
  Upload,
  UserCheck,
  Building2,
  Sliders,
  UserPlus,
  Camera,
  Loader2,
  Calendar,
  Plus,
  Trash2,
  Star,
  ChevronUp,
  ChevronDown,
  ClipboardList,
  Newspaper,
  Layers,
  ExternalLink,
  BookOpen,
  Printer,
  Download,
  Briefcase,
  Award,
  CheckSquare,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getProgramsArray } from '../dashboard/InstitutionList';
import { exportSuperAdminExcel, exportSchoolAdminExcel } from '../../utils/exportExcel';
import { OfficialReportPrintModal } from '../reports/OfficialReportPrintModal';

interface AdminPortalProps {
  user: UserProfile;
  onRefreshStats: (year?: number, semester?: number) => void;
  onAcademicPeriodsChange?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  user,
  onRefreshStats,
  onAcademicPeriodsChange,
}) => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';


  // ==========================================
  // FLOATING TOAST NOTIFICATION
  // ==========================================
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // ==========================================
  // SUPER ADMIN TABS (ตามภาพต้นแบบ 1-4)
  // ==========================================
  const [superAdminTab, setSuperAdminTab] = useState<'institutions' | 'banners_news' | 'settings_glow' | 'users'>('institutions');

  // ==========================================
  // SUPER ADMIN STATE: TAB 1 (สถานศึกษา)
  // ==========================================
  const [submissionStatuses, setSubmissionStatuses] = useState<SubmissionStatusItem[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [statusSearch, setStatusSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  const [showAddInstitutionModal, setShowAddInstitutionModal] = useState(false);
  const [newInstCode, setNewInstCode] = useState('');
  const [newInstName, setNewInstName] = useState('');
  const [newInstType, setNewInstType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [newInstDirector, setNewInstDirector] = useState('');
  const [newInstPhone, setNewInstPhone] = useState('');
  const [newInstWebsite, setNewInstWebsite] = useState('');
  const [newInstProgramsCount, setNewInstProgramsCount] = useState<number>(12);
  const [newInstProgramsUrl, setNewInstProgramsUrl] = useState('');
  const [creatingInst, setCreatingInst] = useState(false);

  // Super Admin: College Editing Mode
  const [editingCollege, setEditingCollege] = useState<SubmissionStatusItem | null>(null);
  const [loadingCollegeStat, setLoadingCollegeStat] = useState(false);

  // School Admin Portal Tab & Form Section Navigator
  const [schoolPortalTab, setSchoolPortalTab] = useState<'stats_form' | 'news_view'>('stats_form');
  const [activeFormSection, setActiveFormSection] = useState<'all' | 'general' | 'teachers' | 'grades' | 'dve' | 'career' | 'graduates'>('all');

  // ==========================================
  // SUPER ADMIN STATE: TAB 2 (ข่าวสาร & Carousel)
  // ==========================================
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCoverImage, setNewsCoverImage] = useState<string | null>(null);
  const [newsLinkUrl, setNewsLinkUrl] = useState('');
  const [creatingNews, setCreatingNews] = useState(false);
  const newsFileInputRef = useRef<HTMLInputElement>(null);

  // Contact Info State (for Footer / General)
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactAddress, setContactAddress] = useState('ศูนย์ส่งเสริมและพัฒนาอาชีวศึกษาภาคตะวันออกเฉียงเหนือ จ.อุดรธานี 41000');
  const [contactPhone, setContactPhone] = useState('042-221538');
  const [contactFacebook, setContactFacebook] = useState('https://facebook.com/udpvec');

  // ==========================================
  // SUPER ADMIN STATE: TAB 3 (ตั้งค่าสิทธิ์ & แสงกระพริบ)
  // ==========================================
  const [submissionOpen, setSubmissionOpen] = useState<boolean>(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [allowSectionGeneral, setAllowSectionGeneral] = useState<boolean>(true);
  const [allowSectionTeachers, setAllowSectionTeachers] = useState<boolean>(true);
  const [allowSectionGrades, setAllowSectionGrades] = useState<boolean>(true);
  const [allowSectionDve, setAllowSectionDve] = useState<boolean>(true);
  const [allowSectionCareer, setAllowSectionCareer] = useState<boolean>(true);
  const [allowSectionGraduates, setAllowSectionGraduates] = useState<boolean>(true);
  const [glowSection, setGlowSection] = useState<string>('none');
  const [allowSchoolExport, setAllowSchoolExport] = useState<boolean>(false);
  const [savingPermissions, setSavingPermissions] = useState<boolean>(false);

  // Print Official Report Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printSingleSchoolData, setPrintSingleSchoolData] = useState<{
    institution: any;
    formData: any;
  } | null>(null);

  // ==========================================
  // SUPER ADMIN STATE: TAB 4 (จัดการผู้ใช้งาน)
  // ==========================================
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [userFullName, setUserFullName] = useState('');
  const [userRole, setUserRole] = useState<'SUPER_ADMIN' | 'SCHOOL_ADMIN'>('SCHOOL_ADMIN');
  const [userInstitutionId, setUserInstitutionId] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // ==========================================
  // ACADEMIC PERIODS STATE (รอบปีการศึกษาและภาคเรียน)
  // ==========================================
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriodItem[]>([
    { id: '2568-1', year: 2568, semester: 1, isCurrent: true },
    { id: '2568-2', year: 2568, semester: 2, isCurrent: false },
    { id: '2567-2', year: 2567, semester: 2, isCurrent: false },
    { id: '2567-1', year: 2567, semester: 1, isCurrent: false },
  ]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [newPeriodYear, setNewPeriodYear] = useState<number>(2568);
  const [newPeriodSemester, setNewPeriodSemester] = useState<number>(1);
  const [newPeriodIsCurrent, setNewPeriodIsCurrent] = useState<boolean>(false);
  const [addingPeriod, setAddingPeriod] = useState<boolean>(false);

  // ==========================================
  // SCHOOL ADMIN / EDITING FORM STATE
  // ==========================================
  const [selectedYear, setSelectedYear] = useState<number>(2568);
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [schoolOpenStatus, setSchoolOpenStatus] = useState<boolean>(true);
  const [schoolInstitution, setSchoolInstitution] = useState<any>(null);
  const [loadingSchoolStat, setLoadingSchoolStat] = useState(false);
  const [savingStat, setSavingStat] = useState(false);

  const [schoolPermissions, setSchoolPermissions] = useState({
    allowSectionGeneral: true,
    allowSectionTeachers: true,
    allowSectionGrades: true,
    allowSectionDve: true,
    allowSectionCareer: true,
    allowSectionGraduates: true,
    glowSection: 'none',
    allowSchoolExport: false,
  });

  const [formData, setFormData] = useState({
    academicYear: 2568,
    semester: 1,
    directorName: '',
    photoUrl: '',
    totalExecutives: 1,
    totalTeachers: 0,
    totalStaff: 0,
    programsCount: 12,
    programsList: [] as string[],
    programsUrl: '',
    phone: '',
    website: '',
    maleStudents: 0,
    femaleStudents: 0,
    vocCert1: 0,
    vocCert2: 0,
    vocCert3: 0,
    highVocCert1: 0,
    highVocCert2: 0,
    bachelorCount: 0,

    // กลุ่ม 2: นักเรียนศึกษาต่อ แต่ยังไม่สำเร็จการศึกษา
    pendingGradM3: 0,
    pendingGradM6: 0,
    pendingGradVoc3: 0,

    // กลุ่ม 3: สารสนเทศอาชีวศึกษา
    dveStudentsCount: 0,
    dualStudyCount: 0,
    dualDegreeCount: 0,
    fttAssessment: false,

    // กลุ่ม 4: บุคลากรทางการศึกษา ชาย-หญิง และวุฒิการศึกษา
    maleTeachers: 0,
    femaleTeachers: 0,
    degreeAssociateMale: 0,
    degreeAssociateFemale: 0,
    degreeBachelorMale: 0,
    degreeBachelorFemale: 0,
    degreeMasterMale: 0,
    degreeMasterFemale: 0,
    degreeDoctorMale: 0,
    degreeDoctorFemale: 0,
    civilTeachersMale: 0,
    civilTeachersFemale: 0,
    hiredTeachersMale: 0,
    hiredTeachersFemale: 0,

    gradVocCertCount: 0,
    gradHighVocCertCount: 0,
    employedInField: 0,
    employedOutField: 0,
    employedFreelance: 0,
    furtherStudyCount: 0,
    unemployedCount: 0,
    workGov: 0,
    workPrivate: 0,
    workSelf: 0,
  });

  // State สำหรับกลุ่ม 1: แผนกวิชาทวิภาคี
  const [dveDepartments, setDveDepartments] = useState<DveDepartmentItem[]>([]);
  const [savingDve, setSavingDve] = useState(false);

  // State สำหรับกลุ่ม 5: ห้องเรียนอาชีพ
  const [careerClassrooms, setCareerClassrooms] = useState<CareerClassroomItem[]>([]);
  const [savingCareer, setSavingCareer] = useState(false);

  // ปรับโครงสร้างข้อมูลห้องเรียนอาชีพให้มี partnerSchools ครบถ้วนเสมอ
  const normalizeCareerList = (list: CareerClassroomItem[]): CareerClassroomItem[] => {
    return (list || []).map((c) => {
      let schools: CareerPartnerSchoolItem[] = c.partnerSchools ? [...c.partnerSchools] : [];
      if (schools.length === 0) {
        if (c.partnerSchoolNames) {
          const names = c.partnerSchoolNames.split(',').map((s) => s.trim()).filter(Boolean);
          const perSchool = Math.max(0, Math.floor((c.studentCount || 0) / (names.length || 1)));
          schools = names.map((sName, idx) => ({
            schoolName: sName,
            studentCount: idx === names.length - 1 ? Math.max(0, (c.studentCount || 0) - perSchool * (names.length - 1)) : perSchool,
          }));
        } else {
          schools = [{ schoolName: '', studentCount: c.studentCount || 0 }];
        }
      }
      return {
        ...c,
        partnerSchools: schools,
        partnerSchoolCount: schools.length,
        studentCount: schools.reduce((sum, s) => sum + (Number(s.studentCount) || 0), 0),
      };
    });
  };


  // Client-side Image compression helper via HTML5 Canvas
  const compressImage = (file: File, maxWidth = 1280, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ==========================================
  // LOAD INITIAL DATA
  // ==========================================
  const loadPeriodsData = async () => {
    try {
      setLoadingPeriods(true);
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
    } finally {
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    loadPeriodsData();
    if (isSuperAdmin) {
      loadSuperAdminData();
      loadNewsData();
      loadUsersData();
    } else {
      loadSchoolAdminData(selectedYear, selectedSemester);
    }
  }, [isSuperAdmin]);

  const loadSuperAdminData = () => {
    setLoadingStatuses(true);
    getSubmissionStatuses(selectedYear, selectedSemester)
      .then((res) => {
        setSubmissionStatuses(res.data);
        setSubmissionOpen(res.isSubmissionOpen);
        if (res.permissions) {
          if (res.permissions.allowSectionGeneral !== undefined) setAllowSectionGeneral(res.permissions.allowSectionGeneral);
          if (res.permissions.allowSectionTeachers !== undefined) setAllowSectionTeachers(res.permissions.allowSectionTeachers);
          if (res.permissions.allowSectionGrades !== undefined) setAllowSectionGrades(res.permissions.allowSectionGrades);
          if (res.permissions.allowSectionDve !== undefined) setAllowSectionDve(res.permissions.allowSectionDve);
          if (res.permissions.allowSectionCareer !== undefined) setAllowSectionCareer(res.permissions.allowSectionCareer);
          if (res.permissions.allowSectionGraduates !== undefined) setAllowSectionGraduates(res.permissions.allowSectionGraduates);
          if (res.permissions.glowSection) setGlowSection(res.permissions.glowSection);
          if (res.permissions.allowSchoolExport !== undefined) setAllowSchoolExport(res.permissions.allowSchoolExport);
        }
      })
      .catch((err) => console.error('Failed to load submission statuses:', err))
      .finally(() => setLoadingStatuses(false));
  };

  const loadNewsData = () => {
    setLoadingNews(true);
    getNewsList({ limit: 50 })
      .then((res) => setNewsList(res.data))
      .catch((err) => console.error('Failed to load news:', err))
      .finally(() => setLoadingNews(false));
  };

  const loadUsersData = () => {
    setLoadingUsers(true);
    getUsers()
      .then((data) => setUsersList(data))
      .catch((err) => console.error('Failed to load users:', err))
      .finally(() => setLoadingUsers(false));
  };

  const loadSchoolAdminData = (year: number, semester: number) => {
    setLoadingSchoolStat(true);
    const myInstId = user.institution?.id;
    Promise.all([
      getMySchoolStat(year, semester),
      getDveDepartments(year, semester, myInstId),
      getCareerClassrooms(year, semester, myInstId),
    ])
      .then(([res, dveList, careerList]: [any, any, any]) => {
        setSchoolOpenStatus(res.isSubmissionOpen);
        setSchoolInstitution(res.institution);
        if (res.permissions) {
          setSchoolPermissions(res.permissions);
        }
        if (res.data) {
          populateFormWithData(res.data, res.institution);
        } else {
          resetFormForYear(year, semester, res.institution);
        }
        setDveDepartments(dveList || []);
        setCareerClassrooms(normalizeCareerList(careerList || []));
      })
      .catch((err) => console.error('Failed to load school stat:', err))
      .finally(() => setLoadingSchoolStat(false));
  };

  const populateFormWithData = (data: any, inst?: any) => {
    const director = inst?.personnels?.[0];
    const currentPrograms = getProgramsArray(inst?.programsList);
    const pCount = inst?.programsCount ?? 12;
    const initialProgramsList = Array.from({ length: pCount }, (_, i) => currentPrograms[i] || '');

    setFormData({
      academicYear: data.academicYear || selectedYear,
      semester: data.semester || selectedSemester,
      directorName: director?.name || '',
      photoUrl: director?.photoUrl || '',
      phone: inst?.phone || '',
      website: inst?.website || '',
      programsCount: pCount,
      programsList: initialProgramsList,
      programsUrl: inst?.programsUrl || '',
      maleStudents: data.maleStudents || 0,
      femaleStudents: data.femaleStudents || 0,
      vocCert1: data.vocCert1 || 0,
      vocCert2: data.vocCert2 || 0,
      vocCert3: data.vocCert3 || 0,
      highVocCert1: data.highVocCert1 || 0,
      highVocCert2: data.highVocCert2 || 0,
      bachelorCount: data.bachelorCount || 0,
      totalExecutives: data.totalExecutives ?? 1,
      totalTeachers: data.totalTeachers || 0,
      totalStaff: data.totalStaff || 0,

      // กลุ่ม 2: นักเรียนศึกษาต่อ แต่ยังไม่สำเร็จการศึกษา
      pendingGradM3: data.pendingGradM3 || 0,
      pendingGradM6: data.pendingGradM6 || 0,
      pendingGradVoc3: data.pendingGradVoc3 || 0,

      // กลุ่ม 3: สารสนเทศอาชีวศึกษา
      dveStudentsCount: data.dveStudentsCount || 0,
      dualStudyCount: data.dualStudyCount || 0,
      dualDegreeCount: data.dualDegreeCount || 0,
      fttAssessment: Boolean(data.fttAssessment),

      // กลุ่ม 4: บุคลากรทางการศึกษา ชาย-หญิง และวุฒิการศึกษา
      maleTeachers: data.maleTeachers || 0,
      femaleTeachers: data.femaleTeachers || 0,
      degreeAssociateMale: data.degreeAssociateMale || 0,
      degreeAssociateFemale: data.degreeAssociateFemale || 0,
      degreeBachelorMale: data.degreeBachelorMale || 0,
      degreeBachelorFemale: data.degreeBachelorFemale || 0,
      degreeMasterMale: data.degreeMasterMale || 0,
      degreeMasterFemale: data.degreeMasterFemale || 0,
      degreeDoctorMale: data.degreeDoctorMale || 0,
      degreeDoctorFemale: data.degreeDoctorFemale || 0,
      civilTeachersMale: data.civilTeachersMale || 0,
      civilTeachersFemale: data.civilTeachersFemale || 0,
      hiredTeachersMale: data.hiredTeachersMale || 0,
      hiredTeachersFemale: data.hiredTeachersFemale || 0,

      gradVocCertCount: data.gradVocCertCount || 0,
      gradHighVocCertCount: data.gradHighVocCertCount || 0,
      employedInField: data.employedInField || 0,
      employedOutField: data.employedOutField || 0,
      employedFreelance: data.employedFreelance || 0,
      furtherStudyCount: data.furtherStudyCount || 0,
      unemployedCount: data.unemployedCount || 0,
      workGov: data.workGov || 0,
      workPrivate: data.workPrivate || 0,
      workSelf: data.workSelf || 0,
    });
  };

  const resetFormForYear = (year: number, semester: number, inst?: any) => {
    const director = inst?.personnels?.[0];
    const currentPrograms = getProgramsArray(inst?.programsList);
    const pCount = inst?.programsCount ?? 12;
    const initialProgramsList = Array.from({ length: pCount }, (_, i) => currentPrograms[i] || '');

    setFormData({
      academicYear: year,
      semester: semester,
      directorName: director?.name || '',
      photoUrl: director?.photoUrl || '',
      phone: inst?.phone || '',
      website: inst?.website || '',
      programsCount: pCount,
      programsList: initialProgramsList,
      programsUrl: inst?.programsUrl || '',
      maleStudents: 0,
      femaleStudents: 0,
      vocCert1: 0,
      vocCert2: 0,
      vocCert3: 0,
      highVocCert1: 0,
      highVocCert2: 0,
      bachelorCount: 0,
      totalExecutives: 1,
      totalTeachers: 0,
      totalStaff: 0,

      // กลุ่ม 2: นักเรียนศึกษาต่อ แต่ยังไม่สำเร็จการศึกษา
      pendingGradM3: 0,
      pendingGradM6: 0,
      pendingGradVoc3: 0,

      // กลุ่ม 3: สารสนเทศอาชีวศึกษา
      dveStudentsCount: 0,
      dualStudyCount: 0,
      dualDegreeCount: 0,
      fttAssessment: false,

      // กลุ่ม 4: บุคลากรทางการศึกษา ชาย-หญิง และวุฒิการศึกษา
      maleTeachers: 0,
      femaleTeachers: 0,
      degreeAssociateMale: 0,
      degreeAssociateFemale: 0,
      degreeBachelorMale: 0,
      degreeBachelorFemale: 0,
      degreeMasterMale: 0,
      degreeMasterFemale: 0,
      degreeDoctorMale: 0,
      degreeDoctorFemale: 0,
      civilTeachersMale: 0,
      civilTeachersFemale: 0,
      hiredTeachersMale: 0,
      hiredTeachersFemale: 0,

      gradVocCertCount: 0,
      gradHighVocCertCount: 0,
      employedInField: 0,
      employedOutField: 0,
      employedFreelance: 0,
      furtherStudyCount: 0,
      unemployedCount: 0,
      workGov: 0,
      workPrivate: 0,
      workSelf: 0,
    });
  };

  // Change Year or Semester in Form
  const handleYearSemesterChange = (year: number, semester: number) => {
    setSelectedYear(year);
    setSelectedSemester(semester);
    if (editingCollege) {
      handleStartEditCollege(editingCollege, year, semester);
    } else if (!isSuperAdmin) {
      loadSchoolAdminData(year, semester);
    }
  };

  // Super Admin: Start Editing Any College
  const handleStartEditCollege = (college: SubmissionStatusItem, year = selectedYear, sem = selectedSemester) => {
    setEditingCollege(college);
    setLoadingCollegeStat(true);
    Promise.all([
      getMySchoolStat(year, sem, college.id),
      getDveDepartments(year, sem, college.id),
      getCareerClassrooms(year, sem, college.id),
    ])
      .then(([res, dveList, careerList]: [any, any, any]) => {
        if (res.data) {
          populateFormWithData(res.data, res.institution);
        } else {
          resetFormForYear(year, sem, res.institution);
        }
        setDveDepartments(dveList || []);
        setCareerClassrooms(normalizeCareerList(careerList || []));
        setTimeout(() => {
          document.getElementById('college-edit-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      })
      .catch((err) => console.error('Failed to load college stat:', err))
      .finally(() => setLoadingCollegeStat(false));
  };

  // ==========================================
  // HANDLERS: แผนกวิชาทวิภาคี (กลุ่ม 1)
  // ==========================================
  const handleAddDveRow = () => {
    setDveDepartments((prev) => [...prev, { departmentName: '', studentCount: 0 }]);
  };

  const handleUpdateDveRow = (index: number, field: keyof DveDepartmentItem, value: any) => {
    setDveDepartments((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveDveRow = (index: number) => {
    setDveDepartments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDve = async () => {
    try {
      setSavingDve(true);
      const targetInstId = isSuperAdmin ? editingCollege?.id : schoolInstitution?.id;
      const res = await saveDveDepartments({
        academicYear: selectedYear,
        semester: selectedSemester,
        institutionId: targetInstId,
        departments: dveDepartments,
      });
      setDveDepartments(res.data || []);
      const total = (res.data || []).reduce((sum: number, d: any) => sum + (Number(d.studentCount) || 0), 0);
      setFormData((prev) => ({ ...prev, dveStudentsCount: total }));
      showToast('success', 'บันทึกข้อมูลทวิภาคีสำเร็จ!', `บันทึกข้อมูล ${res.data?.length || 0} แผนกวิชาเรียบร้อยแล้ว`);
      onRefreshStats(selectedYear, selectedSemester);
    } catch (err: any) {
      showToast('error', 'บันทึกทวิภาคีไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSavingDve(false);
    }
  };

  // ==========================================
  // HANDLERS: ห้องเรียนอาชีพ (กลุ่ม 5) - Relational 1-to-Many
  // ==========================================

  const handleAddCareerRow = () => {
    setCareerClassrooms((prev) => [
      ...prev,
      {
        courseName: '',
        partnerSchoolCount: 1,
        partnerSchoolNames: '',
        studentCount: 0,
        trainingType: 'SHORT_COURSE',
        learningFormat: 'ONSITE',
        partnerSchools: [
          { schoolName: '', studentCount: 0 }
        ],
      },
    ]);
  };

  const handleUpdateCareerRow = (index: number, field: keyof CareerClassroomItem, value: any) => {
    setCareerClassrooms((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveCareerRow = (index: number) => {
    setCareerClassrooms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPartnerSchool = (courseIndex: number) => {
    setCareerClassrooms((prev) => {
      const next = [...prev];
      const course = { ...next[courseIndex] };
      const currentSchools = course.partnerSchools ? [...course.partnerSchools] : [];
      currentSchools.push({ schoolName: '', studentCount: 0 });
      course.partnerSchools = currentSchools;
      course.partnerSchoolCount = currentSchools.length;
      course.studentCount = currentSchools.reduce((sum, s) => sum + (Number(s.studentCount) || 0), 0);
      course.partnerSchoolNames = currentSchools.map((s) => s.schoolName).filter(Boolean).join(', ');
      next[courseIndex] = course;
      return next;
    });
  };

  const handleUpdatePartnerSchool = (
    courseIndex: number,
    schoolIndex: number,
    field: 'schoolName' | 'studentCount',
    value: any
  ) => {
    setCareerClassrooms((prev) => {
      const next = [...prev];
      const course = { ...next[courseIndex] };
      const currentSchools = course.partnerSchools ? [...course.partnerSchools] : [];
      currentSchools[schoolIndex] = {
        ...currentSchools[schoolIndex],
        [field]: field === 'studentCount' ? Math.max(0, Number(value) || 0) : value,
      };
      course.partnerSchools = currentSchools;
      course.partnerSchoolCount = currentSchools.length;
      course.studentCount = currentSchools.reduce((sum, s) => sum + (Number(s.studentCount) || 0), 0);
      course.partnerSchoolNames = currentSchools.map((s) => s.schoolName).filter(Boolean).join(', ');
      next[courseIndex] = course;
      return next;
    });
  };

  const handleRemovePartnerSchool = (courseIndex: number, schoolIndex: number) => {
    setCareerClassrooms((prev) => {
      const next = [...prev];
      const course = { ...next[courseIndex] };
      const currentSchools = course.partnerSchools ? [...course.partnerSchools] : [];
      const updatedSchools = currentSchools.filter((_, idx) => idx !== schoolIndex);
      course.partnerSchools = updatedSchools.length > 0 ? updatedSchools : [{ schoolName: '', studentCount: 0 }];
      course.partnerSchoolCount = course.partnerSchools.length;
      course.studentCount = course.partnerSchools.reduce((sum, s) => sum + (Number(s.studentCount) || 0), 0);
      course.partnerSchoolNames = course.partnerSchools.map((s) => s.schoolName).filter(Boolean).join(', ');
      next[courseIndex] = course;
      return next;
    });
  };

  const handleSaveCareer = async () => {
    try {
      setSavingCareer(true);
      const targetInstId = isSuperAdmin ? editingCollege?.id : schoolInstitution?.id;
      const res = await saveCareerClassrooms({
        academicYear: selectedYear,
        semester: selectedSemester,
        institutionId: targetInstId,
        classrooms: careerClassrooms,
      });
      setCareerClassrooms(normalizeCareerList(res.data || []));
      showToast('success', 'บันทึกห้องเรียนอาชีพสำเร็จ!', `บันทึกข้อมูล ${res.data?.length || 0} หลักสูตรเรียบร้อยแล้ว`);
      onRefreshStats(selectedYear, selectedSemester);
    } catch (err: any) {
      showToast('error', 'บันทึกห้องเรียนอาชีพไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSavingCareer(false);
    }
  };


  // Super Admin: Toggle Open/Close Submission Window
  const handleToggleSubmission = async () => {
    const nextState = !submissionOpen;
    const confirmMsg = nextState
      ? 'ยืนยันการ "เปิดระบบ" ให้สถานศึกษาทุกแห่งบันทึกข้อมูลสถิติ?'
      : 'ยืนยันการ "ปิดระบบ" รับการบันทึกข้อมูล? (สถานศึกษาจะไม่สามารถแก้ไขหรือส่งข้อมูลได้)';

    if (!window.confirm(confirmMsg)) return;

    setToggleLoading(true);
    try {
      const res = await toggleSubmissionOpen(nextState);
      setSubmissionOpen(res.is_data_submission_open);
      loadSuperAdminData();
      showToast(
        'success',
        'ปรับปรุงสถานะระบบสำเร็จ',
        nextState ? 'เปิดระบบรับการกรอกข้อมูลแล้ว' : 'ปิดระบบรับการกรอกข้อมูลเรียบร้อยแล้ว'
      );
    } catch (err: any) {
      showToast('error', 'เกิดข้อผิดพลาด', err.response?.data?.message || err.message);
    } finally {
      setToggleLoading(false);
    }
  };

  // Super Admin: Save Granular Permissions & Glow Effect (Tab 3)
  const handleSavePermissions = async () => {
    try {
      setSavingPermissions(true);
      await updateSubmissionPermissions({
        allowSectionGeneral,
        allowSectionTeachers,
        allowSectionGrades,
        allowSectionDve,
        allowSectionCareer,
        allowSectionGraduates,
        glowSection,
        allowSchoolExport,
      });
      showToast('success', 'บันทึกการตั้งค่าสำเร็จ!', 'บันทึกการเปิด-ปิดสิทธิ์และจุดเด่นแสงกระพริบเรียบร้อยแล้ว');
    } catch (err: any) {
      showToast('error', 'บันทึกไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSavingPermissions(false);
    }
  };

  // Super Admin: สวิตช์ด่วนสำหรับเปิด-ปิดสิทธิ์ Export Excel และพิมพ์รายงานของสถานศึกษา
  const handleToggleSchoolExport = async (newValue: boolean) => {
    setAllowSchoolExport(newValue);
    try {
      await updateSubmissionPermissions({
        allowSectionGeneral,
        allowSectionTeachers,
        allowSectionGrades,
        allowSectionDve,
        allowSectionCareer,
        allowSectionGraduates,
        glowSection,
        allowSchoolExport: newValue,
      });
      showToast(
        'success',
        newValue ? 'เปิดสิทธิ์ให้สถานศึกษาแล้ว' : 'ปิดสิทธิ์ดาวน์โหลดแล้ว',
        newValue
          ? 'แอดมินสถานศึกษาสามารถ Export Excel และพิมพ์รายงานได้เรียบร้อยแล้ว'
          : 'ซ่อนปุ่ม Export Excel และ Print สำหรับแอดมินสถานศึกษาเรียบร้อยแล้ว'
      );
    } catch (err: any) {
      showToast('error', 'ไม่สามารถบันทึกสิทธิ์ได้', err.response?.data?.message || err.message);
      setAllowSchoolExport(!newValue);
    }
  };

  // Super Admin: ส่งออกไฟล์ Excel สรุปข้อมูล 13 สถานศึกษา
  const handleSuperAdminExportExcel = () => {
    if (submissionStatuses.length === 0) {
      showToast('error', 'ไม่พบข้อมูล', 'ไม่มีข้อมูลสถานศึกษาสำหรับส่งออก');
      return;
    }
    exportSuperAdminExcel(submissionStatuses, selectedYear, selectedSemester);
    showToast('success', 'ส่งออกข้อมูลสำเร็จ!', 'สร้างและดาวน์โหลดไฟล์ Excel สรุปข้อมูลทั้งจังหวัดเรียบร้อยแล้ว');
  };

  // Super Admin: เปิดหน้าต่างพิมพ์รายงานราชการทางการ (13 สถานศึกษา)
  const handleSuperAdminPrintReport = () => {
    setPrintSingleSchoolData(null);
    setShowPrintModal(true);
  };

  // School Admin (หรือ Super Admin เมื่อแก้ไขวิทยาลัยเดียว): ส่งออกไฟล์ Excel ของวิทยาลัย
  const handleSchoolAdminExportExcel = () => {
    const targetInst = isSuperAdmin ? editingCollege : (schoolInstitution || user.institution);
    exportSchoolAdminExcel(targetInst, formData, selectedYear, selectedSemester);
    showToast(
      'success',
      'ส่งออกข้อมูลสำเร็จ!',
      `ดาวน์โหลดไฟล์ Excel ของ ${targetInst?.name || 'สถานศึกษา'} เรียบร้อยแล้ว`
    );
  };

  // School Admin (หรือ Super Admin เมื่อแก้ไขวิทยาลัยเดียว): พิมพ์รายงานทางการของวิทยาลัย
  const handleSchoolAdminPrintReport = () => {
    const targetInst = isSuperAdmin ? editingCollege : (schoolInstitution || user.institution);
    setPrintSingleSchoolData({
      institution: targetInst,
      formData: formData,
    });
    setShowPrintModal(true);
  };

  // Super Admin: Academic Periods Handlers (Tab 3)
  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddingPeriod(true);
      const res = await createAcademicPeriod({
        year: Number(newPeriodYear),
        semester: Number(newPeriodSemester),
        isCurrent: newPeriodIsCurrent,
      });
      setAcademicPeriods(Array.isArray(res) ? res : (res as any)?.data || []);
      onAcademicPeriodsChange?.();
      showToast('success', 'เพิ่มรอบข้อมูลสำเร็จ!', `เปิดรอบปีการศึกษา ${newPeriodYear} ภาคเรียนที่ ${newPeriodSemester} แล้ว`);
      setNewPeriodIsCurrent(false);
    } catch (err: any) {
      showToast('error', 'เพิ่มรอบข้อมูลไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setAddingPeriod(false);
    }
  };

  const handleDeletePeriod = async (p: AcademicPeriodItem) => {
    if (!window.confirm(`ยืนยันการลบรอบปีการศึกษา ${p.year} ภาคเรียนที่ ${p.semester}?`)) return;
    try {
      const res = await deleteAcademicPeriod(p.id);
      setAcademicPeriods(Array.isArray(res) ? res : (res as any)?.data || []);
      onAcademicPeriodsChange?.();
      showToast('success', 'ลบรอบข้อมูลสำเร็จ', `ลบรอบปีการศึกษา ${p.year} ภาคเรียนที่ ${p.semester} เรียบร้อยแล้ว`);
    } catch (err: any) {
      showToast('error', 'ลบรอบข้อมูลไม่สำเร็จ', err.response?.data?.message || err.message);
    }
  };

  const handleSetCurrentPeriod = async (p: AcademicPeriodItem) => {
    try {
      const res = await setCurrentAcademicPeriod(p.id);
      setAcademicPeriods(Array.isArray(res) ? res : (res as any)?.data || []);
      setSelectedYear(p.year);
      setSelectedSemester(p.semester);
      onAcademicPeriodsChange?.();
      showToast('success', 'ตั้งรอบปัจจุบันสำเร็จ!', `รอบปีการศึกษา ${p.year} ภาคเรียนที่ ${p.semester} เป็นรอบปัจจุบัน`);
    } catch (err: any) {
      showToast('error', 'ตั้งรอบปัจจุบันไม่สำเร็จ', err.response?.data?.message || err.message);
    }
  };


  // Super Admin: Photo upload handler for News (with canvas resize to avoid 413)
  const handleNewsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 1280, 0.82);
      setNewsCoverImage(compressed);
    } catch (err) {
      console.error('Failed to process image:', err);
      showToast('error', 'ข้อผิดพลาด', 'ไม่สามารถประมวลผลไฟล์ภาพได้');
    }
  };

  // Super Admin: Submit / Edit News
  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      showToast('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกหัวข้อข่าวและเนื้อหาข่าว');
      return;
    }

    try {
      setCreatingNews(true);
      if (editingNewsId) {
        await updateNews(editingNewsId, {
          title: newsTitle,
          content: newsContent,
          coverImageUrl: newsCoverImage || null,
          linkUrl: newsLinkUrl.trim() || null,
        });
        showToast('success', 'แก้ไขข่าวสารสำเร็จ!', 'ข้อมูลข่าวประชาสัมพันธ์ได้รับการปรับปรุงเรียบร้อยแล้ว');
      } else {
        await createNews({
          title: newsTitle,
          content: newsContent,
          category: 'BANNER_SLIDE',
          coverImageUrl: newsCoverImage || undefined,
          linkUrl: newsLinkUrl.trim() || undefined,
        });
        showToast('success', 'เผยแพร่ข่าวสารสำเร็จ!', 'ข่าวประชาสัมพันธ์ถูกเพิ่มเข้าระบบและแสดงบนหน้าแรกเรียบร้อยแล้ว');
      }

      setEditingNewsId(null);
      setNewsTitle('');
      setNewsContent('');
      setNewsCoverImage(null);
      setNewsLinkUrl('');
      setShowAddNewsForm(false);
      loadNewsData();
      onRefreshStats();
    } catch (err: any) {
      showToast('error', editingNewsId ? 'แก้ไขข่าวไม่สำเร็จ' : 'เผยแพร่ข่าวไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setCreatingNews(false);
    }
  };

  // Super Admin: Start Editing News
  const handleStartEditNews = (item: NewsItem) => {
    setEditingNewsId(item.id);
    setNewsTitle(item.title);
    setNewsContent(item.content);
    setNewsCoverImage(item.coverImageUrl || null);
    setNewsLinkUrl(item.linkUrl || '');
    setShowAddNewsForm(true);
    // Smooth scroll to form
    document.getElementById('news-form-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Super Admin: Cancel News Form
  const handleCancelNewsForm = () => {
    setEditingNewsId(null);
    setNewsTitle('');
    setNewsContent('');
    setNewsCoverImage(null);
    setNewsLinkUrl('');
    setShowAddNewsForm(false);
  };

  // Super Admin: Delete News
  const handleDeleteNews = async (id: string, title: string) => {
    if (!window.confirm(`ยืนยันการลบข่าวสาร: "${title}"?`)) return;
    try {
      await deleteNews(id);
      loadNewsData();
      showToast('success', 'ลบข่าวสำเร็จ', 'ข่าวประชาสัมพันธ์ถูกนำออกจากระบบแล้ว');
    } catch (err: any) {
      showToast('error', 'ลบข่าวไม่สำเร็จ', err.response?.data?.message || err.message);
    }
  };

  // Super Admin: Move News Up / Down
  const handleMoveNews = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newsList.length) return;

    const updatedList = [...newsList];
    const [movedItem] = updatedList.splice(index, 1);
    updatedList.splice(targetIndex, 0, movedItem);

    setNewsList(updatedList);

    try {
      const orderedIds = updatedList.map((item) => item.id);
      await reorderNews(orderedIds);
      showToast('success', 'ปรับลำดับข่าวสำเร็จ', `ย้าย "${movedItem.title}" ไปลำดับที่ ${targetIndex + 1} แล้ว`);
      onRefreshStats();
    } catch (err: any) {
      showToast('error', 'ปรับลำดับข่าวไม่สำเร็จ', err.response?.data?.message || err.message);
      loadNewsData();
    }
  };

  // Super Admin: Save Contact Info
  const handleSaveContactInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setShowContactModal(false);
    showToast('success', 'บันทึกข้อมูลติดต่อสำเร็จ', 'ข้อมูลติดต่อ สอจ.อุดรธานี ได้รับการอัปเดตเรียบร้อยแล้ว');
  };

  // Super Admin: Add New Institution (Modal)
  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingInst(true);
      await createInstitution({
        code: newInstCode,
        name: newInstName,
        type: newInstType,
        directorName: newInstDirector,
        phone: newInstPhone,
        website: newInstWebsite,
        programsCount: Number(newInstProgramsCount) || 12,
        programsUrl: newInstProgramsUrl || undefined,
      });
      setShowAddInstitutionModal(false);
      setNewInstCode('');
      setNewInstName('');
      setNewInstDirector('');
      setNewInstPhone('');
      setNewInstWebsite('');
      setNewInstProgramsCount(12);
      setNewInstProgramsUrl('');
      loadSuperAdminData();
      showToast('success', 'เพิ่มสถานศึกษาสำเร็จ!', `เพิ่ม ${newInstName} เข้าระบบเรียบร้อยแล้ว`);
    } catch (err: any) {
      showToast('error', 'ไม่สามารถเพิ่มสถานศึกษาได้', err.response?.data?.message || err.message);
    } finally {
      setCreatingInst(false);
    }
  };

  // Super Admin: Delete Institution
  const handleDeleteCollege = async (college: SubmissionStatusItem) => {
    const confirmDelete = window.confirm(
      `⚠️ ยืนยันการลบสถานศึกษา?\n\nคุณต้องการลบ "${college.name}" (รหัส ${college.code}) ออกจากระบบหรือไม่?\n\n*คำเตือน: ข้อมูลสถิติ, ข้อมูลบุคลากร, แผนกทวิภาคี และบัญชีผู้ดูแลของสถานศึกษานี้จะถูกลบทั้งหมดและไม่สามารถกู้คืนได้!`
    );
    if (!confirmDelete) return;

    try {
      await deleteInstitution(college.id);
      if (editingCollege?.id === college.id) {
        setEditingCollege(null);
      }
      loadSuperAdminData();
      showToast('success', 'ลบสถานศึกษาสำเร็จ', `ลบสถานศึกษา "${college.name}" ออกจากระบบเรียบร้อยแล้ว`);
    } catch (err: any) {
      console.error('Failed to delete institution:', err);
      showToast('error', 'ไม่สามารถลบสถานศึกษาได้', err.response?.data?.message || err.message);
    }
  };

  // Super Admin: Add / Edit User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingUser(true);
      if (editingUserId) {
        await updateUser(editingUserId, {
          email: userEmail,
          password: userPassword || undefined,
          fullName: userFullName,
          role: userRole,
          institutionId: userInstitutionId || undefined,
        });
        showToast('success', 'อัปเดตผู้ใช้งานสำเร็จ!', `แก้ไขข้อมูลบัญชี ${userEmail} เรียบร้อยแล้ว`);
      } else {
        await createUser({
          email: userEmail,
          password: userPassword,
          fullName: userFullName,
          role: userRole,
          institutionId: userInstitutionId || undefined,
        });
        showToast('success', 'สร้างบัญชีสำเร็จ!', `สร้างบัญชีผู้ใช้งาน ${userEmail} เรียบร้อยแล้ว`);
      }
      setShowUserModal(false);
      setEditingUserId(null);
      setUserEmail('');
      setUserPassword('');
      setUserFullName('');
      loadUsersData();
    } catch (err: any) {
      showToast('error', 'บันทึกผู้ใช้ไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUserItem = async (id: string, email: string) => {
    if (!window.confirm(`ยืนยันการลบบัญชีผู้ใช้: "${email}"?`)) return;
    try {
      await deleteUser(id);
      loadUsersData();
      showToast('success', 'ลบบัญชีสำเร็จ', `ลบบัญชี ${email} เรียบร้อยแล้ว`);
    } catch (err: any) {
      showToast('error', 'ลบบัญชีไม่สำเร็จ', err.response?.data?.message || err.message);
    }
  };

  // Form Field Updater
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ปรับจำนวนสาขาวิชาในแบบฟอร์ม -> ปรับจำนวนช่องกรอกอัตโนมัติ
  const handleProgramsCountChangeInForm = (newCount: number) => {
    const validCount = Math.max(1, Math.min(60, newCount));
    setFormData((prev) => {
      const currentList = prev.programsList || [];
      const updated = [...currentList];
      if (validCount > updated.length) {
        while (updated.length < validCount) updated.push('');
      } else {
        return {
          ...prev,
          programsCount: validCount,
          programsList: updated.slice(0, validCount),
        };
      }
      return {
        ...prev,
        programsCount: validCount,
        programsList: updated,
      };
    });
  };

  // กรอกชื่อสาขาวิชาแต่ละช่องในแบบฟอร์ม
  const handleProgramItemChangeInForm = (index: number, value: string) => {
    setFormData((prev) => {
      const nextList = [...(prev.programsList || [])];
      nextList[index] = value;
      return {
        ...prev,
        programsList: nextList,
      };
    });
  };

  // Handle Photo upload in Section 1 (Form)
  const handleDirectorPhotoInForm = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 800, 0.85);
      handleInputChange('photoUrl', compressed);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit School Stat
  const handleSaveStat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStat(true);

    try {
      const payload: any = {
        ...formData,
        programsList: (formData.programsList || []).map((s: string) => s.trim()),
        programsUrl: formData.programsUrl ? formData.programsUrl.trim() : null,
        academicYear: selectedYear,
        semester: selectedSemester,
      };

      // คำนวณความสอดคล้องของจำนวนนักเรียนอัตโนมัติ หากกรอกเฉพาะรายชั้นปี
      const sumGrades =
        (Number(payload.vocCert1) || 0) +
        (Number(payload.vocCert2) || 0) +
        (Number(payload.vocCert3) || 0) +
        (Number(payload.highVocCert1) || 0) +
        (Number(payload.highVocCert2) || 0) +
        (Number(payload.bachelorCount) || 0);

      if ((Number(payload.maleStudents) || 0) + (Number(payload.femaleStudents) || 0) === 0 && sumGrades > 0) {
        payload.maleStudents = Math.round(sumGrades / 2);
        payload.femaleStudents = sumGrades - payload.maleStudents;
      }

      // คำนวณยอดรวมครูอัตโนมัติหากกรอกยอดครูชาย-หญิง
      const sumTeachers = (Number(payload.maleTeachers) || 0) + (Number(payload.femaleTeachers) || 0);
      if (sumTeachers > (Number(payload.totalTeachers) || 0)) {
        payload.totalTeachers = sumTeachers;
      }

      if (isSuperAdmin && editingCollege) {
        payload.institutionId = editingCollege.id;
      }

      await submitSchoolStat(payload);

      // บันทึกข้อมูลตารางลูก (ทวิภาคี & ห้องเรียนอาชีพ) ไปพร้อมกัน
      const targetInstId = isSuperAdmin ? editingCollege?.id : (schoolInstitution?.id || user.institution?.id);
      try {
        if (targetInstId) {
          await Promise.all([
            saveDveDepartments({
              academicYear: selectedYear,
              semester: selectedSemester,
              institutionId: targetInstId,
              departments: dveDepartments,
            }),
            saveCareerClassrooms({
              academicYear: selectedYear,
              semester: selectedSemester,
              institutionId: targetInstId,
              classrooms: careerClassrooms,
            }),
          ]);
        }
      } catch (childErr) {
        console.warn('Child tables auto-save warning:', childErr);
      }

      showToast(
        'success',
        'บันทึกข้อมูลสำเร็จ!',
        `ข้อมูลสถิติปีการศึกษา ${selectedYear} ภาคเรียนที่ ${selectedSemester} ได้รับการอัปเดตเรียบร้อยแล้ว`
      );

      onRefreshStats(selectedYear, selectedSemester);

      if (isSuperAdmin) {
        loadSuperAdminData();
      } else {
        loadSchoolAdminData(selectedYear, selectedSemester);
      }
    } catch (err: any) {
      console.error('Submit school stat error:', err);
      showToast(
        'error',
        'บันทึกข้อมูลไม่สำเร็จ',
        err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง'
      );
    } finally {
      setSavingStat(false);
    }
  };

  // Filtered colleges in Tab 1
  const filteredStatuses = submissionStatuses.filter((s) => {
    const matchType = statusFilter === 'ALL' || s.type === statusFilter;
    const matchSearch =
      s.name.toLowerCase().includes(statusSearch.toLowerCase()) ||
      s.code.includes(statusSearch);
    return matchType && matchSearch;
  });

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn">
      {/* ==========================================
          FLOATING TOAST NOTIFICATION
         ========================================== */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 text-sm max-w-md ${
              toast.type === 'success'
                ? 'bg-emerald-800 text-white border-emerald-700 shadow-emerald-900/30'
                : 'bg-rose-800 text-white border-rose-700 shadow-rose-900/30'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-bold text-base">{toast.title}</p>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          HEADER SECTION
         ========================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#932d16]/10 text-[#932d16] flex items-center justify-center font-bold text-2xl shadow-sm">
              {isSuperAdmin ? <ShieldCheck className="w-8 h-8" /> : <School className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#932d16]/10 text-[#932d16]">
                  {isSuperAdmin ? '🛡️ ผู้ดูแลระบบส่วนกลาง (สอจ.อุดรธานี)' : '🏫 ผู้ดูแลสถานศึกษา'}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                {isSuperAdmin ? 'ศูนย์ควบคุมและบริหารจัดการข้อมูล สอจ.อุดรธานี' : (user.institution?.name || 'ระบบบันทึกข้อมูลสถิติ')}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                ผู้ใช้งาน: <strong className="text-slate-800">{user.fullName}</strong> ({user.email})
              </p>
            </div>
          </div>
        </div>

        {/* Locked status banner for School Admin when closed */}
        {!isSuperAdmin && !schoolOpenStatus && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
            <Lock className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-bold block">ขณะนี้ระบบปิดรับการรายงานข้อมูลสถิติ</strong>
              <span>กรุณาติดต่อผู้ดูแลระบบ สอจ.อุดรธานี เพื่อเปิดสิทธิ์การบันทึกข้อมูล</span>
            </div>
          </div>
        )}

        {/* ==========================================
            SCHOOL ADMIN TABS NAVIGATION
           ========================================== */}
        {!isSuperAdmin && (
          <div className="mt-8 border-b border-slate-200">
            <div className="flex flex-wrap gap-2 sm:gap-6 -mb-px text-sm font-bold text-slate-600">
              <button
                onClick={() => setSchoolPortalTab('stats_form')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  schoolPortalTab === 'stats_form'
                    ? 'border-[#932d16] text-[#932d16]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>แบบฟอร์มบันทึกข้อมูลสถิติสถานศึกษา</span>
                {!schoolOpenStatus ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> ปิดรับ
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                    🟢 เปิดรับข้อมูล
                  </span>
                )}
              </button>

              <button
                onClick={() => setSchoolPortalTab('news_view')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  schoolPortalTab === 'news_view'
                    ? 'border-[#932d16] text-[#932d16]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span>ข่าวสารและประกาศจาก สอจ.อุดรธานี</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {newsList.length} รายการ
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            SUPER ADMIN 4 SUB-TABS NAVIGATION (ตรงตามภาพ 1-4)
           ========================================== */}
        {isSuperAdmin && (
          <div className="mt-8 border-b border-slate-200">
            <div className="flex flex-wrap gap-2 sm:gap-6 -mb-px text-sm font-bold text-slate-600">
              <button
                onClick={() => setSuperAdminTab('institutions')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
                  superAdminTab === 'institutions'
                    ? 'border-[#932d16] text-[#932d16]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <School className="w-4 h-4" />
                <span>จัดการข้อมูลสถานศึกษา</span>
              </button>
              <button
                onClick={() => setSuperAdminTab('banners_news')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
                  superAdminTab === 'banners_news'
                    ? 'border-[#932d16] text-[#932d16]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>จัดการแบนเนอร์ ข่าวสไลด์ และข้อมูลติดต่อ</span>
              </button>
              <button
                onClick={() => setSuperAdminTab('settings_glow')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
                  superAdminTab === 'settings_glow'
                    ? 'border-[#932d16] text-[#932d16]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>ตั้งค่าเปิด-ปิดการกรอกข้อมูล & จุดเน้นสำคัญ</span>
              </button>
              <button
                onClick={() => setSuperAdminTab('users')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
                  superAdminTab === 'users'
                    ? 'border-[#932d16] text-[#932d16]'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>จัดการผู้ใช้งานระบบ</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SUPER ADMIN TAB 1: จัดการข้อมูลสถานศึกษา (ตรงตามภาพ 1 - media_1789761880664.png)
         ========================================================================= */}
      {isSuperAdmin && superAdminTab === 'institutions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  รายชื่อสถานศึกษาทั้งหมด {submissionStatuses.length} แห่งในสังกัด
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ตรวจสอบสถิติผู้บริหาร ครู นักเรียน และแก้ไขข้อมูลสถานศึกษา
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* สวิตช์สิทธิ์ให้สถานศึกษาดาวน์โหลด (Toggle) */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <label className="text-[11px] font-bold text-slate-700 cursor-pointer flex items-center gap-1.5" title="คลิกเพื่อเปิดหรือปิดสิทธิ์ให้สถานศึกษาดาวน์โหลดไฟล์">
                    <span>สิทธิ์สถานศึกษา:</span>
                    <span className={allowSchoolExport ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>
                      {allowSchoolExport ? '🟢 เปิดให้โหลด' : '🔒 ปิดล็อก'}
                    </span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowSchoolExport}
                      onChange={(e) => handleToggleSchoolExport(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* ปุ่ม Export Excel (13 วิทยาลัย) */}
                <button
                  type="button"
                  onClick={handleSuperAdminExportExcel}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                  title="ดาวน์โหลดไฟล์สรุปสถิติ 13 วิทยาลัย เป็น Excel (.xlsx)"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>

                {/* ปุ่มพิมพ์รายงานราชการ (PDF) */}
                <button
                  type="button"
                  onClick={handleSuperAdminPrintReport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                  title="เปิดหน้าต่างพิมพ์รายงานราชการขนาด A4 หรือบันทึกเป็น PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์รายงานราชการ (PDF)</span>
                </button>

                {/* เพิ่มสถานศึกษา */}
                <button
                  onClick={() => setShowAddInstitutionModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#932d16] hover:bg-[#7a2411] text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ เพิ่มสถานศึกษา</span>
                </button>
              </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อวิทยาลัย หรือ รหัส..."
                  value={statusSearch}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                >
                  ทั้งหมด ({submissionStatuses.length})
                </button>
                <button
                  onClick={() => setStatusFilter('PUBLIC')}
                  className={`px-3 py-1.5 rounded-lg ${statusFilter === 'PUBLIC' ? 'bg-[#932d16] text-white shadow-sm' : 'text-slate-600'}`}
                >
                  รัฐบาล ({submissionStatuses.filter((s) => s.type === 'PUBLIC').length})
                </button>
                <button
                  onClick={() => setStatusFilter('PRIVATE')}
                  className={`px-3 py-1.5 rounded-lg ${statusFilter === 'PRIVATE' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600'}`}
                >
                  เอกชน ({submissionStatuses.filter((s) => s.type === 'PRIVATE').length})
                </button>
              </div>
            </div>

            {/* Table matching mockup 1 */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">รหัส</th>
                    <th className="py-3 px-4">ชื่อสถานศึกษา</th>
                    <th className="py-3 px-4">ประเภท</th>
                    <th className="py-3 px-4 text-center">ผู้บริหาร</th>
                    <th className="py-3 px-4 text-center">ครู/อาจารย์</th>
                    <th className="py-3 px-4 text-center">ปวช.(1-3)</th>
                    <th className="py-3 px-4 text-center">ปวส.(1-2)</th>
                    <th className="py-3 px-4 text-center">ทล.บ.</th>
                    <th className="py-3 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingStatuses ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        กำลังโหลดข้อมูลสถานศึกษา...
                      </td>
                    </tr>
                  ) : filteredStatuses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        ไม่พบสถานศึกษาที่ตรงกับคำค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredStatuses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{item.code}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">{item.name}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              item.type === 'PUBLIC'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {item.type === 'PUBLIC' ? 'รัฐบาล' : 'เอกชน'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                          {item.totalExecutives ?? 1}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-blue-700">
                          {item.totalTeachers.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-purple-700">
                          {(item.vocCertCount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-indigo-700">
                          {(item.highVocCertCount || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {item.bachelorCount || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStartEditCollege(item)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-[#932d16] text-slate-700 hover:text-white rounded-lg font-bold text-xs transition-all shadow-sm flex items-center gap-1"
                              title="แก้ไขข้อมูลสถานศึกษา"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCollege(item)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-lg font-bold text-xs transition-all shadow-sm flex items-center gap-1"
                              title={`ลบสถานศึกษา ${item.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>ลบ</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUPER ADMIN TAB 2: จัดการแบนเนอร์ ข่าวสไลด์ และข้อมูลติดต่อ (ตรงตามภาพ 2 - media_1789761951735.png)
         ========================================================================= */}
      {isSuperAdmin && superAdminTab === 'banners_news' && (
        <div className="space-y-8">
          {/* Top 2 Cards: Header Banner & Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Header Banner */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">แบนเนอร์ส่วนหัวเว็บ (Header Banner)</h3>
                <p className="text-xs text-slate-500 mt-1">เปลี่ยนภาพพื้นหลังส่วนหัวตามเทศกาล</p>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => {
                    const btn = document.getElementById('navbar-banner-changer-btn');
                    if (btn) {
                      btn.click();
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      showToast('success', 'เปลี่ยนภาพแบนเนอร์', 'สามารถกดปุ่ม "📷 เปลี่ยนแบนเนอร์" ที่มุมขวาบนของแบนเนอร์ได้ทันที');
                    }
                  }}
                  className="px-5 py-2.5 bg-[#932d16] hover:bg-[#7a2411] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  แก้ไขแบนเนอร์
                </button>
              </div>
            </div>

            {/* Card 2: Contact Info */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">ข้อมูลติดต่อ สอจ. (Footer Info)</h3>
                <p className="text-xs text-slate-500 mt-1">แก้ไขที่อยู่ สอจ. เบอร์โทร และแฟนเพจ</p>
              </div>
              <div className="pt-6">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="px-5 py-2.5 bg-[#932d16] hover:bg-[#7a2411] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  แก้ไขข้อมูลติดต่อ
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: News Carousel List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-base font-black text-slate-900">รายการสไลด์ข่าวประชาสัมพันธ์ (News Carousel)</h3>
                <p className="text-xs text-slate-500 mt-0.5">จัดการรูปภาพและข้อความที่จะนำไปวิ่งสไลด์บนหน้าแรก</p>
              </div>
              <button
                onClick={() => {
                  if (showAddNewsForm) {
                    handleCancelNewsForm();
                  } else {
                    setShowAddNewsForm(true);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showAddNewsForm ? 'ปิดฟอร์ม' : '+ เพิ่มข่าวสไลด์ใหม่'}</span>
              </button>
            </div>

            {/* Add / Edit News Form with Image resize to avoid 413 */}
            {showAddNewsForm && (
              <form id="news-form-container" onSubmit={handleCreateNews} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-[#932d16]" />
                    <span>{editingNewsId ? 'แก้ไขข้อมูลข่าวประชาสัมพันธ์' : 'เพิ่มข่าวประชาสัมพันธ์ใหม่'}</span>
                  </h4>
                  {editingNewsId && (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      กำลังแก้ไขข้อมูล
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">หัวข้อข่าว *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ขับเคลื่อนหลักสูตรทวิภาคีพรีเมียม ร่วมกับสถานประกอบการชั้นนำ"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">เนื้อหาข่าว / คำอธิบายย่อ *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="รายละเอียดข่าวสารประชาสัมพันธ์..."
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                {/* Photo Upload & Preview */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">รูปภาพหน้าปกข่าว (16:9)</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                      type="button"
                      onClick={() => newsFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>เลือกไฟล์รูปภาพ</span>
                    </button>
                    <input
                      ref={newsFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleNewsImageUpload}
                      className="hidden"
                    />
                    <span className="text-xs text-slate-400">หรือวาง URL:</span>
                    <input
                      type="url"
                      placeholder="https://example.com/cover.jpg"
                      value={newsCoverImage && !newsCoverImage.startsWith('data:') ? newsCoverImage : ''}
                      onChange={(e) => setNewsCoverImage(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  {newsCoverImage && (
                    <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm mt-2">
                      <img src={newsCoverImage} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewsCoverImage(null)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full text-xs shadow"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* News Link URL (Optional for external activities or college web) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-[#932d16]" />
                      <span>แนบลิงก์ข่าว / ดูรายละเอียดเพิ่มเติม (URL)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      (ไม่บังคับใส่ เช่น ลิงก์โพสต์ Facebook หรือเว็บไซต์สถานศึกษา)
                    </span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/... หรือ https://www.udontech.ac.th/news/..."
                    value={newsLinkUrl}
                    onChange={(e) => setNewsLinkUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelNewsForm}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={creatingNews}
                    className="px-5 py-2 text-xs font-bold bg-[#932d16] hover:bg-[#7a2411] text-white rounded-xl shadow disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {creatingNews ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : editingNewsId ? (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>บันทึกการแก้ไขข่าวสาร</span>
                      </>
                    ) : (
                      <span>เผยแพร่ข่าวสาร</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* News Table matching mockup 2 */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-24">รูปภาพ</th>
                    <th className="py-3 px-4">หัวข้อข่าว</th>
                    <th className="py-3 px-4">คำอธิบายย่อ</th>
                    <th className="py-3 px-4 text-center">ลำดับ</th>
                    <th className="py-3 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingNews ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        กำลังโหลดข่าวสาร...
                      </td>
                    </tr>
                  ) : newsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        ยังไม่มีข่าวประชาสัมพันธ์ในระบบ
                      </td>
                    </tr>
                  ) : (
                    newsList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                            {item.coverImageUrl ? (
                              <img src={item.coverImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 truncate">{item.title}</div>
                          {item.linkUrl && (
                            <a
                              href={item.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline mt-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">เปิดดูลิงก์</span>
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{item.content}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                            <span className="font-extrabold text-slate-700 min-w-[14px] text-center text-xs">
                              {idx + 1}
                            </span>
                            <div className="flex flex-col gap-0.5 ml-1">
                              <button
                                type="button"
                                onClick={() => handleMoveNews(idx, 'UP')}
                                disabled={idx === 0}
                                className="p-0.5 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                title="เลื่อนขึ้น (แสดงก่อน)"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveNews(idx, 'DOWN')}
                                disabled={idx === newsList.length - 1}
                                className="p-0.5 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                title="เลื่อนลง"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditNews(item)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-slate-950 rounded-lg font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                              title="แก้ไขข่าวสารนี้"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>แก้ไข</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNews(item.id, item.title)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                              title="ลบข่าวสาร"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUPER ADMIN TAB 3: ตั้งค่าเปิด-ปิดการกรอกข้อมูล & จุดเด่นแสงกระพริบ (ตรงตามภาพ 3 - media_1789761964572.png)
         ========================================================================= */}
      {isSuperAdmin && superAdminTab === 'settings_glow' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-[#932d16]/10 text-[#932d16]">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ควบคุมการเปิด-ปิดการกรอกข้อมูลของแอดมินวิทยาลัย
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Admin ส่วนกลางสามารถสั่งล็อกไม่ให้แต่ละวิทยาลัยแก้ไขข้อมูล และเลือกเปิดแสงกระพริบวิบวับเพื่อเน้นย้ำจุดที่ต้องการให้เร่งกรอก
                </p>
              </div>
            </div>

            {/* Checkbox List */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">1. แท็บข้อมูลทั่วไปและผู้บริหาร</h4>
                  <p className="text-xs text-slate-500">อนุญาตให้แก้ไขเว็บไซต์ ลิงก์ และชื่อผู้บริหาร</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSectionGeneral}
                  onChange={(e) => setAllowSectionGeneral(e.target.checked)}
                  className="w-5 h-5 text-[#932d16] rounded border-slate-300 focus:ring-[#932d16]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">2. แท็บข้อมูลครูและบุคลากรทางการศึกษา</h4>
                  <p className="text-xs text-slate-500">อนุญาตให้แก้ไขจำนวนครู ชาย-หญิง วุฒิการศึกษา และประเภทการจ้างงาน</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSectionTeachers}
                  onChange={(e) => setAllowSectionTeachers(e.target.checked)}
                  className="w-5 h-5 text-[#932d16] rounded border-slate-300 focus:ring-[#932d16]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">3. แท็บสถิตินักเรียนแยกชั้นปี (ปวช.1-3 / ปวส.1-2)</h4>
                  <p className="text-xs text-slate-500">อนุญาตให้บันทึกสถิตินักเรียนแรกเข้าและรายชั้นปี</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSectionGrades}
                  onChange={(e) => setAllowSectionGrades(e.target.checked)}
                  className="w-5 h-5 text-[#932d16] rounded border-slate-300 focus:ring-[#932d16]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">4. แท็บข้อมูลแผนกวิชาทวิภาคี</h4>
                  <p className="text-xs text-slate-500">อนุญาตให้เพิ่ม แก้ไข หรือลบแผนกวิชาที่จัดการศึกษาระบบทวิภาคี</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSectionDve}
                  onChange={(e) => setAllowSectionDve(e.target.checked)}
                  className="w-5 h-5 text-[#932d16] rounded border-slate-300 focus:ring-[#932d16]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">5. แท็บข้อมูลหลักสูตรห้องเรียนอาชีพ & Reskill-Upskill</h4>
                  <p className="text-xs text-slate-500">อนุญาตให้เพิ่ม แก้ไข หรือลบหลักสูตรห้องเรียนอาชีพและโรงเรียนเครือข่าย</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSectionCareer}
                  onChange={(e) => setAllowSectionCareer(e.target.checked)}
                  className="w-5 h-5 text-[#932d16] rounded border-slate-300 focus:ring-[#932d16]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">6. แท็บผู้สำเร็จการศึกษา & ภาวะการมีงานทำ</h4>
                  <p className="text-xs text-slate-500">อนุญาตให้บันทึกจำนวนคนจบและติดตามการมีงานทำ</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSectionGraduates}
                  onChange={(e) => setAllowSectionGraduates(e.target.checked)}
                  className="w-5 h-5 text-[#932d16] rounded border-slate-300 focus:ring-[#932d16]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">7. สิทธิ์การส่งออกข้อมูล Excel และพิมพ์รายงานราชการ (PDF)</h4>
                  <p className="text-xs text-slate-500">
                    {allowSchoolExport
                      ? '🟢 เปิดสิทธิ์ (แอดมินสถานศึกษาสามารถดาวน์โหลดไฟล์ Excel และพิมพ์รายงานได้)'
                      : '🔒 ปิดล็อก (เฉพาะแอดมิน สอจ. เท่านั้นที่มีสิทธิ์ สถานศึกษาจะไม่เห็นปุ่ม)'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSchoolExport}
                  onChange={(e) => setAllowSchoolExport(e.target.checked)}
                  className="w-5 h-5 text-[#932d16] rounded border-slate-300 focus:ring-[#932d16]"
                />
              </label>
            </div>

            {/* Glow Pulse Selection Box (ตามภาพที่ 3) */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 space-y-3">
              <label className="text-xs font-bold text-amber-950 block">
                เลือกแท็บที่ต้องการให้มีแสงกระพริบวิบวับ (Glow Pulse Effect) เพื่อเน้นย้ำการกรอกด่วน:
              </label>
              <select
                value={glowSection}
                onChange={(e) => setGlowSection(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="none">-- ไม่เปิดการเน้นย้ำ --</option>
                <option value="section_1">หมวดที่ 1: ข้อมูลทั่วไปและผู้บริหาร</option>
                <option value="section_teachers">หมวดที่ 2: ข้อมูลครูและบุคลากร</option>
                <option value="section_2">หมวดที่ 3: สถิตินักเรียนแยกชั้นปี</option>
                <option value="section_dve">หมวดที่ 4: แผนกวิชาทวิภาคี</option>
                <option value="section_career">หมวดที่ 5: ข้อมูลห้องเรียนอาชีพ</option>
                <option value="section_3">หมวดที่ 6: ผู้สำเร็จการศึกษา & มีงานทำ</option>
              </select>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePermissions}
              disabled={savingPermissions}
              className="w-full py-3 bg-[#932d16] hover:bg-[#7a2411] text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingPermissions ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าสิทธิ์และการเน้นย้ำ'}</span>
            </button>

            {/* Global submission toggle switch */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">สวิตช์เปิด-ปิดการรับข้อมูลทั้งหมด (Global Lock)</span>
                <span className="text-[11px] text-slate-500">
                  {submissionOpen ? '🟢 ปัจจุบัน: เปิดระบบรับข้อมูลทั้งหมด' : '🔴 ปัจจุบัน: ปิดระบบรับข้อมูลทั้งหมด'}
                </span>
              </div>
              <button
                onClick={handleToggleSubmission}
                disabled={toggleLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  submissionOpen
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                }`}
              >
                {submissionOpen ? 'คลิกเพื่อ ปิดระบบ' : 'คลิกเพื่อ เปิดระบบ'}
              </button>
            </div>
          </div>

          {/* Card 2: จัดการรอบปีการศึกษาและภาคเรียน (Academic Periods Management) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-[#932d16]">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    จัดการรอบปีการศึกษาและภาคเรียนที่เปิดให้กรอกข้อมูล
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    เพิ่มหรือลบรอบปีการศึกษา/ภาคเรียน เพื่อให้แอดมินสถานศึกษาเลือกรายงานข้อมูลได้อย่างถูกต้อง
                  </p>
                </div>
              </div>
            </div>

            {/* Form: Add New Academic Period */}
            <form onSubmit={handleAddPeriod} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <span className="text-xs font-bold text-slate-800 block">
                + เพิ่มรอบปีการศึกษา / ภาคเรียนใหม่
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">ปีการศึกษา (พ.ศ.)</label>
                  <input
                    type="number"
                    required
                    min={2550}
                    max={2600}
                    value={newPeriodYear}
                    onChange={(e) => setNewPeriodYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">ภาคเรียนที่</label>
                  <select
                    value={newPeriodSemester}
                    onChange={(e) => setNewPeriodSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value={1}>ภาคเรียนที่ 1</option>
                    <option value={2}>ภาคเรียนที่ 2</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPeriodIsCurrent}
                      onChange={(e) => setNewPeriodIsCurrent(e.target.checked)}
                      className="w-4 h-4 text-[#932d16] rounded border-slate-300 focus:ring-[#932d16]"
                    />
                    <span className="text-xs font-semibold text-slate-700">ตั้งเป็นรอบปัจจุบัน</span>
                  </label>
                  <button
                    type="submit"
                    disabled={addingPeriod}
                    className="w-full py-2 bg-[#932d16] hover:bg-[#7a2411] text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{addingPeriod ? 'กำลังเพิ่ม...' : 'เพิ่มรอบข้อมูล'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* List of Periods */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                รอบปีการศึกษาทั้งหมดในระบบ ({academicPeriods.length} รอบ)
              </span>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">ปีการศึกษา</th>
                      <th className="py-3 px-4">ภาคเรียน</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingPeriods ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">กำลังโหลด...</td>
                      </tr>
                    ) : academicPeriods.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">ปีการศึกษา {p.year}</td>
                        <td className="py-3 px-4 text-slate-700">ภาคเรียนที่ {p.semester}</td>
                        <td className="py-3 px-4">
                          {p.isCurrent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[11px]">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>รอบปัจจุบัน (Default)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">รอบทั่วไป</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            {!p.isCurrent && (
                              <button
                                onClick={() => handleSetCurrentPeriod(p)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-500 text-amber-800 hover:text-slate-950 rounded-lg font-bold text-[11px] transition-colors border border-amber-200 cursor-pointer"
                              >
                                ตั้งเป็นรอบปัจจุบัน
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePeriod(p)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="ลบรอบปีการศึกษานี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          SUPER ADMIN TAB 4: จัดการผู้ใช้งานระบบ (ตรงตามภาพ 4 - media_1789761977890.png)
         ========================================================================= */}
      {isSuperAdmin && superAdminTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  บัญชีผู้ดูแลระบบและแอดมินประจำสถานศึกษา
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">จัดการสิทธิ์และสร้างบัญชีเข้าใช้งานระบบ</p>
              </div>
              <button
                onClick={() => {
                  setEditingUserId(null);
                  setUserEmail('');
                  setUserPassword('');
                  setUserFullName('');
                  setUserRole('SCHOOL_ADMIN');
                  setUserInstitutionId('');
                  setShowUserModal(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#932d16] hover:bg-[#7a2411] text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ เพิ่มบัญชีผู้ใช้งาน</span>
              </button>
            </div>

            {/* Table matching mockup 4 */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 font-mono">USERNAME</th>
                    <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3.5 px-4">บทบาท</th>
                    <th className="py-3.5 px-4">สังกัดสถานศึกษา</th>
                    <th className="py-3.5 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        กำลังโหลดข้อมูลผู้ใช้งาน...
                      </td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        ไม่พบบัญชีผู้ใช้งานในระบบ
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{u.email}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{u.fullName}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {u.role === 'SUPER_ADMIN' ? 'super_admin' : 'school_admin'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {u.institution?.name || (u.role === 'SUPER_ADMIN' ? 'สอจ.อุดรธานี' : '-')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingUserId(u.id);
                                setUserEmail(u.email);
                                setUserPassword('');
                                setUserFullName(u.fullName);
                                setUserRole(u.role);
                                setUserInstitutionId(u.institutionId || '');
                                setShowUserModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors"
                            >
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteUserItem(u.id, u.email)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg font-bold text-xs transition-colors"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DATA SUBMISSION & EDITING FORM
          (ใช้ได้ทั้ง School Admin และ Super Admin เมื่อกด "แก้ไข" วิทยาลัยใดๆ)
         ========================================================================= */}
      {/* =========================================================================
          SCHOOL ADMIN TAB: ข่าวสารและประกาศจาก สอจ. (เมื่อเลือกแท็บข่าว)
         ========================================================================= */}
      {!isSuperAdmin && schoolPortalTab === 'news_view' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-[#932d16]" />
                  <span>ข่าวประชาสัมพันธ์และประกาศจาก สอจ.อุดรธานี</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ติดตามข่าวสาร นโยบาย และกิจกรรมความร่วมมือต่างๆ ของสำนักงานอาชีวศึกษาจังหวัดอุดรธานี
                </p>
              </div>
            </div>

            {loadingNews ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#932d16] mx-auto mb-2" />
                กำลังโหลดข่าวสาร...
              </div>
            ) : newsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newsList.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 hover:border-[#932d16]/30 transition-all flex gap-4 bg-slate-50/50 hover:bg-white hover:shadow-md group">
                    <div className="w-28 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                      {item.coverImageUrl ? (
                        <img src={item.coverImageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3 text-[#932d16]" />
                          {new Date(item.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-[#932d16] transition-colors">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{item.content}</p>
                      </div>
                      {item.linkUrl && (
                        <a
                          href={item.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#932d16] font-bold hover:underline mt-2 self-start"
                        >
                          <span>เปิดดูรายละเอียด</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          DATA SUBMISSION & EDITING FORM
          (ใช้ได้ทั้ง School Admin และ Super Admin เมื่อกด "แก้ไข" วิทยาลัยใดๆ)
         ========================================================================= */}
      {(editingCollege || (!isSuperAdmin && schoolPortalTab === 'stats_form')) && (
        <div id="college-edit-form" className="space-y-6 relative">
          {/* Loading overlay */}
          {(loadingCollegeStat || loadingSchoolStat) && (
            <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex items-center justify-center rounded-3xl">
              <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center gap-3 border border-slate-200">
                <Loader2 className="w-5 h-5 text-[#932d16] animate-spin" />
                <span className="text-xs font-bold text-slate-700">กำลังโหลดข้อมูลสถิติ...</span>
              </div>
            </div>
          )}

          {/* Banner for Super Admin Override */}
          {isSuperAdmin && editingCollege && (
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-4 rounded-2xl shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm">
                    👑 โหมดแก้ไขข้อมูลโดยผู้ดูแลระบบ สอจ. (Super Admin Override)
                  </h4>
                  <p className="text-xs opacity-90">
                    กำลังแก้ไขข้อมูลของ: <strong>{editingCollege.name}</strong> ({editingCollege.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCollege(null)}
                className="px-3.5 py-1.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow hover:bg-slate-100 transition-colors shrink-0"
              >
                ✕ ปิดโหมดแก้ไข
              </button>
            </div>
          )}

          {/* Form Box */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            {/* Header with Year and Semester Selector (ตอบสนองความต้องการข้อ 5) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  แบบฟอร์มบันทึกและรายงานข้อมูลสถิติประจำสถานศึกษา
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  สถานศึกษา: <strong>{isSuperAdmin ? editingCollege?.name : (schoolInstitution?.name || user.institution?.name)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Year and Semester Dynamic Selector */}
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Calendar className="w-4 h-4 text-[#932d16]" />
                    <span>รอบรายงานข้อมูล:</span>
                    <select
                      value={`${selectedYear}-${selectedSemester}`}
                      onChange={(e) => {
                        const [y, s] = e.target.value.split('-').map(Number);
                        handleYearSemesterChange(y, s);
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-[#932d16] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#932d16]"
                    >
                      {academicPeriods.map((p) => (
                        <option key={p.id} value={`${p.year}-${p.semester}`}>
                          ปีการศึกษา {p.year} - ภาคเรียนที่ {p.semester} {p.isCurrent ? '⭐ (รอบปัจจุบัน)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Export Excel & Print Report Buttons (เฉพาะ Super Admin หรือเมื่อได้รับอนุญาต) */}
                {(isSuperAdmin || schoolPermissions.allowSchoolExport) && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSchoolAdminExportExcel}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                      title="ดาวน์โหลดไฟล์ Excel สรุปข้อมูลวิทยาลัยนี้"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSchoolAdminPrintReport}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                      title="พิมพ์แบบรายงานราชการของวิทยาลัยนี้ หรือบันทึกเป็น PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>พิมพ์รายงาน (PDF)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Form Section Tabs Navigator (ตอบสนองความต้องการเลือกดู/กรอกข้อมูลแยกแท็บแบบ Responsive) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 max-w-full">
              <button
                type="button"
                onClick={() => setActiveFormSection('all')}
                className={`flex-1 min-w-[85px] sm:min-w-[110px] px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeFormSection === 'all'
                    ? 'bg-white text-[#932d16] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ทุกส่วน</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormSection('general')}
                className={`flex-1 min-w-[95px] sm:min-w-[120px] px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeFormSection === 'general'
                    ? 'bg-white text-[#932d16] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>1. ข้อมูลทั่วไป</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormSection('teachers')}
                className={`flex-1 min-w-[95px] sm:min-w-[120px] px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeFormSection === 'teachers'
                    ? 'bg-white text-[#932d16] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>2. บุคลากร</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormSection('grades')}
                className={`flex-1 min-w-[95px] sm:min-w-[120px] px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeFormSection === 'grades'
                    ? 'bg-white text-[#932d16] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>3. สถิตินักเรียน</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormSection('dve')}
                className={`flex-1 min-w-[95px] sm:min-w-[120px] px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeFormSection === 'dve'
                    ? 'bg-white text-[#932d16] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>4. ทวิภาคี ({dveDepartments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormSection('career')}
                className={`flex-1 min-w-[95px] sm:min-w-[120px] px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeFormSection === 'career'
                    ? 'bg-white text-[#932d16] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>5. ห้องเรียนอาชีพ ({careerClassrooms.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFormSection('graduates')}
                className={`flex-1 min-w-[95px] sm:min-w-[120px] px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  activeFormSection === 'graduates'
                    ? 'bg-white text-[#932d16] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>6. จบ & มีงานทำ</span>
              </button>
            </div>

            <form onSubmit={handleSaveStat} className="space-y-8">
              {/* ==========================================================
                  SECTION 1: ข้อมูลทั่วไปและผู้บริหาร
                 ========================================================== */}
              {(activeFormSection === 'all' || activeFormSection === 'general') && (() => {
                const isLocked = !isSuperAdmin && (!schoolOpenStatus || !schoolPermissions.allowSectionGeneral);
                const isGlow = schoolPermissions.glowSection === 'section_1';
                return (
                  <div
                    className={`rounded-3xl p-6 border transition-all ${
                      isGlow
                        ? 'glow-border-only'
                        : isLocked
                        ? 'border-slate-200 bg-slate-50/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#932d16]" />
                        <h3 className="text-base font-black text-slate-900">
                          1. ข้อมูลทั่วไปและผู้บริหารสถานศึกษา
                        </h3>
                      </div>
                      {isGlow && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shadow animate-bounce">
                          ⚡ กรุณาอัปเดตข้อมูล
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> ล็อกโดย สอจ. (อ่านอย่างเดียว)
                        </span>
                      )}
                    </div>

                    {/* Guidance banner when locked */}
                    {isLocked && (
                      <div className="mb-5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-xs">
                        <Lock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <strong className="font-black text-amber-900 block">
                            🔒 โหมดตรวจสอบข้อมูล (แท็บนี้ปิดรับการแก้ไขโดย สอจ.อุดรธานี)
                          </strong>
                          <span className="text-amber-800 text-[11px] mt-0.5 block leading-relaxed">
                            ท่านสามารถตรวจสอบข้อมูลเดิมที่เคยบันทึกไว้ได้ แต่ไม่สามารถพิมพ์แก้ไขได้ในขณะนี้ หากต้องการแก้ไขกรุณาติดต่อผู้ดูแลระบบ สอจ.อุดรธานี
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Photo upload frame */}
                      <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="w-20 h-28 rounded-xl overflow-hidden bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center mb-2">
                          {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="" className="w-full h-full object-cover object-top" />
                          ) : (
                            <UserCheck className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        {!isLocked ? (
                          <label className="cursor-pointer px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1.5 shadow-sm">
                            <Camera className="w-3 h-3" />
                            <span>เปลี่ยนภาพผู้บริหาร</span>
                            <input type="file" accept="image/*" onChange={handleDirectorPhotoInForm} className="hidden" />
                          </label>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3" /> ปิดรับการเปลี่ยนรูป
                          </span>
                        )}
                      </div>

                      {/* Inputs */}
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">ชื่อ - นามสกุล ผู้บริหาร (ผอ.)</label>
                          <input
                            type="text"
                            disabled={isLocked}
                            value={formData.directorName}
                            onChange={(e) => handleInputChange('directorName', e.target.value)}
                            placeholder="เช่น นายธีรภัทร์ ไชยสัตย์"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">จำนวนผู้บริหาร (คน) (ผอ. / รอง ผอ.)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            min="1"
                            value={formData.totalExecutives}
                            onChange={(e) => handleInputChange('totalExecutives', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">จำนวนครูผู้สอน (คน)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            value={formData.totalTeachers}
                            onChange={(e) => handleInputChange('totalTeachers', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">จำนวนบุคลากรทางการศึกษา (คน)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            value={formData.totalStaff}
                            onChange={(e) => handleInputChange('totalStaff', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์ติดต่อ</label>
                          <input
                            type="text"
                            disabled={isLocked}
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="เช่น 042-221538"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">เว็บไซต์สถานศึกษา (URL)</label>
                          <input
                            type="url"
                            disabled={isLocked}
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="เช่น https://www.udontech.ac.th"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* สาขาวิชาที่เปิดสอน */}
                    <div className="mt-5 pt-5 border-t border-slate-200/80 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-[#932d16]" />
                            <span>สาขาวิชาที่เปิดสอน (ปวช. / ปวส. / ทล.บ.)</span>
                          </label>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            กรอกชื่อสาขาวิชาที่เปิดสอนจริง เพื่อแสดงในทำเนียบสถานศึกษา
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600">จำนวนสาขา:</span>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            disabled={isLocked}
                            value={formData.programsCount}
                            onChange={(e) => handleProgramsCountChangeInForm(Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center text-[#932d16] disabled:bg-slate-100"
                          />
                          <span className="text-xs text-slate-500">สาขา</span>
                        </div>
                      </div>

                      {/* ลิงก์รายละเอียดหลักสูตร */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3 text-[#932d16]" />
                          <span>ลิงก์รายละเอียดหลักสูตร / แผนการเรียนทั้งหมด (URL) (ถ้ามี)</span>
                        </label>
                        <input
                          type="url"
                          disabled={isLocked}
                          value={formData.programsUrl}
                          onChange={(e) => handleInputChange('programsUrl', e.target.value)}
                          placeholder="เช่น https://www.udontech.ac.th/curriculum"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium disabled:bg-slate-100"
                        />
                      </div>

                      {/* รายการช่องกรอกชื่อสาขาวิชา */}
                      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
                        <div className="text-[11px] font-bold text-slate-600 mb-3 flex items-center justify-between">
                          <span>รายชื่อสาขาวิชาที่เปิดสอน ({formData.programsCount} สาขา):</span>
                          <span className="text-slate-400 font-normal">
                            กรอกได้สูงสุด 60 สาขา
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                          {Array.from({ length: formData.programsCount }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="w-6 text-[10px] font-bold text-slate-400 text-right shrink-0">
                                {idx + 1}.
                              </span>
                              <input
                                type="text"
                                disabled={isLocked}
                                value={(formData.programsList && formData.programsList[idx]) || ''}
                                onChange={(e) => handleProgramItemChangeInForm(idx, e.target.value)}
                                placeholder={`สาขาวิชาที่ ${idx + 1}`}
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ==========================================================
                  SECTION 2: ข้อมูลบุคลากรทางการศึกษา และวุฒิการศึกษา
                 ========================================================== */}
              {(activeFormSection === 'all' || activeFormSection === 'teachers') && (() => {
                const isLocked = !isSuperAdmin && (!schoolOpenStatus || !schoolPermissions.allowSectionTeachers);
                const isGlow = schoolPermissions.glowSection === 'section_teachers';
                const totalDegreeMale = (formData.degreeAssociateMale || 0) + (formData.degreeBachelorMale || 0) + (formData.degreeMasterMale || 0) + (formData.degreeDoctorMale || 0);
                const totalDegreeFemale = (formData.degreeAssociateFemale || 0) + (formData.degreeBachelorFemale || 0) + (formData.degreeMasterFemale || 0) + (formData.degreeDoctorFemale || 0);
                const totalTeachersTypeMale = (formData.civilTeachersMale || 0) + (formData.hiredTeachersMale || 0);
                const totalTeachersTypeFemale = (formData.civilTeachersFemale || 0) + (formData.hiredTeachersFemale || 0);

                return (
                  <div
                    className={`rounded-3xl p-6 border transition-all space-y-6 ${
                      isGlow
                        ? 'glow-border-only'
                        : isLocked
                        ? 'border-slate-200 bg-slate-50/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[#932d16]" />
                        <div>
                          <h3 className="text-base font-black text-slate-900">
                            2. ข้อมูลบุคลากรทางการศึกษา และวุฒิการศึกษา
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            บุคลากรครูผู้สอน ชาย-หญิง จำแนกตามวุฒิการศึกษาและประเภทการจ้างงาน
                          </p>
                        </div>
                      </div>
                      {isGlow && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shadow animate-bounce">
                          ⚡ กรุณาอัปเดตข้อมูล
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> ล็อกโดย สอจ. (อ่านอย่างเดียว)
                        </span>
                      )}
                    </div>

                    {/* Guidance banner when locked */}
                    {isLocked && (
                      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-xs">
                        <Lock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <strong className="font-black text-amber-900 block">
                            🔒 โหมดตรวจสอบข้อมูล (แท็บข้อมูลครูและบุคลากรปิดรับการแก้ไขโดย สอจ.อุดรธานี)
                          </strong>
                          <span className="text-amber-800 text-[11px] mt-0.5 block leading-relaxed">
                            ท่านสามารถตรวจสอบข้อมูลเดิมที่เคยบันทึกไว้ได้ แต่ไม่สามารถพิมพ์แก้ไขได้ในขณะนี้ หากต้องการแก้ไขกรุณาติดต่อผู้ดูแลระบบ สอจ.อุดรธานี
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ครูผู้สอน ชาย - หญิง */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#932d16]" />
                        <span>จำนวนครูผู้สอนทั้งหมด ชาย - หญิง (คน)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">ครูผู้สอน ชาย (คน)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            value={formData.maleTeachers}
                            onChange={(e) => handleInputChange('maleTeachers', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">ครูผู้สอน หญิง (คน)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            value={formData.femaleTeachers}
                            onChange={(e) => handleInputChange('femaleTeachers', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex flex-col justify-center text-center">
                          <span className="text-[11px] text-amber-900 font-semibold">รวมครูผู้สอน ชาย-หญิง</span>
                          <span className="text-base font-black text-[#932d16]">
                            {((formData.maleTeachers || 0) + (formData.femaleTeachers || 0)).toLocaleString()} คน
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ตารางวุฒิการศึกษา ชาย - หญิง */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-[#932d16]" />
                          <span>จำแนกตามวุฒิการศึกษา (ชาย - หญิง)</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          รวมตามวุฒิ: {(totalDegreeMale + totalDegreeFemale).toLocaleString()} คน
                        </span>
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-200/70 text-slate-700 font-bold rounded-xl">
                            <tr>
                              <th className="py-2.5 px-3 rounded-l-xl">ระดับวุฒิการศึกษา</th>
                              <th className="py-2.5 px-3 text-center">ชาย (คน)</th>
                              <th className="py-2.5 px-3 text-center">หญิง (คน)</th>
                              <th className="py-2.5 px-3 text-center rounded-r-xl">รวม (คน)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 font-medium">
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-800">1. อนุปริญญา / ปวส.</td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.degreeAssociateMale}
                                  onChange={(e) => handleInputChange('degreeAssociateMale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.degreeAssociateFemale}
                                  onChange={(e) => handleInputChange('degreeAssociateFemale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-[#932d16]">
                                {((formData.degreeAssociateMale || 0) + (formData.degreeAssociateFemale || 0)).toLocaleString()}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-800">2. ปริญญาตรี</td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.degreeBachelorMale}
                                  onChange={(e) => handleInputChange('degreeBachelorMale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.degreeBachelorFemale}
                                  onChange={(e) => handleInputChange('degreeBachelorFemale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-[#932d16]">
                                {((formData.degreeBachelorMale || 0) + (formData.degreeBachelorFemale || 0)).toLocaleString()}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-800">3. ปริญญาโท</td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.degreeMasterMale}
                                  onChange={(e) => handleInputChange('degreeMasterMale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.degreeMasterFemale}
                                  onChange={(e) => handleInputChange('degreeMasterFemale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-[#932d16]">
                                {((formData.degreeMasterMale || 0) + (formData.degreeMasterFemale || 0)).toLocaleString()}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-800">4. ปริญญาเอก</td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.degreeDoctorMale}
                                  onChange={(e) => handleInputChange('degreeDoctorMale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.degreeDoctorFemale}
                                  onChange={(e) => handleInputChange('degreeDoctorFemale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-[#932d16]">
                                {((formData.degreeDoctorMale || 0) + (formData.degreeDoctorFemale || 0)).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ตารางประเภทของครู ชาย - หญิง */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckSquare className="w-4 h-4 text-[#932d16]" />
                          <span>จำแนกตามประเภทของครู (ชาย - หญิง)</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          รวมตามประเภท: {(totalTeachersTypeMale + totalTeachersTypeFemale).toLocaleString()} คน
                        </span>
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-200/70 text-slate-700 font-bold rounded-xl">
                            <tr>
                              <th className="py-2.5 px-3 rounded-l-xl">ประเภทตำแหน่งครู</th>
                              <th className="py-2.5 px-3 text-center">ชาย (คน)</th>
                              <th className="py-2.5 px-3 text-center">หญิง (คน)</th>
                              <th className="py-2.5 px-3 text-center rounded-r-xl">รวม (คน)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60 font-medium">
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-800">1. ข้าราชการครู</td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.civilTeachersMale}
                                  onChange={(e) => handleInputChange('civilTeachersMale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.civilTeachersFemale}
                                  onChange={(e) => handleInputChange('civilTeachersFemale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-[#932d16]">
                                {((formData.civilTeachersMale || 0) + (formData.civilTeachersFemale || 0)).toLocaleString()}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-semibold text-slate-800">2. ครูอัตราจ้าง</td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.hiredTeachersMale}
                                  onChange={(e) => handleInputChange('hiredTeachersMale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  disabled={isLocked}
                                  value={formData.hiredTeachersFemale}
                                  onChange={(e) => handleInputChange('hiredTeachersFemale', Number(e.target.value))}
                                  className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center mx-auto block disabled:bg-slate-100"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-[#932d16]">
                                {((formData.hiredTeachersMale || 0) + (formData.hiredTeachersFemale || 0)).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ==========================================================
                  SECTION 3: สถิตินักเรียนแยกชั้นปี และสารสนเทศอาชีวศึกษา
                 ========================================================== */}
              {(activeFormSection === 'all' || activeFormSection === 'grades') && (() => {
                const isLocked = !isSuperAdmin && (!schoolOpenStatus || !schoolPermissions.allowSectionGrades);
                const isGlow = schoolPermissions.glowSection === 'section_2';
                const totalPending = (formData.pendingGradM3 || 0) + (formData.pendingGradM6 || 0) + (formData.pendingGradVoc3 || 0);

                return (
                  <div
                    className={`rounded-3xl p-6 border transition-all space-y-6 ${
                      isGlow
                        ? 'glow-border-only'
                        : isLocked
                        ? 'border-slate-200 bg-slate-50/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#932d16]" />
                        <h3 className="text-base font-black text-slate-900">
                          3. สถิตินักเรียนแยกตามชั้นปี และสารสนเทศอาชีวศึกษา
                        </h3>
                      </div>
                      {isGlow && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shadow animate-bounce">
                          ⚡ กรุณาอัปเดตข้อมูล
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> ล็อกโดย สอจ. (อ่านอย่างเดียว)
                        </span>
                      )}
                    </div>

                    {/* Guidance banner when locked */}
                    {isLocked && (
                      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-xs">
                        <Lock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <strong className="font-black text-amber-900 block">
                            🔒 โหมดตรวจสอบข้อมูล (แท็บนี้ปิดรับการแก้ไขโดย สอจ.อุดรธานี)
                          </strong>
                          <span className="text-amber-800 text-[11px] mt-0.5 block leading-relaxed">
                            ท่านสามารถตรวจสอบข้อมูลเดิมที่เคยบันทึกไว้ได้ แต่ไม่สามารถพิมพ์แก้ไขได้ในขณะนี้ หากต้องการแก้ไขกรุณาติดต่อผู้ดูแลระบบ สอจ.อุดรธานี
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Male / Female */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">นักเรียน ชาย (คน)</label>
                        <input
                          type="number"
                          disabled={isLocked}
                          value={formData.maleStudents}
                          onChange={(e) => handleInputChange('maleStudents', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">นักเรียน หญิง (คน)</label>
                        <input
                          type="number"
                          disabled={isLocked}
                          value={formData.femaleStudents}
                          onChange={(e) => handleInputChange('femaleStudents', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="p-3 bg-slate-100 rounded-xl flex flex-col justify-center text-center">
                        <span className="text-[11px] text-slate-500 font-semibold">รวมทั้งหมด</span>
                        <span className="text-base font-black text-[#932d16]">
                          {(formData.maleStudents + formData.femaleStudents).toLocaleString()} คน
                        </span>
                      </div>
                    </div>

                    {/* Grade Level Breakdown */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-800">จำแนกตามระดับชั้นปี (คน)</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                          { key: 'vocCert1', label: 'ปวช. 1' },
                          { key: 'vocCert2', label: 'ปวช. 2' },
                          { key: 'vocCert3', label: 'ปวช. 3' },
                          { key: 'highVocCert1', label: 'ปวส. 1' },
                          { key: 'highVocCert2', label: 'ปวส. 2' },
                          { key: 'bachelorCount', label: 'ปริญญาตรี (ทล.บ.)' },
                        ].map((g) => (
                          <div key={g.key} className="space-y-1">
                            <label className="text-[11px] font-medium text-slate-600">{g.label}</label>
                            <input
                              type="number"
                              disabled={isLocked}
                              value={(formData as any)[g.key]}
                              onChange={(e) => handleInputChange(g.key, Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* โครงการและรูปแบบการศึกษาเฉพาะทาง */}
                    <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-3">
                      <h4 className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-sky-700" />
                        <span>โครงการและรูปแบบการศึกษาเฉพาะทาง (สารสนเทศอาชีวศึกษา)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">นักเรียนในระบบทวิภาคีรวม (คน)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            value={formData.dveStudentsCount}
                            onChange={(e) => handleInputChange('dveStudentsCount', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">นักเรียนโครงการทวิศึกษา (คน)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            value={formData.dualStudyCount}
                            onChange={(e) => handleInputChange('dualStudyCount', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">นักเรียนโครงการทวิวุฒิ (คน)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            value={formData.dualDegreeCount}
                            onChange={(e) => handleInputChange('dualDegreeCount', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* การเข้าร่วมการประเมิน อวท. ระดับจังหวัด */}
                      <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block">
                            การเข้าร่วมการประเมิน อวท. ระดับจังหวัด
                          </label>
                          <span className="text-[11px] text-slate-500">
                            การประเมินองค์การวิชาชีพในอนาคตแห่งประเทศไทย ระดับจังหวัด
                          </span>
                        </div>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={isLocked}
                            checked={!!formData.fttAssessment}
                            onChange={(e) => handleInputChange('fttAssessment', e.target.checked)}
                            className="w-4 h-4 text-[#932d16] rounded border-slate-300 focus:ring-[#932d16]"
                          />
                          <span className={`text-xs font-bold ${formData.fttAssessment ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {formData.fttAssessment ? '✓ เข้าร่วมการประเมินแล้ว' : 'ยังไม่ได้เข้าร่วม'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* ข้อมูลนักเรียนที่ศึกษาต่อแต่ยังไม่สำเร็จการศึกษา (ค้างจบ) */}
                    <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                          <span>ข้อมูลนักเรียนที่ศึกษาต่อแต่ยังไม่สำเร็จการศึกษา (ค้างจบ)</span>
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-black">
                          รวมค้างจบ: {totalPending.toLocaleString()} คน
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">นักเรียนค้างจบ ม.3 (คน)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            value={formData.pendingGradM3}
                            onChange={(e) => handleInputChange('pendingGradM3', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">นักเรียนค้างจบ ม.6 (คน)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            value={formData.pendingGradM6}
                            onChange={(e) => handleInputChange('pendingGradM6', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">นักเรียนค้างจบ ปวช.3 (คน)</label>
                          <input
                            type="number"
                            disabled={isLocked}
                            value={formData.pendingGradVoc3}
                            onChange={(e) => handleInputChange('pendingGradVoc3', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ==========================================================
                  SECTION 4: การจัดการศึกษาระบบทวิภาคี (จำแนกตามแผนกวิชา)
                 ========================================================== */}
              {(activeFormSection === 'all' || activeFormSection === 'dve') && (() => {
                const isLocked = !isSuperAdmin && (!schoolOpenStatus || !schoolPermissions.allowSectionDve);
                const isGlow = schoolPermissions.glowSection === 'section_dve';
                const totalDveStudents = dveDepartments.reduce((s, d) => s + (Number(d.studentCount) || 0), 0);

                return (
                  <div
                    className={`rounded-3xl p-6 border transition-all space-y-5 ${
                      isGlow
                        ? 'glow-border-only'
                        : isLocked
                        ? 'border-slate-200 bg-slate-50/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#932d16]" />
                        <div>
                          <h3 className="text-base font-black text-slate-900">
                            4. การจัดการศึกษาระบบทวิภาคี (จำแนกตามแผนกวิชา)
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            บันทึกแผนกวิชาที่เปิดสอนระบบทวิภาคี และจำนวนนักเรียนนักศึกษาในแต่ละแผนก
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isGlow && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shadow animate-bounce">
                            ⚡ กรุณาอัปเดตข้อมูล
                          </span>
                        )}
                        {isLocked && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> ล็อกโดย สอจ. (อ่านอย่างเดียว)
                          </span>
                        )}
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl text-xs font-bold">
                          เปิดสอน {dveDepartments.length} แผนก ({totalDveStudents.toLocaleString()} คน)
                        </span>
                        {!isLocked && (
                          <>
                            <button
                              type="button"
                              onClick={handleAddDveRow}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>เพิ่มแผนกวิชา</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveDve}
                              disabled={savingDve}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{savingDve ? 'กำลังบันทึก...' : 'บันทึกทวิภาคี'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Guidance banner when locked */}
                    {isLocked && (
                      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-xs">
                        <Lock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <strong className="font-black text-amber-900 block">
                            🔒 โหมดตรวจสอบข้อมูล (แท็บแผนกวิชาทวิภาคีปิดรับการแก้ไขโดย สอจ.อุดรธานี)
                          </strong>
                          <span className="text-amber-800 text-[11px] mt-0.5 block leading-relaxed">
                            ท่านสามารถตรวจสอบรายชื่อแผนกวิชาทวิภาคีเดิมที่เคยบันทึกไว้ได้ แต่ไม่สามารถเพิ่ม ลบ หรือแก้ไขได้ในขณะนี้ หากต้องการแก้ไขกรุณาติดต่อผู้ดูแลระบบ สอจ.อุดรธานี
                          </span>
                        </div>
                      </div>
                    )}

                    {dveDepartments.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">ยังไม่มีข้อมูลแผนกวิชาที่เปิดสอนระบบทวิภาคี</p>
                        <p className="text-[11px] text-slate-400 mt-1">กดปุ่ม "เพิ่มแผนกวิชา" เพื่อระบุแผนกวิชาและจำนวนนักเรียน</p>
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={handleAddDveRow}
                            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#932d16] text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ เพิ่มแผนกวิชาแรก</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-12 gap-2 px-3 text-[11px] font-bold text-slate-500">
                          <div className="col-span-1 text-center">ลำดับ</div>
                          <div className="col-span-7 sm:col-span-8">ชื่อแผนกวิชาที่เปิดสอนทวิภาคี</div>
                          <div className="col-span-3 sm:col-span-2 text-center">จำนวน นร./นศ. (คน)</div>
                          <div className="col-span-1 text-center">จัดการ</div>
                        </div>

                        {dveDepartments.map((dept, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors"
                          >
                            <div className="col-span-1 text-center font-bold text-xs text-slate-400">
                              {index + 1}
                            </div>
                            <div className="col-span-7 sm:col-span-8">
                              <input
                                type="text"
                                disabled={isLocked}
                                value={dept.departmentName}
                                onChange={(e) => handleUpdateDveRow(index, 'departmentName', e.target.value)}
                                placeholder="เช่น แผนกวิชาช่างยนต์, แผนกวิชาการบัญชี"
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 disabled:bg-slate-100"
                              />
                            </div>
                            <div className="col-span-3 sm:col-span-2">
                              <input
                                type="number"
                                min="0"
                                disabled={isLocked}
                                value={dept.studentCount}
                                onChange={(e) => handleUpdateDveRow(index, 'studentCount', Number(e.target.value))}
                                placeholder="0"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-[#932d16] focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 disabled:bg-slate-100"
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              {!isLocked && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDveRow(index)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="ลบแผนกวิชานี้"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ==========================================================
                  SECTION 5: ข้อมูลห้องเรียนอาชีพ & Reskill-Upskill
                 ========================================================== */}
              {(activeFormSection === 'all' || activeFormSection === 'career') && (() => {
                const isLocked = !isSuperAdmin && (!schoolOpenStatus || !schoolPermissions.allowSectionCareer);
                const isGlow = schoolPermissions.glowSection === 'section_career';
                const totalCareerStudents = careerClassrooms.reduce((s, c) => s + (Number(c.studentCount) || 0), 0);

                return (
                  <div
                    className={`rounded-3xl p-6 border transition-all space-y-5 ${
                      isGlow
                        ? 'glow-border-only'
                        : isLocked
                        ? 'border-slate-200 bg-slate-50/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#932d16]" />
                        <div>
                          <h3 className="text-base font-black text-slate-900">
                            5. ข้อมูลห้องเรียนอาชีพ & Reskill-Upskill
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ข้อมูลหลักสูตรห้องเรียนอาชีพ โรงเรียนเครือข่าย ประเภทการฝึกอบรม และรูปแบบการจัดการเรียนการสอน
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {isGlow && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shadow animate-bounce">
                            ⚡ กรุณาอัปเดตข้อมูล
                          </span>
                        )}
                        {isLocked && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> ล็อกโดย สอจ. (อ่านอย่างเดียว)
                          </span>
                        )}
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl text-xs font-bold">
                          เปิดสอน {careerClassrooms.length} หลักสูตร ({totalCareerStudents.toLocaleString()} คน)
                        </span>
                        {!isLocked && (
                          <>
                            <button
                              type="button"
                              onClick={handleAddCareerRow}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>เพิ่มหลักสูตร</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveCareer}
                              disabled={savingCareer}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{savingCareer ? 'กำลังบันทึก...' : 'บันทึกห้องเรียนอาชีพ'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Guidance banner when locked */}
                    {isLocked && (
                      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-xs">
                        <Lock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <strong className="font-black text-amber-900 block">
                            🔒 โหมดตรวจสอบข้อมูล (แท็บห้องเรียนอาชีพปิดรับการแก้ไขโดย สอจ.อุดรธานี)
                          </strong>
                          <span className="text-amber-800 text-[11px] mt-0.5 block leading-relaxed">
                            ท่านสามารถตรวจสอบข้อมูลหลักสูตรเดิมที่เคยบันทึกไว้ได้ แต่ไม่สามารถเพิ่ม ลบ หรือแก้ไขได้ในขณะนี้ หากต้องการแก้ไขกรุณาติดต่อผู้ดูแลระบบ สอจ.อุดรธานี
                          </span>
                        </div>
                      </div>
                    )}

                    {careerClassrooms.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">ยังไม่มีข้อมูลหลักสูตรห้องเรียนอาชีพ</p>
                        <p className="text-[11px] text-slate-400 mt-1">กดปุ่ม "เพิ่มหลักสูตร" เพื่อระบุหลักสูตรห้องเรียนอาชีพและโรงเรียนเครือข่าย</p>
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={handleAddCareerRow}
                            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#932d16] text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ เพิ่มหลักสูตรแรก</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {careerClassrooms.map((cls, index) => (
                          <div
                            key={index}
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200 flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-5 h-5 rounded-full bg-[#932d16] text-white flex items-center justify-center text-[10px] font-black">
                                  {index + 1}
                                </span>
                                <span className="text-xs font-black text-slate-800">
                                  หลักสูตรห้องเรียนอาชีพที่ {index + 1}
                                </span>
                                <span className="text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-lg border border-amber-200/80">
                                  เครือข่าย: {(cls.partnerSchools || []).length} แห่ง • นักเรียนรวม: {(cls.studentCount || 0).toLocaleString()} คน
                                </span>
                              </div>
                              {!isLocked && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCareerRow(index)}
                                  className="text-slate-400 hover:text-rose-600 text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>ลบหลักสูตร</span>
                                </button>
                              )}
                            </div>

                            {/* ส่วนข้อมูลหลักสูตร */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[11px] font-bold text-slate-700">ชื่อหลักสูตรวิชาชีพ</label>
                                <input
                                  type="text"
                                  disabled={isLocked}
                                  value={cls.courseName}
                                  onChange={(e) => handleUpdateCareerRow(index, 'courseName', e.target.value)}
                                  placeholder="เช่น หลักสูตรการซ่อมบำรุงยานยนต์ไฟฟ้า (EV Fundamentals)"
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 disabled:bg-slate-100"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700">ประเภทการฝึกอบรม</label>
                                <select
                                  disabled={isLocked}
                                  value={cls.trainingType || 'SHORT_COURSE'}
                                  onChange={(e) => handleUpdateCareerRow(index, 'trainingType', e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 disabled:bg-slate-100"
                                >
                                  <option value="SHORT_COURSE">วิชาชีพระยะสั้น</option>
                                  <option value="RESKILL_UPSKILL">Reskill / Upskill</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-700">รูปแบบการจัดการเรียน</label>
                                <select
                                  disabled={isLocked}
                                  value={cls.learningFormat || 'ONSITE'}
                                  onChange={(e) => handleUpdateCareerRow(index, 'learningFormat', e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 disabled:bg-slate-100"
                                >
                                  <option value="ONSITE">On-site ในสถานศึกษา</option>
                                  <option value="WORKPLACE">ฝึกในสถานประกอบการ</option>
                                  <option value="ONLINE">Online</option>
                                  <option value="HYBRID">แบบผสมผสาน (Hybrid)</option>
                                </select>
                              </div>
                            </div>

                            {/* ส่วนโรงเรียนเครือข่ายและสถิตินักเรียนรายหัว (1-to-Many ตามภาพที่ 2) */}
                            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <School className="w-4 h-4 text-[#932d16]" />
                                  <span className="text-xs font-bold text-slate-800">
                                    โรงเรียนเครือข่ายที่เข้าร่วมและจำนวนนักเรียน (นับรายหัว)
                                  </span>
                                  <span className="text-[10px] font-black text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                                    {(cls.partnerSchools || []).length} แห่ง • {(cls.studentCount || 0).toLocaleString()} คน
                                  </span>
                                </div>
                                {!isLocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleAddPartnerSchool(index)}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#932d16] hover:text-white hover:bg-[#932d16] bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-300/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ เพิ่มโรงเรียนเครือข่าย</span>
                                  </button>
                                )}
                              </div>

                              {/* รายการโรงเรียนเครือข่ายแต่ละแห่ง */}
                              <div className="space-y-1.5">
                                {(cls.partnerSchools || []).map((school, sIndex) => (
                                  <div
                                    key={sIndex}
                                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0">
                                        {sIndex + 1}
                                      </span>
                                      <input
                                        type="text"
                                        disabled={isLocked}
                                        value={school.schoolName}
                                        onChange={(e) => handleUpdatePartnerSchool(index, sIndex, 'schoolName', e.target.value)}
                                        placeholder="ระบุชื่อโรงเรียนเครือข่าย เช่น รร.อุดรพิทยานุกูล"
                                        className="flex-1 px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 disabled:bg-slate-100"
                                      />
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 justify-end">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-semibold text-slate-500">จำนวน:</span>
                                        <input
                                          type="number"
                                          min="0"
                                          disabled={isLocked}
                                          value={school.studentCount === 0 ? '' : school.studentCount}
                                          onChange={(e) => handleUpdatePartnerSchool(index, sIndex, 'studentCount', e.target.value)}
                                          placeholder="0"
                                          className="w-20 px-2 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-black text-[#932d16] text-right focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 disabled:bg-slate-100"
                                        />
                                        <span className="text-[11px] font-semibold text-slate-500">คน</span>
                                      </div>

                                      {!isLocked && (cls.partnerSchools || []).length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePartnerSchool(index, sIndex)}
                                          title="ลบโรงเรียนเครือข่ายนี้"
                                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ==========================================================
                  SECTION 6: ผู้สำเร็จการศึกษา และภาวะการมีงานทำ
                 ========================================================== */}
              {(activeFormSection === 'all' || activeFormSection === 'graduates') && (() => {
                const isLocked = !isSuperAdmin && (!schoolOpenStatus || !schoolPermissions.allowSectionGraduates);
                const isGlow = schoolPermissions.glowSection === 'section_3';
                return (
                  <div
                    className={`rounded-3xl p-6 border transition-all ${
                      isGlow
                        ? 'glow-border-only'
                        : isLocked
                        ? 'border-slate-200 bg-slate-50/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-[#932d16]" />
                        <h3 className="text-base font-black text-slate-900">
                          6. ผู้สำเร็จการศึกษา และภาวะการมีงานทำ
                        </h3>
                      </div>
                      {isGlow && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shadow animate-bounce">
                          ⚡ กรุณาอัปเดตข้อมูล
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> ล็อกโดย สอจ. (อ่านอย่างเดียว)
                        </span>
                      )}
                    </div>

                    {/* Guidance banner when locked */}
                    {isLocked && (
                      <div className="mb-5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3 shadow-xs">
                        <Lock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <strong className="font-black text-amber-900 block">
                            🔒 โหมดตรวจสอบข้อมูล (แท็บนี้ปิดรับการแก้ไขโดย สอจ.อุดรธานี)
                          </strong>
                          <span className="text-amber-800 text-[11px] mt-0.5 block leading-relaxed">
                            ท่านสามารถตรวจสอบข้อมูลเดิมที่เคยบันทึกไว้ได้ แต่ไม่สามารถพิมพ์แก้ไขได้ในขณะนี้ หากต้องการแก้ไขกรุณาติดต่อผู้ดูแลระบบ สอจ.อุดรธานี
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ปวช. สำเร็จการศึกษา (คน)</label>
                        <input
                          type="number"
                          disabled={isLocked}
                          value={formData.gradVocCertCount}
                          onChange={(e) => handleInputChange('gradVocCertCount', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ปวส. สำเร็จการศึกษา (คน)</label>
                        <input
                          type="number"
                          disabled={isLocked}
                          value={formData.gradHighVocCertCount}
                          onChange={(e) => handleInputChange('gradHighVocCertCount', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ทำงานตรงสาขา (คน)</label>
                        <input
                          type="number"
                          disabled={isLocked}
                          value={formData.employedInField}
                          onChange={(e) => handleInputChange('employedInField', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ทำงานไม่ตรงสาขา (คน)</label>
                        <input
                          type="number"
                          disabled={isLocked}
                          value={formData.employedOutField}
                          onChange={(e) => handleInputChange('employedOutField', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ประกอบอาชีพอิสระ (คน)</label>
                        <input
                          type="number"
                          disabled={isLocked}
                          value={formData.employedFreelance}
                          onChange={(e) => handleInputChange('employedFreelance', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ศึกษาต่อ (คน)</label>
                        <input
                          type="number"
                          disabled={isLocked}
                          value={formData.furtherStudyCount}
                          onChange={(e) => handleInputChange('furtherStudyCount', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Submit Button & Lock Notice */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  {!isSuperAdmin && !schoolOpenStatus ? (
                    <span className="text-rose-600 font-bold flex items-center gap-1.5">
                      <Lock className="w-4 h-4 shrink-0" />
                      ขณะนี้ระบบปิดรับการรายงานข้อมูลสถิติโดย สอจ.อุดรธานี
                    </span>
                  ) : (
                    <span>ตรวจสอบความถูกต้องของข้อมูลก่อนคลิกบันทึก</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={savingStat || (!isSuperAdmin && !schoolOpenStatus)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#932d16] hover:bg-[#7a2411] text-white font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  <span>{savingStat ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลสถิติของสถานศึกษา'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      {/* 1. Modal Add Institution */}
      {showAddInstitutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowAddInstitutionModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <School className="w-5 h-5 text-[#932d16]" />
              <span>เพิ่มสถานศึกษาใหม่ในสังกัด</span>
            </h3>
            <form onSubmit={handleCreateInstitution} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">รหัสสถานศึกษา *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 13410111"
                    value={newInstCode}
                    onChange={(e) => setNewInstCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">ประเภทสถานศึกษา *</label>
                  <select
                    value={newInstType}
                    onChange={(e) => setNewInstType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="PUBLIC">ภาครัฐ</option>
                    <option value="PRIVATE">ภาคเอกชน</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ชื่อสถานศึกษา *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น วิทยาลัยเทคนิคอุดรธานี 2"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ชื่อผู้บริหาร (ผอ.)</label>
                <input
                  type="text"
                  placeholder="เช่น นายสมเกียรติ ยิ่งเจริญ"
                  value={newInstDirector}
                  onChange={(e) => setNewInstDirector(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={newInstPhone}
                    onChange={(e) => setNewInstPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">เว็บไซต์</label>
                  <input
                    type="url"
                    value={newInstWebsite}
                    onChange={(e) => setNewInstWebsite(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">สาขาที่เปิดสอน</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newInstProgramsCount}
                    onChange={(e) => setNewInstProgramsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ลิงก์ดูหลักสูตร/สาขาวิชา (URL)</label>
                <input
                  type="url"
                  placeholder="https://example.ac.th/curriculum"
                  value={newInstProgramsUrl}
                  onChange={(e) => setNewInstProgramsUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddInstitutionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={creatingInst}
                  className="px-5 py-2 text-xs font-bold bg-[#932d16] text-white rounded-xl shadow"
                >
                  {creatingInst ? 'กำลังบันทึก...' : 'บันทึกสถานศึกษา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Add / Edit User */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#932d16]" />
              <span>{editingUserId ? 'แก้ไขบัญชีผู้ใช้งาน' : 'เพิ่มบัญชีผู้ใช้งานใหม่'}</span>
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Username / อีเมล *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น admin.udtech@udpvec.go.th"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  รหัสผ่าน {editingUserId && '(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)'}
                </label>
                <div className="relative">
                  <input
                    type={showUserPassword ? 'text' : 'password'}
                    required={!editingUserId}
                    placeholder="••••••••"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md transition-colors"
                    tabIndex={-1}
                    title={showUserPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ชื่อ - นามสกุล *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น แอดมิน วท.อุดรธานี"
                  value={userFullName}
                  onChange={(e) => setUserFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">บทบาท *</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="SCHOOL_ADMIN">แอดมินสถานศึกษา (school_admin)</option>
                  <option value="SUPER_ADMIN">แอดมิน สอจ. (super_admin)</option>
                </select>
              </div>
              {userRole === 'SCHOOL_ADMIN' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">สังกัดสถานศึกษา *</label>
                  <select
                    value={userInstitutionId}
                    onChange={(e) => setUserInstitutionId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="">-- เลือกสถานศึกษา --</option>
                    {submissionStatuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2 text-xs font-bold bg-[#932d16] text-white rounded-xl shadow"
                >
                  {savingUser ? 'กำลังบันทึก...' : 'บันทึกข้อมูลผู้ใช้'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Edit Contact Info */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#932d16]" />
              <span>แก้ไขข้อมูลติดต่อ สอจ. (Footer Info)</span>
            </h3>
            <form onSubmit={handleSaveContactInfo} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ที่อยู่สำนักงาน สอจ.</label>
                <textarea
                  rows={2}
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ลิงก์เฟซบุ๊กแฟนเพจ</label>
                <input
                  type="url"
                  value={contactFacebook}
                  onChange={(e) => setContactFacebook(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#932d16] text-white rounded-xl shadow"
                >
                  บันทึกข้อมูลติดต่อ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Government Report Print Modal */}
      <OfficialReportPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        academicYear={selectedYear}
        semester={selectedSemester}
        statusList={submissionStatuses}
        singleSchoolData={printSingleSchoolData}
      />
    </div>
  );
};
