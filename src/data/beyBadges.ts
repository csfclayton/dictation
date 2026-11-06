export type BeyBadge = { id: string; name: string; image: string };

/** 全部套組來自 beyblade.phstudy.org（僅供學習徽章展示）共 305 枚 */
const RAW: [string, string][] = [
  ["BL-PRD-910381-00", "BX-01 翔龍神劍3-60F"],
  ["BL-PRD-910398-00", "BX-02 煉獄魔鐮4-60T"],
  ["BL-PRD-910473-00", "BX-03 巫師弩箭4-80B"],
  ["BL-PRD-910404-00", "BX-04 騎士護盾3-80N"],
  ["BL-PRD-910497-00", "BX-05 巫師弩箭4-80B"],
];

const THUMB = "https://beyblade.phstudy.org/images/thumb/site/Blade/";

export const BEY_BADGES: BeyBadge[] = RAW.map(([id, name]) => ({
  id,
  name,
  image: `${THUMB}${id}.webp`,
}));

export function getBeyById(id: string): BeyBadge | undefined {
  return BEY_BADGES.find((b) => b.id === id);
}
