export type BeyBadge = { id: string; name: string; image: string };

/** 圖片嚴格取自 beyblade.phstudy.org 套組圖鑑（僅供學習收集展示） */
export const BEY_BADGES: BeyBadge[] = [
  { id: "CX-20-03", name: "CX-20-03 魔導神杖 8-80K", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-077596-03.webp" },
  { id: "CX-20-02", name: "CX-20-02 鮫鯊狂鱗 1-70LR", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-077596-02.webp" },
  { id: "CX-20-01", name: "CX-20-01 鳳凰神威 WHM-65MT", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-077596-01.webp" },
  { id: "BX-54", name: "BX-54 巨神壓制 0-70LP", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-080763-00.webp" },
  { id: "BXG-65", name: "BXG-65 戰神伏特 S4-70V", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-056102-00.webp" },
  { id: "BXG-71-02", name: "BXG-71-02 野牛豪勇 DB", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-065173-00.webp" },
  { id: "BXG-71-01", name: "BXG-71-01 野牛豪勇 DB", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-065180-00.webp" },
  { id: "BXC-21", name: "BXC-21 基德狩獵 K4-70TK", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-056225-00.webp" },
  { id: "BX-53-03", name: "BX-53-03 騎士重盾 3-80N", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-073734-03.webp" },
  { id: "BX-53-02", name: "BX-53-02 魔導幻箭 4-80B", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-073734-02.webp" },
  { id: "BX-53-01", name: "BX-53-01 空力天馬 3-70A", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-073734-01.webp" },
  { id: "BX-52", name: "BX-52 輝耀龍騎士 6-60LC", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-085553-00.webp" },
  { id: "BXC-20", name: "BXC-20 時鐘幻象 4-55S", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-067900-00.webp" },
  { id: "CX-19-03", name: "CX-19-03 鱷魚裂甲 TQ5-50GN", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-080626-03.webp" },
  { id: "CX-19-02", name: "CX-19-02 鱷魚裂甲 TQ5-50GN", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-080626-02.webp" },
  { id: "CX-19-01", name: "CX-19-01 鱷魚裂甲 TQ5-50GN", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-080626-01.webp" },
  { id: "BXG-70", name: "BXG-70 迪卡狂怒 FT3-60T", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-080640-00.webp" },
  { id: "BXG-63", name: "BXG-63 榮耀武神 LF", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-065159-00.webp" },
  { id: "BXG-57-03", name: "BXG-57-03 新世紀福音戰士九尾 T2-70A", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-085683-03.webp" },
  { id: "BXG-57-02", name: "BXG-57-02 新世紀福音戰士勇氣 A1-70V", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-085683-02.webp" },
  { id: "BXG-57-01", name: "BXG-57-01 新世紀福音戰士至尊 B0-70E", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-085683-01.webp" },
  { id: "UX-21-03", name: "UX-21-03 飛龍凌空 8-80B", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-085546-03.webp" },
  { id: "UX-21-02", name: "UX-21-02 霜輝銀狼 9-70R", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-085546-02.webp" },
  { id: "UX-21-01", name: "UX-21-01 惡魔冥", image: "https://beyblade.phstudy.org/images/thumb/site/Blade/BL-PRD-085546-01.webp" },
];

export function getBeyById(id: string): BeyBadge | undefined {
  return BEY_BADGES.find((b) => b.id === id);
}
