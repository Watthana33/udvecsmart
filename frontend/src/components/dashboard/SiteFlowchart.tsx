import React, { useMemo, useState } from 'react';
import { Workflow, Pencil, Plus, Trash2, Save, X, Loader2 } from 'lucide-react';
import { updateOicStructure } from '../../services/api';

// คลาสสไตล์ของชิ้นส่วนในแผนภาพ (ใช้โทนสีเดียวกับเว็บ: แดงเลือดหมูตามธีม + อำพันสำหรับการ์ดข้อมูล)
const NODE = 'fill-white stroke-slate-300';
const NODE_A = 'fill-hx-fdf6f4 stroke-hx-932d16';
const EDGE = 'fill-none stroke-slate-500';
const TH = 'fill-slate-900';
const TM = 'fill-slate-500';

const MAX_CARDS = 8;
const MAX_LINES = 60;
const MAX_CHILDREN = 6;

export interface SubCard {
  title: string;
  lines: string[];
}

export interface InfoCard extends SubCard {
  children: SubCard[]; // การ์ดย่อยที่ต่อจากการ์ดนี้
}

// ค่าเริ่มต้นของการ์ด (ใช้เมื่อแอดมินยังไม่เคยแก้)
const BASE_CARDS: SubCard[] = [
  { title: 'แบบสำรวจสถิติ', lines: ['นักเรียนรายชั้นปี', 'ทวิภาคี ทวิศึกษา ทวิวุฒิ', 'ผู้สำเร็จ ผู้บริหาร ครู', 'การประเมิน อวท.'] },
  { title: 'รายชื่อหัวหน้างาน', lines: ['หัวหน้างาน 22 งาน', 'ชื่อและเบอร์โทรศัพท์'] },
  { title: 'แบบสำรวจห้องเรียนอาชีพ', lines: ['โรงเรียนที่ร่วมดำเนินการ', 'ชั่วโมงเรียน การรับรอง', 'หลักสูตรระยะสั้น', 'ปัญหาและแผนขยาย'] },
  { title: 'กรอกผ่านเว็บ 6 หมวด', lines: ['ข้อมูลทั่วไป ผอ. ติดต่อ สาขา', 'บุคลากร เพศ วุฒิ การจ้าง', 'สถิตินักเรียน และค้างจบ', 'ทวิภาคีรายแผนก', 'ห้องเรียนอาชีพ', 'จบและมีงานทำ'] },
];

const DEFAULT_CARDS: InfoCard[] = BASE_CARDS.map((c) => ({ ...c, children: [] }));

function parseSub(c: unknown): SubCard | null {
  const item = c as { title?: unknown; lines?: unknown };
  if (typeof item?.title !== 'string' || !Array.isArray(item.lines)) return null;
  return { title: item.title, lines: item.lines.filter((l): l is string => typeof l === 'string') };
}

function parseCards(raw: string | undefined): InfoCard[] {
  if (!raw) return DEFAULT_CARDS;
  try {
    const data = JSON.parse(raw) as { cards?: unknown };
    if (!Array.isArray(data.cards) || data.cards.length === 0) return DEFAULT_CARDS;
    const cards: InfoCard[] = [];
    for (const c of data.cards.slice(0, MAX_CARDS)) {
      const main = parseSub(c);
      if (!main) return DEFAULT_CARDS;
      const rawChildren = (c as { children?: unknown }).children;
      const children = Array.isArray(rawChildren)
        ? rawChildren.slice(0, MAX_CHILDREN).map(parseSub).filter((x): x is SubCard => x !== null)
        : [];
      cards.push({ ...main, children });
    }
    return cards;
  } catch {
    return DEFAULT_CARDS;
  }
}

