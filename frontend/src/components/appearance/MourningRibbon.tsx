import React from 'react';

/** ริบบิ้นไว้อาลัยมุมขวาบน (ใช้คู่กับธีมไว้อาลัย) */
export const MourningRibbon: React.FC = () => (
  <img
    src="/black_ribbon_top_right.png"
    alt=""
    aria-hidden="true"
    className="fixed top-0 right-0 z-[90] pointer-events-none select-none w-[88px] h-[88px] sm:w-[122px] sm:h-[122px]"
  />
);
