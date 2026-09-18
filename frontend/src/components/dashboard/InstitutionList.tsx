import React, { useState, useMemo } from 'react';
import { Institution, InstitutionType } from '../../types';
import { Search, Building, Phone, MapPin, ExternalLink, School } from 'lucide-react';

interface InstitutionListProps {
  institutions: Institution[];
  loading: boolean;
}

export const InstitutionList: React.FC<InstitutionListProps> = ({ institutions, loading }) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | InstitutionType>('ALL');

  // Filter institutions locally for instantaneous snappy response
  const filtered = useMemo(() => {
    return institutions.filter((inst) => {
      const matchSearch =
        inst.name.toLowerCase().includes(search.toLowerCase()) ||
        inst.code.includes(search);
      const matchType = selectedType === 'ALL' || inst.type === selectedType;
      return matchSearch && matchType;
    });
  }, [institutions, search, selectedType]);

  const publicCount = institutions.filter((i) => i.type === 'PUBLIC').length;
  const privateCount = institutions.filter((i) => i.type === 'PRIVATE').length;

  return (
    <section id="institutions" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-200">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <School className="w-4 h-4" />
            <span>Institution Directory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            ทำเนียบสถานศึกษาในสังกัด สอจ.อุดรธานี
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            สถานศึกษาอาชีวศึกษาภาครัฐและภาคเอกชน ทั้งหมด {institutions.length} แห่ง
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ รหัสวิทยาลัย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Type Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-600">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({institutions.length})
            </button>
            <button
              onClick={() => setSelectedType('PUBLIC')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === 'PUBLIC'
                  ? 'bg-white text-blue-600 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              รัฐบาล ({publicCount})
            </button>
            <button
              onClick={() => setSelectedType('PRIVATE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === 'PRIVATE'
                  ? 'bg-white text-amber-600 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              เอกชน ({privateCount})
            </button>
          </div>

        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 bg-slate-200/70 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <Building className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">ไม่พบสถานศึกษาที่ตรงกับเงื่อนไขการค้นหา</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองประเภทอื่น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((inst) => (
            <div
              key={inst.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Code & Type badge */}
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {inst.code}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      inst.type === 'PUBLIC'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    }`}
                  >
                    {inst.type === 'PUBLIC' ? 'ภาครัฐ' : 'ภาคเอกชน'}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-3">
                  {inst.name}
                </h3>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-500 mb-6">
                  {inst.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{inst.address}</span>
                    </div>
                  )}
                  {inst.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{inst.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {inst.province}
                </span>
                {inst.website ? (
                  <a
                    href={inst.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <span>เยี่ยมชมเว็บไซต์</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">ไม่มีข้อมูลเว็บไซต์</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
