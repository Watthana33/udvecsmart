import React from 'react';
import { MapPin, Phone, Mail, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Col 1: System Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold text-white tracking-tight">UDPVEC<span className="text-blue-500">Smart</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              ระบบศูนย์กลางฐานข้อมูลและสถิติสารสนเทศ สำนักงานอาชีวศึกษาจังหวัดอุดรธานี
              เพื่อสนับสนุนการบริหารจัดการและการผลิตกำลังคนอาชีวศึกษาให้สอดคล้องกับความต้องการของประเทศ
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>ความปลอดภัยมาตรฐาน 3-Tier Architecture & Docker</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">หน่วยงานที่เกี่ยวข้อง</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="https://www.vec.go.th" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)
                </a>
              </li>
              <li>
                <a href="https://www.moe.go.th" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  กระทรวงศึกษาธิการ
                </a>
              </li>
              <li>
                <a href="#institutions" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  ทำเนียบสถานศึกษาอาชีวศึกษาอุดรธานี
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">ติดต่อหน่วยงาน</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี) อ.เมือง จ.อุดรธานี 41000</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span>042-221538</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span>info@udpvec.go.th</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© 2026 สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี). All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px]">Powered by Node.js, Prisma, PostgreSQL & Docker</p>
        </div>
      </div>
    </footer>
  );
};
