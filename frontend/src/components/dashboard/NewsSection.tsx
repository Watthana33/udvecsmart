import React, { useState, useEffect } from 'react';
import { NewsItem } from '../../types';
import { Newspaper, Eye, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface NewsSectionProps {
  newsList: NewsItem[];
  loading: boolean;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ newsList, loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide every 6 seconds if multiple news
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

  if (loading) {
    return (
      <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-44 bg-slate-200/80 rounded-2xl animate-pulse" />
      </section>
    );
  }

  if (newsList.length === 0) return null;

  const currentNews = newsList[currentIndex];

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div className="relative bg-[#742210] rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden min-h-[220px] flex flex-col justify-between">
        
        {/* Dynamic Background: Photo with Dark Gradient Overlay if available, else standard gradient */}
        {currentNews.coverImageUrl ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
              style={{ backgroundImage: `url(${currentNews.coverImageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-[#742210]/60 backdrop-blur-[2px]" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-[#932d16] via-[#742210] to-[#932d16]" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          </>
        )}

        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          
          {/* Content Area */}
          <div className="space-y-3 max-w-2xl flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-0.5 rounded-full shadow-sm">
                <Newspaper className="w-3 h-3" />
                <span>ข่าวประชาสัมพันธ์ ({currentIndex + 1}/{newsList.length})</span>
              </span>
              <span className="text-xs text-amber-200/90 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(currentNews.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </span>
            </div>

            <h3 className="text-lg sm:text-2xl font-extrabold text-white leading-snug drop-shadow">
              {currentNews.title}
            </h3>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-2">
              {currentNews.content}
            </p>

            <div className="flex items-center gap-4 text-xs text-amber-200/80 pt-1">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>ยอดเข้าชม {currentNews.viewCount} ครั้ง</span>
              </span>
              {currentNews.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>{currentNews.author.fullName}</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Featured 16:9 Image Preview Box (if image exists) + Slide Controls */}
          <div className="flex items-center gap-5 shrink-0 self-end md:self-center">
            {currentNews.coverImageUrl && (
              <div className="hidden sm:block w-44 sm:w-56 md:w-64 aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-900 group">
                <img
                  src={currentNews.coverImageUrl}
                  alt={currentNews.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}

            {/* Controls: Prev/Next & Dots */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  aria-label="Previous News"
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 flex items-center justify-center text-white transition-all active:scale-95 shadow cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next News"
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 flex items-center justify-center text-white transition-all active:scale-95 shadow cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {newsList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentIndex === i ? 'w-6 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};
