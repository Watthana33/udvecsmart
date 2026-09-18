import React, { useState } from 'react';
import { submitContact } from '../../services/api';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await submitContact(formData);
      setSuccessMsg(res.message);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[#932d16] text-xs font-bold uppercase tracking-wider">
          <Mail className="w-4 h-4" />
          <span>Get in Touch</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          ติดต่อเรา - สำนักงานอาชีวศึกษาจังหวัดอุดรธานี
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          มีข้อซักถาม ข้อเสนอแนะ หรือต้องการประสานงานข้อมูล สามารถส่งข้อความผ่านแบบฟอร์มด้านล่างได้ตลอด 24 ชั่วโมง
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Office Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-[#932d16] to-[#742210] rounded-3xl p-8 text-white shadow-xl space-y-6">
            <div>
              <span className="inline-block bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                สอจ.อุดรธานี
              </span>
              <h3 className="text-xl font-bold">ข้อมูลการติดต่อราชการ</h3>
              <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">
                สำนักงานอาชีวศึกษาจังหวัดอุดรธานี ยินดีให้บริการและประสานความร่วมมือเพื่อการพัฒนาอาชีวศึกษา
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">สถานที่ตั้ง:</span>
                  <span className="text-amber-100/90 leading-relaxed">
                    115 ถนนทหาร ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <Phone className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <span className="font-bold text-white block mb-0.5">โทรศัพท์:</span>
                  <span className="text-amber-100/90 font-mono">042-221538</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <Mail className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <span className="font-bold text-white block mb-0.5">อีเมลทางการ:</span>
                  <span className="text-amber-100/90 font-mono">admin@udpvec.go.th</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <Clock className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <span className="font-bold text-white block mb-0.5">เวลาทำการ:</span>
                  <span className="text-amber-100/90">จันทร์ - ศุกร์: 08:30 น. - 16:30 น.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Contact Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">ส่งข้อความติดต่อเจ้าหน้าที่</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              กรอกข้อมูลด้านล่าง ข้อความจะถูกส่งตรงเข้าสู่ระบบของ สอจ.อุดรธานี
            </p>
          </div>

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs text-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  อีเมล (Email) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="tel"
                  placeholder="08x-xxx-xxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เรื่องที่ติดต่อ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ขอสอบถามข้อมูลสถิติ, ประสานงานทั่วไป"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ข้อความรายละเอียด <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="ระบุข้อความหรือคำถามที่ต้องการติดต่อเจ้าหน้าที่..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#932d16]/20 focus:border-[#932d16] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-[#932d16] hover:bg-[#742210] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'กำลังส่งข้อมูล...' : 'ส่งข้อความติดต่อ'}</span>
            </button>

          </form>
        </div>

      </div>

    </section>
  );
};
