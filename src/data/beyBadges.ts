export type BeyBadge = { id: string; name: string; image: string };

import p0 from "@/data/beyBadgesData0.json";
import p1 from "@/data/beyBadgesData1.json";
import p2 from "@/data/beyBadgesData2.json";
import p3 from "@/data/beyBadgesData3.json";
import p4 from "@/data/beyBadgesData4.json";
import p5 from "@/data/beyBadgesData5.json";

const THUMB = "https://beyblade.phstudy.org/images/thumb/site/Blade/";

const RAW = [
  ...(p0 as [string, string][]),
  ...(p1 as [string, string][]),
  ...(p2 as [string, string][]),
  ...(p3 as [string, string][]),
  ...(p4 as [string, string][]),
  ...(p5 as [string, string][]),
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
