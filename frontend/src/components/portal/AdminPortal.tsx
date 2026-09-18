import React, { useState, useEffect } from 'react';
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
  Building2,
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
} from 'lucide-react';

interface AdminPortalProps {
  user: UserProfile;
  onRefreshStats: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ user, onRefreshStats }) => {
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // ==========================================
  // SUPER ADMIN STATE
  // ==========================================
  const [submissionOpen, setSubmissionOpen] = useState<boolean>(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [submissionStatuses, setSubmissionStatuses] = useState<SubmissionStatusItem[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [statusSearch, setStatusSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  // News State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<'ANNOUNCEMENT' | 'ACTIVITY'>('ANNOUNCEMENT');
  const [creatingNews, setCreatingNews] = useState(false);

  // ==========================================
  // SCHOOL ADMIN STATE
  // ==========================================
  const [schoolOpenStatus, setSchoolOpenStatus] = useState<boolean>(true);
  const [schoolInstitution, setSchoolInstitution] = useState<any>(null);
  const [loadingSchoolStat, setLoadingSchoolStat] = useState(false);
  const [savingStat, setSavingStat] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

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
          setFormData({
            academicYear: res.data.academicYear || 2568,
            semester: res.data.semester || 1,
            maleStudents: res.data.maleStudents || 0,
            femaleStudents: res.data.femaleStudents || 0,
            vocCert1: res.data.vocCert1 || 0,
            vocCert2: res.data.vocCert2 || 0,
            vocCert3: res.data.vocCert3 || 0,
            highVocCert1: res.data.highVocCert1 || 0,
            highVocCert2: res.data.highVocCert2 || 0,
            bachelorCount: res.data.bachelorCount || 0,
            totalTeachers: res.data.totalTeachers || 0,
            totalStaff: res.data.totalStaff || 0,
            gradVocCertCount: res.data.gradVocCertCount || 0,
            gradHighVocCertCount: res.data.gradHighVocCertCount || 0,
            employedInField: res.data.employedInField || 0,
            employedOutField: res.data.employedOutField || 0,
            employedFreelance: res.data.employedFreelance || 0,
            furtherStudyCount: res.data.furtherStudyCount || 0,
            unemployedCount: res.data.unemployedCount || 0,
            workGov: res.data.workGov || 0,
            workPrivate: res.data.workPrivate || 0,
            workSelf: res.data.workSelf || 0,
          });
        }
      })
      .catch((err) => console.error('Failed to load school stat:', err))
      .finally(() => setLoadingSchoolStat(false));
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
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการปรับสถานะระบบ: ' + (err.response?.data?.message || err.message));
    } finally {
      setToggleLoading(false);
    }
  };

  // Super Admin: Publish News
  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      alert('กรุณากรอกหัวข้อและเนื้อหาข่าว');
      return;
    }

    setCreatingNews(true);
    try {
      await createNews({
        title: newsTitle,
        content: newsContent,
        category: newsCategory,
      });
      setNewsTitle('');
      setNewsContent('');
      alert('เผยแพร่ข่าวสารเข้าสู่สไลเดอร์หน้าแรกเรียบร้อยแล้ว');
      onRefreshStats();
    } catch (err: any) {
      alert('ไม่สามารถเผยแพร่ข่าวได้: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreatingNews(false);
    }
  };

  // School Admin: Handle Input Change
  const handleInputChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  };

  // School Admin: Submit Form
  const handleSubmitStat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStat(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      await submitSchoolStat(formData);
      setSaveSuccessMsg('บันทึกข้อมูลสถิติของสถานศึกษาเรียบร้อยแล้ว และอัปเดตสถิติส่วนกลางทันที');
      onRefreshStats();
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่';
      setSaveErrorMsg(msg);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Portal Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#932d16]/10 text-[#932d16] flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
            {isSuperAdmin ? <ShieldCheck className="w-8 h-8" /> : <School className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#932d16]/10 text-[#932d16]">
                {isSuperAdmin ? 'ส่วนกลาง สอจ.อุดรธานี' : 'ผู้ดูแลสถานศึกษา'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ปีการศึกษา 2568 / ภาคเรียนที่ 1
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {isSuperAdmin
                ? 'ศูนย์ควบคุมและบริหารจัดการ สอจ.อุดรธานี'
                : `ระบบรายงานสถิติ: ${schoolInstitution?.name || user.institution?.name || 'สถานศึกษา'}`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ผู้ปฏิบัติงาน: <strong>{user.fullName}</strong> ({user.email})
            </p>
          </div>
        </div>

        <button
          onClick={() => (isSuperAdmin ? loadSuperAdminData() : loadSchoolAdminData())}
          className="self-start md:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. SUPER ADMIN VIEW: TOGGLE WINDOW, MONITOR 29 COLLEGES, NEWS */}
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
                    : 'สถานศึกษาถูกล็อก ไม่สามารถแก้ไขหรือส่งข้อมูลได้'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
                  เมื่อเปิดระบบ แอดมินวิทยาลัยแต่ละแห่งจะสามารถเข้าสู่ระบบเพื่อบันทึกและอัปเดตสถิติประจำภาคเรียนได้
                  เมื่อท่านกดปิดระบบ วิทยาลัยจะไม่สามารถกดบันทึกหรือเปลี่ยนแปลงข้อมูลใดๆ ได้
                </p>
              </div>

              <button
                onClick={handleToggleSubmission}
                disabled={toggleLoading}
                className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all transform active:scale-95 whitespace-nowrap ${
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

          {/* Section 2: Monitor 29 Colleges Submission Status */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#932d16]" />
                  <span>ติดตามการรายงานข้อมูลสถิติ (29 สถานศึกษา)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ความคืบหน้าการส่งข้อมูล: รายงานแล้ว{' '}
                  <strong className="text-emerald-600 font-bold">{submittedCount}</strong> / 29 แห่ง
                </p>
              </div>

              {/* Quick Summary Pill */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ส่งแล้ว: {submittedCount} แห่ง
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  รอส่ง: {29 - submittedCount} แห่ง
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
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
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

            {/* Table of Colleges */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">รหัส</th>
                    <th className="py-3 px-4">สถานศึกษา</th>
                    <th className="py-3 px-4">สังกัด</th>
                    <th className="py-3 px-4 text-center">สาขาที่สอน</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                    <th className="py-3 px-4 text-right">จำนวนนักศึกษา</th>
                    <th className="py-3 px-4 text-right">ครู/บุคลากร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingStatuses ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        กำลังโหลดข้อมูลสถานะ...
                      </td>
                    </tr>
                  ) : filteredStatuses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
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
                          {s.programsCount} สาขา
                        </td>
                        <td className="py-3 px-4 text-center">
                          {s.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ส่งข้อมูลแล้ว
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              รอรายงาน
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {s.totalStudents.toLocaleString()} คน
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {s.totalTeachers} / {s.totalStaff}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Add News Announcement */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#932d16]" />
                <span>เผยแพร่ข่าวประชาสัมพันธ์ (แสดงในสไลเดอร์หน้าแรก)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ข่าวที่เผยแพร่จะแสดงบน Hero Carousel หน้าแรกของระบบ UDVECSmart โดยอัตโนมัติ
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
                className="inline-flex items-center gap-2 bg-[#932d16] hover:bg-[#7a2512] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
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
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">ระบบเปิดรับข้อมูลสถิติ</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  ท่านสามารถบันทึกและปรับปรุงข้อมูลสถิตินักศึกษา ครู บุคลากร และภาวะการมีงานทำของ{' '}
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

          {/* Feedback Messages */}
          {saveSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {saveErrorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{saveErrorMsg}</span>
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
            {/* Fieldset 1: นักเรียน/นักศึกษา จำแนกเพศ และชั้นปี */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#932d16]" />
                  <span>1. จำนวนนักเรียน / นักศึกษา จำแนกเพศ และชั้นปี</span>
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

            {/* Fieldset 2: ครูและบุคลากร */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#932d16]" />
                  <span>2. ครูและบุคลากรทางการศึกษา</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 ${
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