// รายการในการ์ด: ทุกบรรทัดมีจุดนำหน้า บรรทัดที่ขึ้นต้นด้วย "- " เป็นข้อย่อย (เยื้องเข้าไป)
const LineList: React.FC<{ lines: string[]; small?: boolean }> = ({ lines, small }) => (
  <ul className="mt-2">
    {lines.map((raw, j) => {
      const isSub = /^\s*-\s+/.test(raw);
      const text = raw.replace(/^\s*-\s+/, '');
      return (
        <li
          key={j}
          className={`relative leading-relaxed ${small ? 'text-[11px] text-slate-600' : 'text-xs text-slate-700'} ${
            isSub
              ? "pl-8 mt-0.5 before:content-['–'] before:absolute before:left-4 before:text-slate-400"
              : "pl-4 mt-1.5 before:content-['•'] before:absolute before:left-0 before:text-amber-600"
          }`}
        >
          {text}
        </li>
      );
    })}
  </ul>
);

const Tree: React.FC<{ cards: InfoCard[] }> = ({ cards }) => {
  const n = cards.length;
  const centers = cards.map((_, i) => (960 * (i + 0.5)) / n);
  const busLeft = Math.min(300, centers[0]);
  const busRight = Math.max(660, centers[n - 1]);
  return (
    <svg viewBox="0 0 960 340" className="block w-full h-auto" role="img"
      aria-label="สอจ.อุดรธานี สังกัด สอศ. กำกับสถานศึกษาภาครัฐและภาคเอกชน ซึ่งส่งข้อมูลให้ สอจ. ตามการ์ดด้านล่าง">
      <defs>
        <marker id="ar-oic" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-slate-500" />
        </marker>
      </defs>
      <rect className={NODE} strokeWidth={1.5} x={330} y={14} width={300} height={42} rx={10} />
      <text x={480} y={40} textAnchor="middle" className={TH} fontSize={14} fontWeight={700}>สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)</text>
      <path className={EDGE} strokeWidth={1.6} d="M480,56 V92" markerEnd="url(#ar-oic)" />
      <text x={492} y={78} className={TM} fontSize={12} fontStyle="italic">สังกัด</text>

      <rect className={NODE_A} strokeWidth={1.5} x={290} y={94} width={380} height={62} rx={12} />
      <text x={480} y={120} textAnchor="middle" className={TH} fontSize={14} fontWeight={700}>สำนักงานอาชีวศึกษาจังหวัดอุดรธานี (สอจ.)</text>
      <text x={480} y={141} textAnchor="middle" className={TM} fontSize={12}>กำกับ ติดตาม และรวบรวมข้อมูลสถานศึกษา</text>

      <path className={EDGE} strokeWidth={1.6} d="M480,156 V184 H300 V210" markerEnd="url(#ar-oic)" />
      <path className={EDGE} strokeWidth={1.6} d="M480,184 H660 V210" markerEnd="url(#ar-oic)" />

      <rect className={NODE} strokeWidth={1.5} x={150} y={212} width={300} height={56} rx={12} />
      <text x={300} y={246} textAnchor="middle" className={TH} fontSize={15} fontWeight={700}>สถานศึกษาภาครัฐ</text>
      <rect className={NODE} strokeWidth={1.5} x={510} y={212} width={300} height={56} rx={12} />
      <text x={660} y={246} textAnchor="middle" className={TH} fontSize={15} fontWeight={700}>สถานศึกษาภาคเอกชน</text>

      <path className={EDGE} strokeWidth={1.6} d={`M300,268 V296 M660,268 V296 M${busLeft},296 H${busRight}`} />
      <text x={480} y={288} textAnchor="middle" className={TM} fontSize={12} fontStyle="italic">ส่งข้อมูลให้ สอจ.</text>
      {centers.map((cx) => (
        <path key={cx} className={EDGE} strokeWidth={1.6} d={`M${cx},296 V338`} markerEnd="url(#ar-oic)" />
      ))}
    </svg>
  );
};

interface SiteFlowchartProps {
  savedCards?: string;
  onSaved: () => void | Promise<void>;
}

