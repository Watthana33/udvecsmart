import React from 'react';
import { MapPin, Phone, Mail, Shield, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#742210] text-amber-100/80 text-sm border-t-4 border-[#932d16] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Col 1: System Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-black text-white tracking-tight">
                UDVEC<span className="text-amber-400">Smart</span>
              </span>
            </div>
            <p className="text-xs text-amber-100/70 leading-relaxed mb-4">
              ระบบศูนย์กลางฐานข้อมูลและสถิติสารสนเทศ สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี)
              บูรณาการข้อมูลสถานศึกษาทั้ง 29 แห่งในจังหวัดอุดรธานี เพื่อสนับสนุนการบริหารจัดการ
              และการผลิตกำลังคนอาชีวศึกษาให้สอดคล้องกับความต้องการของประเทศ
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>ความปลอดภัยมาตรฐาน 3-Tier Architecture & Docker Container</span>
            </div>
          </div>

          {/* Col 2: Affiliated Info */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3.5 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>หน่วยงานกำกับดูแล</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
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
                  href="https://www.udonthani.go.th" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  จังหวัดอุดรธานี
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3.5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>ที่ตั้งสำนักงาน</span>
            </h4>
            <ul className="space-y-2.5 text-xs leading-relaxed">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี)<br />115 ถนนทหาร ตำบลหมากแข้ง อำเภอเมืองอุดรธานี จังหวัดอุดรธานี 41000</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-300 shrink-0" />
                <span>042-221538</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                <span>admin@udpvec.go.th</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-amber-200/60">
          <p>© 2026 สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี). All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px] text-amber-200/80">
            ระบบสารสนเทศ UDVECSmart v2.0 (PostgreSQL + Express + React + Docker)
          </p>
        </div>
      </div>
    </footer>
  );
};
