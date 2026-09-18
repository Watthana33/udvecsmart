import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SubmissionStatusItem } from '../../types';
import {
  toggleSubmissionOpen,
  getSubmissionStatuses,
  getMySchoolStat,
  submitSchoolStat,
  createNews,
} from '../../services/api';
import {
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  Search,
  Save,
  PlusCircle,
  Users,
  GraduationCap,
  AlertTriangle,
  RefreshCw,
  School,
  FileSpreadsheet,
  Edit3,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Upload,
  UserCheck,
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
  // SUPER ADMIN STATE
  // ==========================================
  const [submissionOpen, setSubmissionOpen] = useState<boolean>(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [submissionStatuses, setSubmissionStatuses] = useState<SubmissionStatusItem[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [statusSearch, setStatusSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  // Super Admin: College Editing Mode (สามารถเข้าไปแก้ไขข้อมูลวิทยาลัยใดๆ ได้)
  const [editingCollege, setEditingCollege] = useState<SubmissionStatusItem | null>(null);
  const [loadingCollegeStat, setLoadingCollegeStat] = useState(false);

  // News State with Photo Upload
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<'ANNOUNCEMENT' | 'ACTIVITY'>('ANNOUNCEMENT');
  const [newsCoverImage, setNewsCoverImage] = useState<string | null>(null);
  const [creatingNews, setCreatingNews] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // SCHOOL ADMIN / EDITING FORM STATE
  // ==========================================
  const [schoolOpenStatus, setSchoolOpenStatus] = useState<boolean>(true);
  const [schoolInstitution, setSchoolInstitution] = useState<any>(null);
  const [loadingSchoolStat, setLoadingSchoolStat] = useState(false);
  const [savingStat, setSavingStat] = useState(false);

  const [formData, setFormData] = useState({
    academicYear: 2568,
    semester: 1,
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

  // ==========================================
  // LOAD DATA ON MOUNT
  // ==========================================
  useEffect(() => {
    if (isSuperAdmin) {
      loadSuperAdminData();
    } else {
      loadSchoolAdminData();
    }
  }, [isSuperAdmin]);

  const loadSuperAdminData = () => {
    setLoadingStatuses(true);
    getSubmissionStatuses(2568, 1)
      .then((res) => {
        setSubmissionStatuses(res.data);
        setSubmissionOpen(res.isSubmissionOpen);
      })
      .catch((err) => console.error('Failed to load submission statuses:', err))
      .finally(() => setLoadingStatuses(false));
  };

  const loadSchoolAdminData = () => {
    setLoadingSchoolStat(true);
    getMySchoolStat(2568, 1)
      .then((res) => {
        setSchoolOpenStatus(res.isSubmissionOpen);
        setSchoolInstitution(res.institution);
        if (res.data) {
          populateFormWithData(res.data);
        }
      })
      .catch((err) => console.error('Failed to load school stat:', err))
      .finally(() => setLoadingSchoolStat(false));
  };

  const populateFormWithData = (data: any) => {
    setFormData({
      academicYear: data.academicYear || 2568,
      semester: data.semester || 1,
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

  // Super Admin: Start Editing Any College
  const handleStartEditCollege = (college: SubmissionStatusItem) => {
    setEditingCollege(college);
    setLoadingCollegeStat(true);
    getMySchoolStat(2568, 1, college.id)
      .then((res) => {
        if (res.data) {
          populateFormWithData(res.data);
        } else {
          // Reset form to default for this college
          setFormData({
            academicYear: 2568,
            semester: 1,
            maleStudents: college.maleStudents || 0,
            femaleStudents: college.femaleStudents || 0,
            vocCert1: 0,
            vocCert2: 0,
            vocCert3: 0,
            highVocCert1: 0,
            highVocCert2: 0,
            bachelorCount: 0,
            totalExecutives: college.totalExecutives ?? 1,
            totalTeachers: college.totalTeachers || 0,
            totalStaff: college.totalStaff || 0,
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

  // Photo upload handler for News
  const handleNewsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ภาพต้องไม่เกิน 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewsCoverImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Super Admin: Publish News with Cover Image
  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      showToast('error', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกหัวข้อข่าวและเนื้อหาข่าวให้ครบถ้วน');
      return;
    }

    setCreatingNews(true);
    try {
      await createNews({
        title: newsTitle,
        content: newsContent,
        category: newsCategory,
        coverImageUrl: newsCoverImage || undefined,
      });
      setNewsTitle('');
      setNewsContent('');
      setNewsCoverImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('success', 'เผยแพร่ข่าวสำเร็จ', 'ข่าวสารใหม่ถูกเพิ่มเข้าสู่สไลเดอร์หน้าแรกเรียบร้อยแล้ว');
      onRefreshStats();
    } catch (err: any) {
      showToast('error', 'เผยแพร่ข่าวล้มเหลว', err.response?.data?.message || err.message);
    } finally {
      setCreatingNews(false);
    }
  };

  // Handle Input Change for numerical fields
  const handleInputChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  };

  // Submit Form (for both School Admin and Super Admin editing a college)
  const handleSubmitStat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStat(true);

    const targetPayload = {
      ...formData,
      institutionId: isSuperAdmin && editingCollege ? editingCollege.id : undefined,
    };

    const targetCollegeName = isSuperAdmin && editingCollege
      ? editingCollege.name
      : schoolInstitution?.name || 'สถานศึกษา';

    try {
      await submitSchoolStat(targetPayload);
      showToast(
        'success',
        'บันทึกข้อมูลสถิติสำเร็จ!',
        `ระบบได้ทำการบันทึกและอัปเดตสถิติของ ${targetCollegeName} ลงสู่ฐานข้อมูลกลางเรียบร้อยแล้ว`
      );
      onRefreshStats();
      if (isSuperAdmin) {
        loadSuperAdminData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
      showToast('error', 'บันทึกข้อมูลไม่สำเร็จ', msg);
    } finally {
      setSavingStat(false);
    }
  };

  // Filter 29 colleges
  const filteredStatuses = submissionStatuses.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(statusSearch.toLowerCase()) ||
      s.code.includes(statusSearch);
    const matchType = statusFilter === 'ALL' || s.type === statusFilter;
    return matchSearch && matchType;
  });

  const submittedCount = submissionStatuses.filter((s) => s.isSubmitted).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
      
      {/* Floating Animated Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce-in shadow-2xl rounded-2xl p-4 bg-white border-2 flex items-start gap-3.5 transition-all">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-extrabold ${toast.type === 'success' ? 'text-emerald-900' : 'text-rose-900'}`}>
              {toast.title}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Portal Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#932d16]/10 text-[#932d16] flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
            {isSuperAdmin ? <ShieldCheck className="w-8 h-8" /> : <School className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#932d16]/10 text-[#932d16]">
                {isSuperAdmin ? 'ผู้ดูแลระบบส่วนกลาง สอจ.อุดรธานี' : 'ผู้ดูแลระบบสถานศึกษา'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ปีการศึกษา 2568 / ภาคเรียนที่ 1
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {isSuperAdmin
                ? 'ศูนย์ควบคุมและบริหารจัดการ สอจ.อุดรธานี (Super Admin Control Center)'
                : `ระบบรายงานสถิติ: ${schoolInstitution?.name || user.institution?.name || 'สถานศึกษา'}`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ผู้ปฏิบัติงาน: <strong>{user.fullName}</strong> ({user.email})
            </p>
          </div>
        </div>

        <button
          onClick={() => (isSuperAdmin ? loadSuperAdminData() : loadSchoolAdminData())}
          className="self-start md:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. SUPER ADMIN VIEW: TOGGLE WINDOW, EDIT ANY COLLEGE, NEWS */}
      {/* ============================================================== */}
      {isSuperAdmin && (
        <div className="space-y-8">
          {/* Section 1: Submission Window Master Switch */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                      submissionOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        submissionOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                      }`}
                    />
                    {submissionOpen ? 'ระบบเปิดรับการกรอกข้อมูล' : 'ระบบปิดรับการกรอกข้อมูลแล้ว'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">
                  {submissionOpen
                    ? 'สถานศึกษาทั้ง 29 แห่ง กำลังสามารถเข้ามากรอก/แก้ไขสถิติได้'
                    : 'สถานศึกษาถูกล็อก ไม่สามารถแก้ไขหรือส่งข้อมูลได้ (ยกเว้นท่านที่เป็นแอดมิน สอจ.)'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
                  เมื่อเปิดระบบ แอดมินวิทยาลัยจะสามารถเข้ามากรอกสถิติได้ เมื่อปิดระบบ วิทยาลัยจะไม่สามารถบันทึกได้
                  แต่ท่านที่เป็น **แอดมิน สอจ. จะมีสิทธิ์เข้าแก้ไขข้อมูลแทนสถานศึกษาใดๆ ได้ตลอดเวลา**
                </p>
              </div>

              <button
                onClick={handleToggleSubmission}
                disabled={toggleLoading}
                className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all transform active:scale-95 whitespace-nowrap cursor-pointer ${
                  submissionOpen
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/30'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-900/30'
                }`}
              >
                {toggleLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : submissionOpen ? (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>คลิกเพื่อ ปิดระบบกรอกข้อมูล</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5" />
                    <span>คลิกเพื่อ เปิดระบบรับข้อมูล</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Active College Editing Mode for Super Admin */}
          {editingCollege && (
            <div id="college-edit-form" className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#932d16] text-white flex items-center justify-center font-bold text-xl shadow">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#932d16] uppercase tracking-wider">
                      โหมดแก้ไขข้อมูลโดยผู้ดูแลระบบ สอจ. (Super Admin Override)
                    </span>
                    <h2 className="text-xl font-black text-slate-900">
                      กำลังแก้ไขข้อมูล: {editingCollege.name} ({editingCollege.code})
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setEditingCollege(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-xs cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ยกเลิก / ปิดโหมดแก้ไข</span>
                </button>
              </div>

              {loadingCollegeStat ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#932d16] mx-auto mb-2" />
                  <p className="text-sm font-bold">กำลังดึงข้อมูลสถิติของ {editingCollege.name}...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitStat} className="space-y-6">
                  {/* Fieldset 1: ผู้บริหาร ครู และบุคลากร */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#932d16]" />
                      <span>1. จำนวนผู้บริหาร ครู และบุคลากรทางการศึกษา</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ผู้บริหารสถานศึกษา (คน)</label>
                        <input
                          type="number"
                          value={formData.totalExecutives}
                          onChange={(e) => handleInputChange('totalExecutives', Number(e.target.value))}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ครูผู้สอน (คน)</label>
                        <input
                          type="number"
                          value={formData.totalTeachers}
                          onChange={(e) => handleInputChange('totalTeachers', Number(e.target.value))}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">บุคลากรทางการศึกษา (คน)</label>
                        <input
                          type="number"
                          value={formData.totalStaff}
                          onChange={(e) => handleInputChange('totalStaff', Number(e.target.value))}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fieldset 2: นักเรียน/นักศึกษา ชาย-หญิง และระดับชั้น */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#932d16]" />
                      <span>2. จำนวนนักเรียน / นักศึกษา จำแนกเพศ และชั้นปี</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">นักเรียนชาย (คน)</label>
                        <input
                          type="number"
                          value={formData.maleStudents}
                          onChange={(e) => handleInputChange('maleStudents', Number(e.target.value))}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">นักเรียนหญิง (คน)</label>
                        <input
                          type="number"
                          value={formData.femaleStudents}
                          onChange={(e) => handleInputChange('femaleStudents', Number(e.target.value))}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">รวมทั้งหมด (คำนวณอัตโนมัติ)</label>
                        <div className="w-full px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-black text-[#932d16]">
                          {(formData.maleStudents + formData.femaleStudents).toLocaleString()} คน
                        </div>
                      </div>
                    </div>

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

                  {/* Fieldset 3: ผู้สำเร็จการศึกษาและการมีงานทำ */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#932d16]" />
                      <span>3. ผู้สำเร็จการศึกษา และภาวะการมีงานทำ</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ปวช. สำเร็จการศึกษา (คน)</label>
                        <input
                          type="number"
                          value={formData.gradVocCertCount}
                          onChange={(e) => handleInputChange('gradVocCertCount', Number(e.target.value))}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ปวส. สำเร็จการศึกษา (คน)</label>
                        <input
                          type="number"
                          value={formData.gradHighVocCertCount}
                          onChange={(e) => handleInputChange('gradHighVocCertCount', Number(e.target.value))}
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                      {[
                        { key: 'employedInField', label: 'ทำงานตรงสาขา' },
                        { key: 'employedOutField', label: 'ทำงานไม่ตรงสาขา' },
                        { key: 'employedFreelance', label: 'อาชีพอิสระ' },
                        { key: 'furtherStudyCount', label: 'ศึกษาต่อ' },
                        { key: 'unemployedCount', label: 'ว่างงาน' },
                      ].map((emp) => (
                        <div key={emp.key} className="space-y-1">
                          <label className="text-[11px] font-medium text-slate-600">{emp.label}</label>
                          <input
                            type="number"
                            value={(formData as any)[emp.key]}
                            onChange={(e) => handleInputChange(emp.key, Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Super Admin Save Button */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingCollege(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={savingStat}
                      className="inline-flex items-center gap-2 bg-[#932d16] hover:bg-[#7a2512] text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 cursor-pointer transition-all"
                    >
                      {savingStat ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>บันทึกข้อมูลของ {editingCollege.name}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Section 3: Monitor 29 Colleges Submission Status with "Edit Data" Action */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#932d16]" />
                  <span>ติดตามและแก้ไขข้อมูลสถิติ (29 สถานศึกษา)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ท่านสามารถคลิกปุ่ม <strong className="text-[#932d16]">"✏️ แก้ไขข้อมูล"</strong> ในแถวของวิทยาลัยใดๆ เพื่อเข้าปรับปรุงสถิติแทนโรงเรียนได้ทันที
                </p>
              </div>

              {/* Quick Summary Pill */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  รายงานแล้ว: {submittedCount} แห่ง
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  รอรายงาน: {29 - submittedCount} แห่ง
                </span>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อวิทยาลัย หรือรหัสสถานศึกษา..."
                  value={statusSearch}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#932d16]/30"
                />
              </div>
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
                {(['ALL', 'PUBLIC', 'PRIVATE'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setStatusFilter(t)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      statusFilter === t
                        ? 'bg-white text-[#932d16] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t === 'ALL' ? 'ทั้งหมด' : t === 'PUBLIC' ? 'ภาครัฐ' : 'ภาคเอกชน'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table of Colleges with Edit Button */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">รหัส</th>
                    <th className="py-3 px-4">สถานศึกษา</th>
                    <th className="py-3 px-4">สังกัด</th>
                    <th className="py-3 px-4 text-center">สาขา</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-right">นักศึกษา</th>
                    <th className="py-3 px-4 text-right">ผบ./ครู/บุคลากร</th>
                    <th className="py-3 px-4 text-center">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingStatuses ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        กำลังโหลดข้อมูลสถานะ...
                      </td>
                    </tr>
                  ) : filteredStatuses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        ไม่พบข้อมูลตามคำค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredStatuses.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-500">
                          {s.code}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {s.name}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              s.type === 'PUBLIC'
                                ? 'bg-[#932d16]/10 text-[#932d16]'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {s.type === 'PUBLIC' ? 'รัฐบาล' : 'เอกชน'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-700">
                          {s.programsCount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {s.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ส่งแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              รอส่ง
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {s.totalStudents.toLocaleString()} คน
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {s.totalExecutives} / {s.totalTeachers} / {s.totalStaff}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleStartEditCollege(s)}
                            className="inline-flex items-center gap-1 bg-[#932d16] hover:bg-[#7a2512] text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
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

          {/* Section 4: Add News Announcement with Image Upload / Preview */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#932d16]" />
                <span>เผยแพร่ข่าวประชาสัมพันธ์ (พร้อมระบบอัปโหลดรูปภาพประกอบข่าว)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ข่าวที่เผยแพร่พร้อมรูปภาพ จะแสดงบน Hero Carousel หน้าแรกของระบบ UDVECSmart ทันที
              </p>
            </div>

            <form onSubmit={handleCreateNews} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    หัวข้อข่าวประชาสัมพันธ์ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ประกาศเปิดรับการรายงานข้อมูลสถิติ..."
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">หมวดหมู่</label>
                  <select
                    value={newsCategory}
                    onChange={(e: any) => setNewsCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none"
                  >
                    <option value="ANNOUNCEMENT">ข่าวประชาสัมพันธ์ทั่วไป</option>
                    <option value="ACTIVITY">ข่าวกิจกรรม / ผลงาน</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload Area */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#932d16]" />
                  <span>ภาพประกอบข่าว (Cover Image)</span>
                </label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleNewsImageUpload}
                    className="hidden"
                    id="news-image-upload"
                  />
                  <label
                    htmlFor="news-image-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
                  >
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span>เลือกรูปภาพจากเครื่อง</span>
                  </label>

                  <span className="text-xs text-slate-400">หรือ</span>

                  <input
                    type="text"
                    placeholder="วาง URL ของรูปภาพ (เช่น https://...)"
                    value={newsCoverImage || ''}
                    onChange={(e) => setNewsCoverImage(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#932d16]/30"
                  />
                </div>

                {/* Image Preview Box */}
                {newsCoverImage && (
                  <div className="relative mt-3 inline-block">
                    <div className="w-48 h-28 rounded-xl overflow-hidden border-2 border-[#932d16]/30 shadow-md">
                      <img
                        src={newsCoverImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewsCoverImage(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700 cursor-pointer"
                      title="ลบรูปภาพ"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  เนื้อหาข่าว <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="รายละเอียดข่าวสารประชาสัมพันธ์..."
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingNews}
                className="inline-flex items-center gap-2 bg-[#932d16] hover:bg-[#7a2512] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {creatingNews ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>เผยแพร่ข่าวสาร</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SCHOOL ADMIN VIEW: DATA ENTRY FORM FOR OWN COLLEGE */}
      {/* ============================================================== */}
      {!isSuperAdmin && (
        <div className="space-y-8">
          {/* Submission Window Alert Banner */}
          {schoolOpenStatus ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-900 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">ระบบเปิดรับข้อมูลสถิติ</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  ท่านสามารถบันทึกและปรับปรุงข้อมูลสถิติผู้บริหาร นักศึกษา ครู บุคลากร และภาวะการมีงานทำของ{' '}
                  <strong>{schoolInstitution?.name}</strong> ได้ตามปกติ
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 flex items-start gap-3.5 text-rose-950 shadow-sm">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm text-rose-900">
                  ขณะนี้ระบบปิดรับการรายงานข้อมูลสถิติ
                </h4>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  ผู้ดูแลระบบ สอจ.อุดรธานี ได้ทำการปิดระบบรับรายงานข้อมูลแล้ว ท่านสามารถดูข้อมูลเดิมได้
                  แต่ไม่สามารถแก้ไขหรือบันทึกได้ หากต้องการส่งข้อมูลเพิ่มเติม กรุณาประสานงานผู้ดูแลระบบ สอจ. เพื่อขอเปิดระบบ
                </p>
              </div>
            </div>
          )}

          {/* Data Entry Form */}
          {loadingSchoolStat ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200 shadow-sm">
              <RefreshCw className="w-8 h-8 animate-spin text-[#932d16] mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">กำลังโหลดข้อมูลสถิติของสถานศึกษา...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitStat} className="space-y-8">
              {/* Fieldset 1: ผู้บริหาร ครู และบุคลากรทางการศึกษา */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#932d16]" />
                    <span>1. ผู้บริหาร ครู และบุคลากรทางการศึกษา</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    กรอกจำนวนผู้บริหาร (ผอ., รอง ผอ.), จำนวนครูผู้สอน, และบุคลากรสนับสนุน
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      จำนวนผู้บริหารสถานศึกษา (คน) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      disabled={!schoolOpenStatus}
                      value={formData.totalExecutives}
                      onChange={(e) => handleInputChange('totalExecutives', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">จำนวนครูผู้สอน (คน)</label>
                    <input
                      type="number"
                      disabled={!schoolOpenStatus}
                      value={formData.totalTeachers}
                      onChange={(e) => handleInputChange('totalTeachers', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">จำนวนบุคลากรทางการศึกษา (คน)</label>
                    <input
                      type="number"
                      disabled={!schoolOpenStatus}
                      value={formData.totalStaff}
                      onChange={(e) => handleInputChange('totalStaff', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Fieldset 2: นักเรียน/นักศึกษา จำแนกเพศ และชั้นปี */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#932d16]" />
                    <span>2. จำนวนนักเรียน / นักศึกษา จำแนกเพศ และชั้นปี</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    กรอกยอดจำนวนนักเรียนที่กำลังศึกษาอยู่ในภาคเรียนที่ 1 ปีการศึกษา 2568
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">นักเรียนชาย (คน)</label>
                    <input
                      type="number"
                      disabled={!schoolOpenStatus}
                      value={formData.maleStudents}
                      onChange={(e) => handleInputChange('maleStudents', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">นักเรียนหญิง (คน)</label>
                    <input
                      type="number"
                      disabled={!schoolOpenStatus}
                      value={formData.femaleStudents}
                      onChange={(e) => handleInputChange('femaleStudents', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-slate-500">รวมทั้งหมด (คำนวณอัตโนมัติ)</label>
                    <div className="w-full px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-black text-[#932d16]">
                      {(formData.maleStudents + formData.femaleStudents).toLocaleString()} คน
                    </div>
                  </div>
                </div>

                {/* Grade levels */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    จำแนกตามระดับชั้นปี
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
                          disabled={!schoolOpenStatus}
                          value={(formData as any)[g.key]}
                          onChange={(e) => handleInputChange(g.key, Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fieldset 3: ผู้สำเร็จการศึกษาและภาวะการมีงานทำ */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#932d16]" />
                    <span>3. ข้อมูลผู้สำเร็จการศึกษา และภาวะการมีงานทำ</span>
                  </h3>
                </div>

                {/* Graduates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ปวช. สำเร็จการศึกษา (คน)</label>
                    <input
                      type="number"
                      disabled={!schoolOpenStatus}
                      value={formData.gradVocCertCount}
                      onChange={(e) => handleInputChange('gradVocCertCount', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">ปวส. สำเร็จการศึกษา (คน)</label>
                    <input
                      type="number"
                      disabled={!schoolOpenStatus}
                      value={formData.gradHighVocCertCount}
                      onChange={(e) => handleInputChange('gradHighVocCertCount', Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                {/* Employment Breakdown */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    จำแนกตามประเภทการมีงานทำ
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { key: 'employedInField', label: 'ทำงานตรงสาขาวิชาชีพ' },
                      { key: 'employedOutField', label: 'ทำงานไม่ตรงสาขาวิชาชีพ' },
                      { key: 'employedFreelance', label: 'ประกอบอาชีพอิสระ' },
                      { key: 'furtherStudyCount', label: 'ศึกษาต่อ' },
                      { key: 'unemployedCount', label: 'ว่างงาน / ยังไม่มีงานทำ' },
                    ].map((emp) => (
                      <div key={emp.key} className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600">{emp.label}</label>
                        <input
                          type="number"
                          disabled={!schoolOpenStatus}
                          value={(formData as any)[emp.key]}
                          onChange={(e) => handleInputChange(emp.key, Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workplace Breakdown */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    จำแนกตามประเภทหน่วยงานที่ทำงาน
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { key: 'workGov', label: 'หน่วยงานของรัฐ / รัฐวิสาหกิจ' },
                      { key: 'workPrivate', label: 'บริษัท / หน่วยงานเอกชน' },
                      { key: 'workSelf', label: 'ประกอบธุรกิจส่วนตัว' },
                    ].map((w) => (
                      <div key={w.key} className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600">{w.label}</label>
                        <input
                          type="number"
                          disabled={!schoolOpenStatus}
                          value={(formData as any)[w.key]}
                          onChange={(e) => handleInputChange(w.key, Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#932d16]/30 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!schoolOpenStatus || savingStat}
                  className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer ${
                    schoolOpenStatus
                      ? 'bg-[#932d16] hover:bg-[#7a2512] text-white shadow-[#932d16]/30'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {savingStat ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>บันทึกข้อมูลสถิติของวิทยาลัย</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