export const SiteFlowchart: React.FC<SiteFlowchartProps> = ({ savedCards, onSaved }) => {
  const saved = useMemo(() => parseCards(savedCards), [savedCards]);
  const [draft, setDraft] = useState<InfoCard[] | null>(null); // null = ไม่ได้อยู่ในโหมดแก้ไข
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const cards = draft ?? saved;
  const editing = draft !== null;
  const hasChildren = cards.some((c) => c.children.length > 0);

  const patchCard = (i: number, patch: Partial<InfoCard>) =>
    setDraft((d) => (d ? d.map((c, j) => (j === i ? { ...c, ...patch } : c)) : d));

  const patchChild = (i: number, j: number, patch: Partial<SubCard>) =>
    setDraft((d) =>
      d ? d.map((c, k) => (k === i ? { ...c, children: c.children.map((ch, m) => (m === j ? { ...ch, ...patch } : ch)) } : c)) : d
    );
  const addChild = (i: number) =>
    setDraft((d) =>
      d ? d.map((c, k) => (k === i && c.children.length < MAX_CHILDREN ? { ...c, children: [...c.children, { title: 'การ์ดย่อยใหม่', lines: [] }] } : c)) : d
    );
  const removeChild = (i: number, j: number) =>
    setDraft((d) => (d ? d.map((c, k) => (k === i ? { ...c, children: c.children.filter((_, m) => m !== j) } : c)) : d));

  const handleSave = async () => {
    if (!draft) return;
    const cleaned = draft.map((c) => ({
      title: c.title.trim(),
      lines: c.lines.map((l) => l.trim()).filter((l) => l !== ''),
      children: c.children.map((ch) => ({
        title: ch.title.trim(),
        lines: ch.lines.map((l) => l.trim()).filter((l) => l !== ''),
      })),
    }));
    if (cleaned.some((c) => c.title === '' || c.children.some((ch) => ch.title === ''))) {
      setMessage({ ok: false, text: 'ทุกการ์ดและการ์ดย่อยต้องมีชื่อ' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateOicStructure(cleaned);
      await onSaved();
      setDraft(null);
      setMessage({ ok: true, text: 'บันทึกการ์ดเรียบร้อยแล้ว' });
    } catch (err) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = e.response?.status ? ` (HTTP ${e.response.status})` : '';
      setMessage({ ok: false, text: `บันทึกไม่สำเร็จ: ${e.response?.data?.message || e.message || 'ไม่ทราบสาเหตุ'}${status}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-hx-932d16 bg-hx-932d16/10 px-3.5 py-1 rounded-full">
          <Workflow className="w-3.5 h-3.5" />
          <span>Flowchart</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          สอจ.อุดรธานี ประกอบด้วยส่วนไหน
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          สำนักงานอาชีวศึกษาจังหวัดอุดรธานี สังกัด สอศ. กำกับสถานศึกษาภาครัฐและภาคเอกชน และรวบรวมข้อมูลที่สถานศึกษาส่งให้
        </p>
      </div>

      <figure className="space-y-3">
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200/90 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)]">
          <div style={{ minWidth: Math.max(720, cards.length * 190) }}>
            <Tree cards={cards} />
            <div className={`grid ${hasChildren ? '' : 'pb-5'}`} style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))` }}>
              {cards.map((c, i) => (
                <div key={i} className="px-2">
                  <div className="h-full rounded-xl border border-amber-600 bg-amber-50 p-3.5">
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{c.title || 'ไม่มีชื่อ'}</h3>
                    <LineList lines={c.lines} />
                  </div>
                </div>
              ))}
            </div>
            {hasChildren && (
              <div className="grid pb-5" style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))` }}>
                {cards.map((c, i) => (
                  <div key={i} className="px-2">
                    {c.children.map((ch, j) => (
                      <div key={j} className="flex flex-col items-center">
                        <div className="w-px h-5 bg-slate-400" />
                        <div className="w-full rounded-lg border border-amber-600/60 bg-white p-3">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{ch.title || 'ไม่มีชื่อ'}</h4>
                          <LineList lines={ch.lines} small />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <figcaption className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
          ผังนี้ยังไม่มีโครงสร้างภายในของ สอจ. เช่น กลุ่มงานหรือตำแหน่ง
        </figcaption>
      </figure>

      {message && !editing && (
        <p role="status" className={`text-sm font-semibold ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{message.text}</p>
      )}

      {!editing && (
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setDraft(saved.map((c) => ({ title: c.title, lines: [...c.lines], children: c.children.map((ch) => ({ title: ch.title, lines: [...ch.lines] })) })));
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-hx-932d16 text-white text-sm font-bold shadow-md hover:shadow-lg transition-shadow duration-150 cursor-pointer"
        >
          <Pencil className="w-4 h-4" />
          แก้ไขการ์ดข้อมูล
        </button>
      )}

      {editing && draft && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">แก้ไขการ์ดข้อมูลที่สถานศึกษาส่งให้ สอจ.</h2>
            <p className="text-xs text-slate-500 mt-1">พิมพ์ 1 รายการต่อ 1 บรรทัด (ขึ้นต้นด้วย - เพื่อทำเป็นข้อย่อย) ผังด้านบนเปลี่ยนตามทันที การ์ดย่อยจะต่อลงใต้การ์ดหลัก กดบันทึกเมื่อเสร็จ</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {draft.map((c, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3.5 space-y-2.5 bg-slate-50/60">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={`oic-title-${i}`} className="text-xs font-bold text-slate-700">ชื่อการ์ด</label>
                  <button
                    type="button"
                    onClick={() => setDraft((d) => (d ? d.filter((_, j) => j !== i) : d))}
                    disabled={draft.length <= 1}
                    title="ลบการ์ดนี้"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  id={`oic-title-${i}`}
                  type="text"
                  maxLength={60}
                  value={c.title}
                  onChange={(e) => patchCard(i, { title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <label htmlFor={`oic-lines-${i}`} className="text-xs font-bold text-slate-700 block">รายการ (บรรทัดละ 1 รายการ)</label>
                <textarea
                  id={`oic-lines-${i}`}
                  rows={7}
                  value={c.lines.join('\n')}
                  onChange={(e) => patchCard(i, { lines: e.target.value.split('\n').slice(0, MAX_LINES) })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed"
                />

                <div className="pt-2.5 border-t border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 block">การ์ดย่อย ({c.children.length}/{MAX_CHILDREN})</span>
                  {c.children.map((ch, j) => (
                    <div key={j} className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor={`oic-ctitle-${i}-${j}`} className="text-[11px] font-bold text-slate-600">ชื่อการ์ดย่อย</label>
                        <button
                          type="button"
                          onClick={() => removeChild(i, j)}
                          title="ลบการ์ดย่อยนี้"
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors duration-150"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        id={`oic-ctitle-${i}-${j}`}
                        type="text"
                        maxLength={60}
                        value={ch.title}
                        onChange={(e) => patchChild(i, j, { title: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
                      />
                      <label htmlFor={`oic-clines-${i}-${j}`} className="text-[11px] font-bold text-slate-600 block">รายการ (บรรทัดละ 1 รายการ)</label>
                      <textarea
                        id={`oic-clines-${i}-${j}`}
                        rows={3}
                        value={ch.lines.join('\n')}
                        onChange={(e) => patchChild(i, j, { lines: e.target.value.split('\n').slice(0, MAX_LINES) })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm leading-relaxed"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addChild(i)}
                    disabled={c.children.length >= MAX_CHILDREN}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มการ์ดย่อย
                  </button>
                </div>
              </div>
            ))}
          </div>

          {message && (
            <p role="status" className={`text-sm font-semibold ${message.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{message.text}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDraft((d) => (d && d.length < MAX_CARDS ? [...d, { title: 'การ์ดใหม่', lines: [], children: [] }] : d))}
              disabled={draft.length >= MAX_CARDS}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-150"
            >
              <Plus className="w-4 h-4" />
              เพิ่มการ์ด
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-hx-932d16 text-white text-sm font-bold shadow-md disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setMessage(null);
              }}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
            >
              <X className="w-4 h-4" />
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
