import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SubmissionStatusItem, NewsItem } from '../../types';
import {
  toggleSubmissionOpen,
  getSubmissionStatuses,
  getMySchoolStat,
  submitSchoolStat,
  getNewsList,
  createNews,
  deleteNews,
  updateSubmissionPermissions,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  createInstitution,
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
  Sparkles,
  UserPlus,
  Camera,
  Loader2,
} from 'lucide-react';

interface AdminPortalProps {
  user: UserProfile;
  onRefreshStats: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ user, onRefreshStats }) => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // ==========================================
  // FLOATING TOAST NOTIFICATION
  // ==========================================
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 6000);
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
  const [creatingInst, setCreatingInst] = useState(false);

  // Super Admin: College Editing Mode
  const [editingCollege, setEditingCollege] = useState<SubmissionStatusItem | null>(null);
  const [loadingCollegeStat, setLoadingCollegeStat] = useState(false);

  // ==========================================
  // SUPER ADMIN STATE: TAB 2 (แบนเนอร์, ข่าว, ข้อมูลติดต่อ)
  // ==========================================
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [showAddNewsForm, setShowAddNewsForm] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCoverImage, setNewsCoverImage] = useState<string | null>(null);
  const [creatingNews, setCreatingNews] = useState(false);
  const newsFileInputRef = useRef<HTMLInputElement>(null);

  // Contact Info Modal
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
  const [allowSectionGrades, setAllowSectionGrades] = useState<boolean>(true);
  const [allowSectionGraduates, setAllowSectionGraduates] = useState<boolean>(true);
  const [glowSection, setGlowSection] = useState<string>('none');
  const [savingPermissions, setSavingPermissions] = useState<boolean>(false);

  // ==========================================
  // SUPER ADMIN STATE: TAB 4 (จัดการผู้ใช้งาน)
  // ==========================================
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userRole, setUserRole] = useState<'SUPER_ADMIN' | 'SCHOOL_ADMIN'>('SCHOOL_ADMIN');
  const [userInstitutionId, setUserInstitutionId] = useState('');
  const [savingUser, setSavingUser] = useState(false);

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
    allowSectionGrades: true,
    allowSectionGraduates: true,
    glowSection: 'none',
  });

  const [formData, setFormData] = useState({
    academicYear: 2568,
    semester: 1,
    directorName: '',
    photoUrl: '',
    totalExecutives: 1,
    totalTeachers: 0,
    totalStaff: 0,
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
  useEffect(() => {
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
    getMySchoolStat(year, semester)
      .then((res: any) => {
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
      })
      .catch((err) => console.error('Failed to load school stat:', err))
      .finally(() => setLoadingSchoolStat(false));
  };

  const populateFormWithData = (data: any, inst?: any) => {
    const director = inst?.personnels?.[0];
    setFormData({
      academicYear: data.academicYear || selectedYear,
      semester: data.semester || selectedSemester,
      directorName: director?.name || '',
      photoUrl: director?.photoUrl || '',
      phone: inst?.phone || '',
      website: inst?.website || '',
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
    setFormData({
      academicYear: year,
      semester: semester,
      directorName: director?.name || '',
      photoUrl: director?.photoUrl || '',
      phone: inst?.phone || '',
      website: inst?.website || '',
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
    getMySchoolStat(year, sem, college.id)
      .then((res: any) => {
        if (res.data) {
          populateFormWithData(res.data, res.institution);
        } else {
          resetFormForYear(year, sem, res.institution);
        }
        setTimeout(() => {
          document.getElementById('college-edit-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      })
      .catch((err) => console.error('Failed to load college stat:', err))
      .finally(() => setLoadingCollegeStat(false));
  };

  // Super Admin: Toggle Open/Close Submission Window
  const handleToggleSubmission = async () => {
    const nextState = !submissionOpen;
    const confirmMsg = nextState
      ? 'ยืนยันการ "เปิดระบบ" ให้สถานศึกษาทั้ง 29 แห่งบันทึกข้อมูลสถิติ?'
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
        allowSectionGrades,
        allowSectionGraduates,
        glowSection,
      });
      showToast('success', 'บันทึกการตั้งค่าสำเร็จ!', 'บันทึกการเปิด-ปิดสิทธิ์และจุดเด่นแสงกระพริบเรียบร้อยแล้ว');
    } catch (err: any) {
      showToast('error', 'บันทึกไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setSavingPermissions(false);
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

  // Super Admin: Submit News
  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      showToast('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกหัวข้อข่าวและเนื้อหาข่าว');
      return;
    }

    try {
      setCreatingNews(true);
      await createNews({
        title: newsTitle,
        content: newsContent,
        category: 'BANNER_SLIDE',
        coverImageUrl: newsCoverImage || undefined,
      });

      setNewsTitle('');
      setNewsContent('');
      setNewsCoverImage(null);
      setShowAddNewsForm(false);
      loadNewsData();
      showToast('success', 'เผยแพร่ข่าวสารสำเร็จ!', 'ข่าวประชาสัมพันธ์ถูกเพิ่มเข้าระบบและแสดงบนหน้าแรกเรียบร้อยแล้ว');
    } catch (err: any) {
      showToast('error', 'เผยแพร่ข่าวไม่สำเร็จ', err.response?.data?.message || err.message);
    } finally {
      setCreatingNews(false);
    }
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
      });
      setShowAddInstitutionModal(false);
      setNewInstCode('');
      setNewInstName('');
      setNewInstDirector('');
      setNewInstPhone('');
      setNewInstWebsite('');
      loadSuperAdminData();
      showToast('success', 'เพิ่มสถานศึกษาสำเร็จ!', `เพิ่ม ${newInstName} เข้าระบบเรียบร้อยแล้ว`);
    } catch (err: any) {
      showToast('error', 'ไม่สามารถเพิ่มสถานศึกษาได้', err.response?.data?.message || err.message);
    } finally {
      setCreatingInst(false);
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
        academicYear: selectedYear,
        semester: selectedSemester,
      };

      if (isSuperAdmin && editingCollege) {
        payload.institutionId = editingCollege.id;
      }

      await submitSchoolStat(payload);

      showToast(
        'success',
        'บันทึกข้อมูลสำเร็จ!',
        `ข้อมูลสถิติปีการศึกษา ${selectedYear} ภาคเรียนที่ ${selectedSemester} ได้รับการอัปเดตเรียบร้อยแล้ว`
      );

      onRefreshStats();

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
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>ตั้งค่าเปิด-ปิดการกรอกข้อมูล & จุดเด่นแสงกระพริบ</span>
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
              <button
                onClick={() => setShowAddInstitutionModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#932d16] hover:bg-[#7a2411] text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ เพิ่มสถานศึกษา</span>
              </button>
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
                          <button
                            onClick={() => handleStartEditCollege(item)}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-[#932d16] text-slate-700 hover:text-white rounded-lg font-bold text-xs transition-all shadow-sm flex items-center gap-1 mx-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
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
                onClick={() => setShowAddNewsForm(!showAddNewsForm)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{showAddNewsForm ? 'ปิดฟอร์ม' : '+ เพิ่มข่าวสไลด์ใหม่'}</span>
              </button>
            </div>

            {/* Add News Form with Image resize to avoid 413 */}
            {showAddNewsForm && (
              <form onSubmit={handleCreateNews} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-6 space-y-4">
                <h4 className="text-sm font-black text-slate-900">เพิ่มข่าวประชาสัมพันธ์ใหม่</h4>
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

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNewsForm(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-xl"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={creatingNews}
                    className="px-5 py-2 text-xs font-bold bg-[#932d16] hover:bg-[#7a2411] text-white rounded-xl shadow disabled:opacity-50"
                  >
                    {creatingNews ? 'กำลังบันทึก...' : 'เผยแพร่ข่าวสาร'}
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
                        <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">{item.title}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{item.content}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-600">{idx + 1}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteNews(item.id, item.title)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg font-bold text-xs transition-colors"
                          >
                            ลบ
                          </button>
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
                  <h4 className="text-sm font-bold text-slate-900">2. แท็บสถิตินักเรียนแยกชั้นปี (ปวช.1-3 / ปวส.1-2)</h4>
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
                  <h4 className="text-sm font-bold text-slate-900">3. แท็บผู้สำเร็จการศึกษา & ภาวะการมีงานทำ</h4>
                  <p className="text-xs text-slate-500">อนุญาตให้บันทึกจำนวนคนจบและติดตามการมีงานทำ</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSectionGraduates}
                  onChange={(e) => setAllowSectionGraduates(e.target.checked)}
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
                <option value="section_1">แท็บที่ 1: ข้อมูลทั่วไปและผู้บริหาร</option>
                <option value="section_2">แท็บที่ 2: สถิตินักเรียนแยกชั้นปี</option>
                <option value="section_3">แท็บที่ 3: ผู้สำเร็จการศึกษา & มีงานทำ</option>
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
                  บัญชีผู้ดูแลระบบและแอดมินประจำวิทยาลัย 29 แห่ง
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
      {(!isSuperAdmin || editingCollege) && (
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

              {/* Year and Semester Dropdowns */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span>ปีการศึกษา:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearSemesterChange(Number(e.target.value), selectedSemester)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#932d16]"
                  >
                    <option value={2568}>2568</option>
                    <option value={2567}>2567</option>
                    <option value={2566}>2566</option>
                    <option value={2565}>2565</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span>ภาคเรียนที่:</span>
                  <select
                    value={selectedSemester}
                    onChange={(e) => handleYearSemesterChange(selectedYear, Number(e.target.value))}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#932d16]"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </select>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveStat} className="space-y-8">
              {/* ==========================================================
                  SECTION 1: ข้อมูลทั่วไปและผู้บริหาร
                 ========================================================== */}
              {(() => {
                const isLocked = !isSuperAdmin && !schoolPermissions.allowSectionGeneral;
                const isGlow = schoolPermissions.glowSection === 'section_1';
                return (
                  <div
                    className={`rounded-3xl p-6 border transition-all ${
                      isGlow
                        ? 'border-amber-400 ring-4 ring-amber-400/50 animate-pulse shadow-lg bg-amber-50/20'
                        : 'border-slate-200 bg-white'
                    } ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}
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
                          ⚡ จุดเน้นย้ำด่วน
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> ล็อกโดย สอจ.
                        </span>
                      )}
                    </div>

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
                        <label className="cursor-pointer px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1.5 shadow-sm">
                          <Camera className="w-3 h-3" />
                          <span>เปลี่ยนภาพผู้บริหาร</span>
                          <input type="file" accept="image/*" onChange={handleDirectorPhotoInForm} className="hidden" />
                        </label>
                      </div>

                      {/* Inputs */}
                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">ชื่อ - นามสกุล ผู้บริหาร (ผอ.)</label>
                          <input
                            type="text"
                            value={formData.directorName}
                            onChange={(e) => handleInputChange('directorName', e.target.value)}
                            placeholder="เช่น นายธีรภัทร์ ไชยสัตย์"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">จำนวนผู้บริหาร (คน) (ผอ. / รอง ผอ.)</label>
                          <input
                            type="number"
                            min="1"
                            value={formData.totalExecutives}
                            onChange={(e) => handleInputChange('totalExecutives', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">จำนวนครูผู้สอน (คน)</label>
                          <input
                            type="number"
                            value={formData.totalTeachers}
                            onChange={(e) => handleInputChange('totalTeachers', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">จำนวนบุคลากรทางการศึกษา (คน)</label>
                          <input
                            type="number"
                            value={formData.totalStaff}
                            onChange={(e) => handleInputChange('totalStaff', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">เบอร์โทรศัพท์ติดต่อ</label>
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">เว็บไซต์สถานศึกษา</label>
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ==========================================================
                  SECTION 2: สถิตินักเรียนแยกชั้นปี
                 ========================================================== */}
              {(() => {
                const isLocked = !isSuperAdmin && !schoolPermissions.allowSectionGrades;
                const isGlow = schoolPermissions.glowSection === 'section_2';
                return (
                  <div
                    className={`rounded-3xl p-6 border transition-all ${
                      isGlow
                        ? 'border-amber-400 ring-4 ring-amber-400/50 animate-pulse shadow-lg bg-amber-50/20'
                        : 'border-slate-200 bg-white'
                    } ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#932d16]" />
                        <h3 className="text-base font-black text-slate-900">
                          2. สถิตินักเรียนแยกตามชั้นปี และเพศ
                        </h3>
                      </div>
                      {isGlow && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shadow animate-bounce">
                          ⚡ จุดเน้นย้ำด่วน
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> ล็อกโดย สอจ.
                        </span>
                      )}
                    </div>

                    {/* Male / Female */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">นักเรียน ชาย (คน)</label>
                        <input
                          type="number"
                          value={formData.maleStudents}
                          onChange={(e) => handleInputChange('maleStudents', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">นักเรียน หญิง (คน)</label>
                        <input
                          type="number"
                          value={formData.femaleStudents}
                          onChange={(e) => handleInputChange('femaleStudents', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
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
                            value={(formData as any)[g.key]}
                            onChange={(e) => handleInputChange(g.key, Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ==========================================================
                  SECTION 3: ผู้สำเร็จการศึกษา และภาวะการมีงานทำ
                 ========================================================== */}
              {(() => {
                const isLocked = !isSuperAdmin && !schoolPermissions.allowSectionGraduates;
                const isGlow = schoolPermissions.glowSection === 'section_3';
                return (
                  <div
                    className={`rounded-3xl p-6 border transition-all ${
                      isGlow
                        ? 'border-amber-400 ring-4 ring-amber-400/50 animate-pulse shadow-lg bg-amber-50/20'
                        : 'border-slate-200 bg-white'
                    } ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-[#932d16]" />
                        <h3 className="text-base font-black text-slate-900">
                          3. ผู้สำเร็จการศึกษา และภาวะการมีงานทำ
                        </h3>
                      </div>
                      {isGlow && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shadow animate-bounce">
                          ⚡ จุดเน้นย้ำด่วน
                        </span>
                      )}
                      {isLocked && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> ล็อกโดย สอจ.
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ปวช. สำเร็จการศึกษา (คน)</label>
                        <input
                          type="number"
                          value={formData.gradVocCertCount}
                          onChange={(e) => handleInputChange('gradVocCertCount', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ปวส. สำเร็จการศึกษา (คน)</label>
                        <input
                          type="number"
                          value={formData.gradHighVocCertCount}
                          onChange={(e) => handleInputChange('gradHighVocCertCount', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ทำงานตรงสาขา (คน)</label>
                        <input
                          type="number"
                          value={formData.employedInField}
                          onChange={(e) => handleInputChange('employedInField', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ทำงานไม่ตรงสาขา (คน)</label>
                        <input
                          type="number"
                          value={formData.employedOutField}
                          onChange={(e) => handleInputChange('employedOutField', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ประกอบอาชีพอิสระ (คน)</label>
                        <input
                          type="number"
                          value={formData.employedFreelance}
                          onChange={(e) => handleInputChange('employedFreelance', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ศึกษาต่อ (คน)</label>
                        <input
                          type="number"
                          value={formData.furtherStudyCount}
                          onChange={(e) => handleInputChange('furtherStudyCount', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="submit"
                  disabled={savingStat || (!isSuperAdmin && !schoolOpenStatus)}
                  className="px-8 py-3.5 bg-[#932d16] hover:bg-[#7a2411] text-white font-bold text-sm rounded-2xl shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{savingStat ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลสถิติของวิทยาลัย'}</span>
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
              <div className="grid grid-cols-2 gap-3">
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
                <input
                  type="password"
                  required={!editingUserId}
                  placeholder="••••••••"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
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
    </div>
  );
};
