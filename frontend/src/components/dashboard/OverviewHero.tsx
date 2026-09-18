import React, { useState, useEffect } from 'react';
import { NewsItem } from '../../types';
import { School, Newspaper, Calendar, Eye, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface OverviewHeroProps {
  newsList: NewsItem[];
  loadingNews?: boolean;
  loading?: boolean;
}

export const OverviewHero: React.FC<OverviewHeroProps> = ({ newsList, loadingNews, loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLoading = loadingNews ?? loading ?? false;

  // Auto-advance news every 6s
  useEffect(() => {
    if (newsList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsList.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [newsList.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + newsList.length) % newsList.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % newsList.length);
  };

  const currentNews = newsList.length > 0 ? newsList[currentIndex] : null;

  return (
    <div className="pt-4 sm:pt-5 pb-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column (6 Cols): Headline & Description */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#932d16] bg-[#932d16]/10 px-3 py-1 rounded-full">
                <School className="w-3.5 h-3.5" />
                <span>ศูนย์กลางข้อมูลสารสนเทศ</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                ศูนย์รวมข้อมูลและสถิติ <br />
                <span className="text-[#932d16]">อาชีวศึกษาจังหวัดอุดรธานี</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                แพลตฟอร์มสารสนเทศอัจฉริยะ ติดตามสถิตินักเรียนนักศึกษา บุคลากรครู 
                และภาวะการมีงานทำของสถานศึกษาภาครัฐและเอกชนในสังกัด สอจ.อุดรธานี (ครบทั้ง 29 แห่ง)
              </p>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px]">สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี)</span>
              <span className="text-[11px] font-semibold text-[#932d16]">UDVECSmart Platform</span>
            </div>
          </div>

          {/* Right Column (6 Cols): News Carousel with Prominent Headline */}
          <div className="lg:col-span-6 flex">
            {isLoading ? (
              <div className="w-full h-full min-h-[220px] bg-slate-200/70 rounded-2xl animate-pulse" />
            ) : currentNews ? (
              <div className="w-full bg-gradient-to-br from-[#932d16] via-[#7d2511] to-[#591708] rounded-2xl p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden border border-[#932d16]/40">
                {/* Background ambient lighting */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top: News Badge & Controls */}
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full shadow-sm">
                      <Newspaper className="w-3 h-3" />
                      <span>ข่าวประชาสัมพันธ์ ({currentIndex + 1}/{newsList.length})</span>
                    </span>
                    <span className="text-[11px] text-amber-200/80 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(currentNews.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrev}
                      className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
                      title="ข่าวก่อนหน้า"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
                      title="ข่าวถัดไป"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Middle: Prominent News Headline (แยกเป็นลักษณะหัวข้อข่าวตามที่ขอ) */}
                <div className="relative z-10 my-auto py-3">
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-snug drop-shadow-sm hover:text-amber-200 transition-colors line-clamp-2">
                    {currentNews.title}
                  </h3>
                </div>

                {/* Bottom: Meta Info & Dots */}
                <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/15 text-xs text-amber-200/75">
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>เข้าชม {currentNews.viewCount} ครั้ง</span>
                    </span>
                    {currentNews.author && (
                      <span className="flex items-center gap-1 truncate max-w-[140px]">
                        <User className="w-3 h-3" />
                        <span>{currentNews.author.fullName}</span>
                      </span>
                    )}
                  </div>

                  {/* Dot Indicators */}
                  <div className="flex items-center gap-1.5">
                    {newsList.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          currentIndex === i ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/30 hover:bg-white/60'
                        }`}
                        title={`ไปยังข่าวที่ ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full bg-slate-100 rounded-2xl p-6 flex items-center justify-center text-slate-400 text-xs">
                ไม่มีข่าวประชาสัมพันธ์ในขณะนี้
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
