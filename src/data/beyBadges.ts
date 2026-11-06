export type BeyBadge = { id: string; name: string; image: string };

import p0 from "@/data/beyBadgesData0.json";
import p1 from "@/data/beyBadgesData1.json";
import p2 from "@/data/beyBadgesData2.json";
import p3 from "@/data/beyBadgesData3.json";
import p4 from "@/data/beyBadgesData4.json";
import p5 from "@/data/beyBadgesData5.json";

const THUMB = "https://beyblade.phstudy.org/images/thumb/site/Blade/";

/** R/M 後綴變體多數冇獨立縮圖，回退到基礎 id */
function thumbId(id: string): string {
  let s = id;
  while (/[RM]$/.test(s)) s = s.slice(0, -1);
  return s;
}

const RAW: [string, string][] = [
  ...(p0 as [string, string][]),
  ...(p1 as [string, string][]),
  ...(p2 as [string, string][]),
  ...(p3 as [string, string][]),
  ...(p4 as [string, string][]),
  ...(p5 as [string, string][]),
];

/** 全部套組來自 beyblade.phstudy.org（僅供學習徽章展示） */
const seen = new Set<string>();
export const BEY_BADGES: BeyBadge[] = [];
for (const [id, name] of RAW) {
  if (seen.has(id)) continue;
  seen.add(id);
  BEY_BADGES.push({ id, name, image: `${THUMB}${thumbId(id)}.webp` });
}

export function getBeyById(id: string): BeyBadge | undefined {
  return BEY_BADGES.find((b) => b.id === id);
}
