export type BeyBadge = { id: string; name: string; image: string };

import raw from "@/data/beyBadgesData.json";

const THUMB = "https://beyblade.phstudy.org/images/thumb/site/Blade/";

/** 全部套組來自 beyblade.phstudy.org（僅供學習徽章展示）共 305 枚 */
export const BEY_BADGES: BeyBadge[] = (raw as [string, string][]).map(([id, name]) => ({
  id,
  name,
  image: `${THUMB}${id}.webp`,
}));

export function getBeyById(id: string): BeyBadge | undefined {
  return BEY_BADGES.find((b) => b.id === id);
}
