import React from 'react';
import { NewsItem } from '../../types';
import { Newspaper, Eye, Calendar, User } from 'lucide-react';

interface NewsSectionProps {
  newsList: NewsItem[];
  loading: boolean;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ newsList, loading }) => {
  return (
    <section id="news" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200">
      
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
          <Newspaper className="w-4 h-4" />
          <span>Announcements & Activities</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          ข่าวประชาสัมพันธ์และกิจกรรม
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          ติดตามข่าวสารล่าสุดจากสำนักงานอาชีวศึกษาจังหวัดอุดรธานี
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-slate-200/70 rounded-2xl" />
          ))}
        </div>
      ) : newsList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 text-sm">
          ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {newsList.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                    {item.category === 'ANNOUNCEMENT'
                      ? 'ข่าวประชาสัมพันธ์'
                      : item.category === 'ACTIVITY'
                      ? 'ข่าวกิจกรรม'
                      : 'แบนเนอร์'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{item.viewCount} ครั้ง</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors leading-snug mb-2">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                  {item.content}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(item.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                {item.author && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{item.author.fullName}</span>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
