import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Award, Eye, ExternalLink } from 'lucide-react';
import { getVisitorCount, incrementVisitorCount } from '../../services/api';
import { SiteContact, DEFAULT_CONTACT } from '../../utils/siteContact';

// นับผู้เข้าชมเมื่อเปิดเว็บ แต่ไม่เกิน 1 ครั้งต่อ 30 นาทีต่อเบราว์เซอร์ (เซิร์ฟเวอร์กันซ้ำอีกชั้น)
const VISIT_COUNTED_KEY = 'udpvecsmart_visit_counted_at';
const VISIT_WINDOW_MS = 30 * 60 * 1000;

function shouldCountVisit(): boolean {
  try {
    const at = Number(localStorage.getItem(VISIT_COUNTED_KEY));
    return !at || Date.now() - at > VISIT_WINDOW_MS;
  } catch {
    return true;
  }
}

interface FooterProps {
  contact?: SiteContact;
}

export const Footer: React.FC<FooterProps> = ({ contact = DEFAULT_CONTACT }) => {
  // สถิติการเข้าชมเว็บไซต์: ยอดจริงจากฐานข้อมูลของเซิร์ฟเวอร์เท่านั้น (ดึงไม่ได้ = ซ่อนตัวเลข ไม่แสดงเลขสมมติ)
  const [visitCount, setVisitCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = shouldCountVisit() ? incrementVisitorCount() : getVisitorCount();
    load
      .then((count) => {
        if (cancelled || typeof count !== 'number') return;
        setVisitCount(count);
        try {
          if (shouldCountVisit()) localStorage.setItem(VISIT_COUNTED_KEY, String(Date.now()));
        } catch {
          /* ใช้ localStorage ไม่ได้ก็ข้าม */
        }
      })
      .catch((err) => console.warn('Visitor counter unavailable:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="bg-hx-742210 text-amber-100/80 text-sm border-t-4 border-hx-932d16 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Col 1: System Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                UDVEC<span className="text-amber-400">Smart</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-100/70 leading-relaxed mb-4 font-normal">
              ระบบศูนย์กลางฐานข้อมูลและสถิติสารสนเทศ สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี)
              บูรณาการข้อมูลสถานศึกษาทุกแห่งในจังหวัดอุดรธานี เพื่อสนับสนุนการบริหารจัดการ
              และการผลิตกำลังคนอาชีวศึกษาให้สอดคล้องกับความต้องการของประเทศ
            </p>
          </div>

          {/* ========================================================================= */}
          {/* Col 2: Affiliated Info (จุดปรับคำและลิงก์: "หน่วยงานกำกับดูแล")             */}
          {/* สามารถเปลี่ยนคำว่า "หน่วยงานกำกับดูแล" หรือแก้ไข/เพิ่มลิงก์หน่วยงานได้ที่นี่  */}
          {/* ========================================================================= */}
          <div>
            <h4 className="text-white font-black text-base sm:text-lg mb-4 flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-400" />
              <span>หน่วยงานที่เกี่ยวข้อง</span>
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li>
                <a 
                  href="https://www.vec.go.th" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)
                </a>
              </li>
              <li>
                <a 
                  href="https://www.moe.go.th" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  กระทรวงศึกษาธิการ
                </a>
              </li>
              <li>
                <a 
                  href="https://reo10.moe.go.th/" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  สำนักงานศึกษาธิการภาค 10
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 className="text-white font-black text-base sm:text-lg mb-4 flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-amber-400" />
              <span>ที่ตั้งสำนักงาน</span>
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span>สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี)<br />{contact.address}</span>
              </li>
              {contact.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{contact.phone}</span>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{contact.email}</span>
                </li>
              )}
              {contact.facebook && (
                <li className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-amber-300 shrink-0" />
                  <a href={contact.facebook} target="_blank" rel="noreferrer" className="hover:text-white hover:underline">
                    เฟซบุ๊กแฟนเพจ
                  </a>
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Website Visit Statistics */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-amber-200/70 gap-3">
          <p>© 2026 สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี). All rights reserved.</p>
          
          {/* สถิติการเข้าถึงเว็บไซต์ */}
          {visitCount !== null && (
            <div className="flex items-center gap-2 bg-black/25 px-4 py-1.5 rounded-full border border-amber-500/20 text-xs text-amber-200/90 shadow-sm">
              <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>สถิติการเข้าชมเว็บไซต์: <strong className="text-white font-black text-sm tracking-wide">{visitCount.toLocaleString()}</strong> ครั้ง</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
