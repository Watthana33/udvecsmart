import React, { useState, useEffect } from 'react';
import { NewsItem } from '../../types';
import { School, Newspaper, Calendar, Eye, ChevronLeft, ChevronRight, ExternalLink, X, BookOpen } from 'lucide-react';
import { incrementNewsView } from '../../services/api';

interface OverviewHeroProps {
  newsList: NewsItem[];
  loadingNews?: boolean;
  loading?: boolean;
}

export const OverviewHero: React.FC<OverviewHeroProps> = ({ newsList, loadingNews, loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedSet, setViewedSet] = useState<Set<string>>(new Set());
  const [localViews, setLocalViews] = useState<Record<string, number>>({});
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
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

  // นับยอดวิวเมื่อคลิกดูข่าว (+1) ทั้งใน UI และส่งบันทึกลงฐานข้อมูลจริง
  const handleNewsClick = async (news: NewsItem) => {
    setLocalViews((prev) => ({
      ...prev,
      [news.id]: (prev[news.id] ?? news.viewCount ?? 1) + 1,
    }));
    try {
      await incrementNewsView(news.id);
    } catch (e) {
      console.warn('Failed to increment view count:', e);
    }
    setSelectedNews(news);
  };

  // Record view count (+1) on view
  const recordView = async (id: string) => {
    if (viewedSet.has(id)) return;
    setViewedSet((prev) => new Set(prev).add(id));
    try {
      await incrementNewsView(id);
      setLocalViews((prev) => ({
        ...prev,
        [id]: (prev[id] ?? (newsList.find((n) => n.id === id)?.viewCount ?? 0)) + 1,
      }));
    } catch (e) {
      console.warn('Failed to increment view count:', e);
    }
  };

  useEffect(() => {
    if (currentNews && !viewedSet.has(currentNews.id)) {
      recordView(currentNews.id);
    }
  }, [currentNews?.id]);

  const displayViews = currentNews
    ? localViews[currentNews.id] ?? currentNews.viewCount
    : 0;

  return (
    <div className="pt-4 sm:pt-5 pb-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column (6 Cols): Headline & Description */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#932d16] bg-[#932d16]/10 px-3.5 py-1 rounded-full">
                <School className="w-3.5 h-3.5" />
                <span>ศูนย์กลางข้อมูลสารสนเทศ</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                ศูนย์รวมข้อมูลและสถิติ <br />
                <span className="block mt-1 text-[#932d16]">อาชีวศึกษาจังหวัดอุดรธานี</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                แพลตฟอร์มสารสนเทศอัจฉริยะ ติดตามสถิตินักเรียนนักศึกษา บุคลากรครู 
                และภาวะการมีงานทำของสถานศึกษาภาครัฐและเอกชนในสังกัด สอจ.อุดรธานี
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] font-medium">สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.อุดรธานี)</span>
              <span className="text-[11px] font-bold text-[#932d16]">UDVECSmart Platform</span>
            </div>
          </div>

          {/* Right Column (6 Cols): Featured News Card (Hero Image Prominent - Thairath Style) */}
          <div className="lg:col-span-6 flex">
            {isLoading ? (
              <div className="w-full h-full min-h-[260px] bg-slate-200/70 rounded-3xl animate-pulse" />
            ) : currentNews ? (
              <div className="w-full bg-slate-950 rounded-3xl text-white shadow-md flex flex-col justify-between relative overflow-hidden border border-slate-200/80 min-h-[270px] sm:min-h-[290px] group">
                
                {/* Dynamic Hero Image: Crisp, vibrant, full visibility without dark left overlay */}
                {currentNews.coverImageUrl ? (
                  <>
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                      style={{ backgroundImage: `url(${currentNews.coverImageUrl})` }}
                    />
                    {/* Top subtle vignette for header control contrast */}
                    <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-950/70 via-slate-950/30 to-transparent pointer-events-none" />
                    {/* Bottom gradient vignette: Thairath style - keeps top 60% of image completely clear and bright */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 via-45% to-transparent to-75%" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#932d16] via-[#7d2511] to-[#451206]" />
                    <div className="absolute top-0 right-0 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                  </>
                )}

                {/* Top: News Category Badge & Floating Navigation Controls */}
                <div className="relative z-10 p-5 sm:p-6 pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-md">
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>ข่าวแนะนำ ({currentIndex + 1}/{newsList.length})</span>
                    </span>
                    <span className="text-[11px] text-white/95 font-medium bg-black/45 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5 shadow-xs">
                      <Calendar className="w-3 h-3 text-amber-300" />
                      <span>
                        {new Date(currentNews.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>

                  {/* Navigation Buttons with Glassmorphic styling */}
                  <div className="flex items-center gap-1 bg-black/45 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-sm">
                    <button
                      onClick={handlePrev}
                      className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
                      title="ข่าวก่อนหน้า"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer"
                      title="ข่าวถัดไป"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Middle: Open space showcasing the crisp photograph */}
                <div className="flex-1 min-h-[40px] pointer-events-none" />

                {/* Bottom Area: Headline, Teaser, View count & Action Link */}
                <div className="relative z-10 p-5 sm:p-6 pt-2 space-y-3">
                  <div 
                    className="space-y-1.5 cursor-pointer group/title"
                    onClick={() => handleNewsClick(currentNews)}
                    title="คลิกเพื่ออ่านรายละเอียดข่าวสาร"
                  >
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white leading-snug drop-shadow-md group-hover/title:text-amber-200 transition-colors line-clamp-2">
                      {currentNews.title}
                    </h3>
                    {currentNews.content && (
                      <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed drop-shadow max-w-2xl font-normal group-hover/title:text-white transition-colors">
                        {currentNews.content}
                      </p>
                    )}
                  </div>

                  {/* Bottom Bar: Views, Read More Button, & Carousel Dots */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/15 text-xs text-amber-200/85 gap-3">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-200 font-medium">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>เข้าชม {displayViews.toLocaleString()} ครั้ง</span>
                      </span>

                      <button
                        onClick={() => handleNewsClick(currentNews)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
                        title="คลิกเพื่ออ่านรายละเอียดข่าวสาร"
                      >
                        <span>อ่านต่อ / ดูข้อมูล</span>
                        <BookOpen className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Dot Indicators */}
                    <div className="flex items-center gap-1.5">
                      {newsList.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentIndex(i)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            currentIndex === i ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
                          }`}
                          title={`ไปยังข่าวที่ ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="w-full bg-slate-100 rounded-3xl p-6 flex items-center justify-center text-slate-400 text-xs">
                ไม่มีข่าวประชาสัมพันธ์ในขณะนี้
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal แสดงรายละเอียดข่าวสารแบบเต็มเมื่อคลิกดูข้อมูล */}
      {selectedNews && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedNews(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Image if available */}
            {selectedNews.coverImageUrl && (
              <div className="w-full h-56 sm:h-72 bg-slate-950 relative overflow-hidden shrink-0">
                <img 
                  src={selectedNews.coverImageUrl} 
                  alt={selectedNews.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setSelectedNews(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-3 py-1 bg-[#932d16]/10 text-[#932d16] font-bold rounded-full">
                  ข่าวประชาสัมพันธ์
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(selectedNews.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-200/60 ml-auto">
                  <Eye className="w-3.5 h-3.5" />
                  เข้าชม {(localViews[selectedNews.id] ?? selectedNews.viewCount ?? 1).toLocaleString()} ครั้ง
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {selectedNews.title}
              </h2>

              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">
                {selectedNews.content}
              </div>

              {selectedNews.linkUrl && (
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <a
                    href={selectedNews.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#932d16] hover:bg-[#7a2411] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                  >
                    <span>ไปยังลิงก์ต้นทาง / เอกสารแนบ</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
