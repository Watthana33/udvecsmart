import React from 'react';
import { SiteSettings } from '../../types';
import { Sparkles, ArrowRight } from 'lucide-react';

interface BannerSectionProps {
  settings: SiteSettings | null;
}

export const BannerSection: React.FC<BannerSectionProps> = ({ settings }) => {
  const currentYear = settings?.current_academic_year || 2567;
  const currentSem = settings?.current_semester || 1;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-16 sm:py-24">
      {/* Background Glow Accents */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>ปีการศึกษา {currentYear} ภาคเรียนที่ {currentSem}</span>
              {settings?.is_data_submission_open && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="ระบบเปิดรับข้อมูล" />
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              ศูนย์รวมข้อมูลและสถิติ <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                อาชีวศึกษาจังหวัดอุดรธานี
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              แพลตฟอร์มสารสนเทศอัจฉริยะ ติดตามสถิตินักเรียนนักศึกษา บุคลากรครู 
              และภาวะการมีงานทำของสถานศึกษาภาครัฐและเอกชนในสังกัด สอจ.อุดรธานี
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#stats"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all duration-200"
              >
                <span>สำรวจสถิติภาพรวม</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#institutions"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-5 py-3 rounded-xl backdrop-blur-sm border border-white/10 transition-all duration-200"
              >
                <span>ทำเนียบสถานศึกษา</span>
              </a>
            </div>
          </div>

          {/* Right Banner Image & Feature Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800/80 backdrop-blur">
              <img 
                src="/banner.png" 
                alt="UDPVEC Banner" 
                className="w-full h-auto object-cover transform hover:scale-102 transition-transform duration-500"
                onError={(e) => {
                  // If banner not present, hide image
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
