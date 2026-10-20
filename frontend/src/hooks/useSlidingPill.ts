import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * แถบไฮไลต์ที่ "ไหล" ไปหาเมนูที่เลือก: วัดตำแหน่ง/ขนาดปุ่มที่ active แล้วเลื่อนแถบเดียวไปทับ
 * (ครั้งแรกวางตำแหน่งเลยไม่มี animation; วัดใหม่เมื่อจอ/ฟอนต์/รายการเมนูเปลี่ยน; เมนูที่ซ่อนอยู่ = ซ่อนแถบ)
 * แถบเมนูที่แสดงทีหลัง (render แบบมีเงื่อนไข) ต้องเปลี่ยน itemKey ตอนแสดง เพื่อให้วัดใหม่
 */
export function useSlidingPill(activeId: string, itemKey: string) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState({ left: 0, top: 0, width: 0, height: 0, visible: false });
  const [animate, setAnimate] = useState(false);
  const [mounted, setMounted] = useState(false);

  const measure = useCallback(() => {
    setMounted(!!containerRef.current);
    const el = itemRefs.current[activeId];
    if (!el || el.offsetWidth === 0) {
      setPill((p) => (p.visible ? { ...p, visible: false } : p));
      return;
    }
    setPill((p) =>
      p.visible && p.left === el.offsetLeft && p.top === el.offsetTop && p.width === el.offsetWidth && p.height === el.offsetHeight
        ? p
        : { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, visible: true }
    );
  }, [activeId]);

  useLayoutEffect(() => {
    measure();
  }, [measure, itemKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    Object.values(itemRefs.current).forEach((el) => el && ro.observe(el));
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure, itemKey]);

  // เปิด animation หลังวางตำแหน่งแรกเสร็จ (กันแถบไหลมาจากมุมซ้ายตอนโหลดหน้า หรือตอนแถบเมนูเพิ่งถูกแสดง)
  useEffect(() => {
    if (!mounted) {
      setAnimate(false);
      return;
    }
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  // แถบเมนูที่เลื่อนได้ (มือถือ): เลื่อนให้เมนูที่เลือกอยู่กลางจอ
  useEffect(() => {
    const container = containerRef.current;
    const el = itemRefs.current[activeId];
    if (container && el && container.scrollWidth > container.clientWidth) {
      container.scrollTo({ left: el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
    }
  }, [activeId, itemKey]);

  const setItemRef = (id: string) => (el: HTMLButtonElement | null) => {
    itemRefs.current[id] = el;
  };

  const pillStyle: React.CSSProperties = {
    width: pill.width,
    height: pill.height,
    transform: `translate(${pill.left}px, ${pill.top}px)`,
    opacity: pill.visible ? 1 : 0,
    transitionProperty: animate ? 'transform, width, height, opacity' : 'none',
  };

  return { containerRef, setItemRef, pillStyle };
}
