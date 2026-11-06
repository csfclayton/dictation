export type BeyBadge = { id: string; name: string; image: string };

import { PART as p0 } from "@/data/beyBadgesData0";
import { PART as p1 } from "@/data/beyBadgesData1";
import { PART as p2 } from "@/data/beyBadgesData2";
import { PART as p3 } from "@/data/beyBadgesData3";
import { PART as p4 } from "@/data/beyBadgesData4";
import { PART as p5 } from "@/data/beyBadgesData5";

const THUMB = "https://beyblade.phstudy.org/images/thumb/site/Blade/";

function thumbId(id: string): string {
  let s = id;
  while (/[RM]$/.test(s)) s = s.slice(0, -1);
  return s;
}

const RAW: [string, string][] = [...p0, ...p1, ...p2, ...p3, ...p4, ...p5];

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
