export type BeyBadge = { id: string; name: string; image: string };

import part0 from "@/data/beyBadgesData0.json";
import part1 from "@/data/beyBadgesData1.json";
import part2 from "@/data/beyBadgesData2.json";

const THUMB = "https://beyblade.phstudy.org/images/thumb/site/Blade/";

const RAW = [
  ...(part0 as [string, string][]),
  ...(part1 as [string, string][]),
  ...(part2 as [string, string][]),
];

/** 全部套組來自 beyblade.phstudy.org（僅供學習徽章展示）共 305 枚 */
export const BEY_BADGES: BeyBadge[] = RAW.map(([id, name]) => ({
  id,
  name,
  image: `${THUMB}${id}.webp`,
}));

export function getBeyById(id: string): BeyBadge | undefined {
  return BEY_BADGES.find((b) => b.id === id);
}
