// สาขาวิชาที่เปิดสอน แยกตามระดับ (เก็บใน institutions.programsList เป็น JSON array ของ { level, name })
export type ProgramLevel = 'VOC' | 'HIGH_VOC' | 'BACHELOR';

export interface ProgramItem {
  level: ProgramLevel;
  name: string;
}

export const PROGRAM_LEVELS: { key: ProgramLevel; label: string; fullLabel: string }[] = [
  { key: 'VOC', label: 'ปวช.', fullLabel: 'ประกาศนียบัตรวิชาชีพ (ปวช.)' },
  { key: 'HIGH_VOC', label: 'ปวส.', fullLabel: 'ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส.)' },
  { key: 'BACHELOR', label: 'ทล.บ.', fullLabel: 'ปริญญาตรีสายเทคโนโลยี (ทล.บ.)' },
];

const LEVEL_KEYS = PROGRAM_LEVELS.map((l) => l.key);

/**
 * แปลงค่าจากฐานข้อมูลเป็นรายการสาขา (ตัดชื่อว่างทิ้ง)
 * รองรับรูปแบบเดิมที่เป็นรายชื่อล้วน (ยังไม่แยกระดับ) — จัดไว้ที่ ปวช. ให้แก้ระดับภายหลัง
 */
export const parsePrograms = (raw: unknown): ProgramItem[] => {
  let list: unknown = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      list = raw.split(',');
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((item): ProgramItem | null => {
      if (typeof item === 'string') return { level: 'VOC', name: item.trim() };
      if (item && typeof item === 'object') {
        const { level, name } = item as { level?: string; name?: unknown };
        return {
          level: LEVEL_KEYS.includes(level as ProgramLevel) ? (level as ProgramLevel) : 'VOC',
          name: String(name ?? '').trim(),
        };
      }
      return null;
    })
    .filter((p): p is ProgramItem => !!p && p.name !== '');
};

/** จำนวนสาขาที่แสดงผล: ถ้ามีรายชื่อใช้จำนวนรายชื่อ ไม่มีใช้ตัวเลขที่บันทึกไว้ */
export const countPrograms = (raw: unknown, savedCount?: number | null): number => {
  const list = parsePrograms(raw);
  return list.length > 0 ? list.length : savedCount ?? 0;
};
