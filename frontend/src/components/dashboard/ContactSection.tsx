import React from 'react';
import { Mail, Phone, MapPin, Clock, Navigation, ExternalLink } from 'lucide-react';
import { SiteContact, DEFAULT_CONTACT } from '../../utils/siteContact';

// พิกัดสำนักงานอาชีวศึกษาจังหวัดอุดรธานี (แผนที่ Google ฝังแบบไม่ต้องใช้ API key)
const OFFICE_LAT = 17.416168675270193;
const OFFICE_LNG = 102.7887943115309;
const MAP_EMBED_URL = `https://www.google.com/maps?q=${OFFICE_LAT},${OFFICE_LNG}&z=17&hl=th&output=embed`;
const MAP_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${OFFICE_LAT},${OFFICE_LNG}`;
const MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${OFFICE_LAT},${OFFICE_LNG}`;

interface ContactSectionProps {
  contact?: SiteContact;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ contact = DEFAULT_CONTACT }) => {
  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Header */}
      <div>
        {/* <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-hx-932d16 bg-hx-932d16/10 px-3.5 py-1 rounded-full mb-2">
          <Mail className="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div> */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          ติดต่อเรา - สำนักงานอาชีวศึกษาจังหวัดอุดรธานี
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          มีข้อซักถาม ข้อเสนอแนะ หรือต้องการประสานงานข้อมูล ติดต่อได้ตามช่องทางด้านล่าง หรือเดินทางมาที่สำนักงานตามแผนที่
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Office Information */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex-1 bg-gradient-to-br from-hx-932d16 to-hx-742210 rounded-3xl p-8 text-white shadow-xl space-y-6">
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
                    {contact.address}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <Phone className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <span className="font-bold text-white block mb-0.5">โทรศัพท์:</span>
                  <span className="text-amber-100/90 font-mono">{contact.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <Mail className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <span className="font-bold text-white block mb-0.5">อีเมลทางการ:</span>
                  <span className="text-amber-100/90 font-mono">{contact.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <Clock className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <span className="font-bold text-white block mb-0.5">เวลาทำการ:</span>
                  <span className="text-amber-100/90">{contact.hours}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: แผนที่ตั้งสำนักงาน */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">แผนที่ตั้งสำนักงาน</h3>
              <p className="text-xs text-slate-500 mt-0.5">สำนักงานอาชีวศึกษาจังหวัดอุดรธานี</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={MAP_DIRECTIONS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-hx-932d16 hover:bg-hx-7a2411 text-white rounded-xl text-xs font-bold shadow-sm transition-colors duration-150"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>นำทาง</span>
              </a>
              <a
                href={MAP_OPEN_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors duration-150"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดใน Google Maps</span>
              </a>
            </div>
          </div>

          <div className="flex-1 min-h-[320px] sm:min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <iframe
              src={MAP_EMBED_URL}
              title="แผนที่สำนักงานอาชีวศึกษาจังหวัดอุดรธานี"
              className="w-full h-full min-h-[320px] sm:min-h-[380px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

      </div>

    </section>
  );
};
