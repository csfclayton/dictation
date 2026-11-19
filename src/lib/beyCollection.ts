"use client";

import { BEY_BADGES, getBeyById, type BeyBadge } from "@/data/beyBadges";
import { battleLevelForBadgeId } from "@/data/beyBattleLevels";

/** v2 = 重設所有裝置已收集的陀螺 */
const KEY = "bey_collection_v2";

export type OwnedBey = {
  id: string;
  count: number;
  firstAt: number;
  lastAt: number;
};

export function loadBeyCollection(): OwnedBey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

const BATTLE_UNLOCK_KEY = "beyUnlocked_v1";
const BATTLE_FILTER_KEY = "beyUnlockFilterOn_v1";

function badgeIdToBattleKey(id: string): string {
  return String(id || "").replace(/-/g, "").toLowerCase();
}

export function syncCollectionToBattleApp(list?: OwnedBey[]) {
  if (typeof window === "undefined") return;
  try {
    const owned = list || loadBeyCollection();
    const keys = owned.map((o) => badgeIdToBattleKey(o.id));
    let existing: string[] = [];
    try {
      const raw = localStorage.getItem(BATTLE_UNLOCK_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) existing = arr.map(String);
      }
    } catch {}
    const merged = Array.from(new Set([...existing, ...keys]));
    localStorage.setItem(BATTLE_UNLOCK_KEY, JSON.stringify(merged));
    localStorage.setItem(BATTLE_FILTER_KEY, "1");
  } catch (e) {
    console.warn("syncCollectionToBattleApp", e);
  }
}

function saveBeyCollection(list: OwnedBey[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearBeyCollection() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function ownedCount(): number {
  return loadBeyCollection().length;
}

export function totalBeyTypes(): number {
  return BEY_BADGES.length;
}

const LEVEL_COUNT = 10;

/**
 * 等級與戰鬥 App 對齊：
 * attack+defense+stamina+speed 總和排序後均分 Lv.1–10
 * （beyBattleLevels.ts 由 arena BEY_DATA 產生）
 */
let _levelMap: Record<string, number> | null = null;
let _levelBuckets: BeyBadge[][] | null = null;

function ensureLevels() {
  if (_levelMap && _levelBuckets) return;
  _levelMap = {};
  _levelBuckets = Array.from({ length: LEVEL_COUNT }, () => [] as BeyBadge[]);

  const withBattle: { b: BeyBadge; lv: number }[] = [];
  const without: BeyBadge[] = [];
  for (const b of BEY_BADGES) {
    const lv = battleLevelForBadgeId(b.id);
    if (lv != null && lv >= 1 && lv <= 10) withBattle.push({ b, lv });
    else without.push(b);
  }
  for (const { b, lv } of withBattle) {
    _levelMap[b.id] = lv;
    _levelBuckets[lv - 1].push(b);
  }
  // 未對應戰鬥資料：填入較空嘅等級桶
  without.sort((a, b) => a.name.localeCompare(b.name, "zh-Hant") || a.id.localeCompare(b.id));
  for (const b of without) {
    let best = 0;
    let bestLen = _levelBuckets![0].length;
    for (let i = 1; i < LEVEL_COUNT; i++) {
      if (_levelBuckets![i].length < bestLen) {
        best = i;
        bestLen = _levelBuckets![i].length;
      }
    }
    _levelMap[b.id] = best + 1;
    _levelBuckets[best].push(b);
  }
}

export function getBeyLevel(id: string): number {
  ensureLevels();
  return _levelMap![id] || 1;
}

export function levelTotal(lv: number): number {
  ensureLevels();
  if (lv < 1 || lv > LEVEL_COUNT) return 0;
  return _levelBuckets![lv - 1].length;
}

export function levelOwnedCount(lv: number, ownedIds?: Set<string>): number {
  ensureLevels();
  if (lv < 1 || lv > LEVEL_COUNT) return 0;
  const ids = ownedIds || new Set(loadBeyCollection().map((o) => o.id));
  return _levelBuckets![lv - 1].filter((b) => ids.has(b.id)).length;
}

export function getMaxDrawLevel(ownedIds?: Set<string>): number {
  ensureLevels();
  const ids = ownedIds || new Set(loadBeyCollection().map((o) => o.id));
  let maxLv = 1;
  for (let lv = 1; lv < LEVEL_COUNT; lv++) {
    const total = levelTotal(lv);
    if (!total) {
      maxLv = lv + 1;
      continue;
    }
    const owned = levelOwnedCount(lv, ids);
    if (owned / total >= 0.8) maxLv = lv + 1;
    else break;
  }
  return maxLv;
}

export function grantRandomBey(): {
  badge: BeyBadge;
  isNew: boolean;
  owned: OwnedBey;
} {
  ensureLevels();
  const owned = loadBeyCollection();
  const ownedIds = new Set(owned.map((o) => o.id));
  const maxLv = getMaxDrawLevel(ownedIds);

  const poolMissing: BeyBadge[] = [];
  for (let lv = 1; lv <= maxLv; lv++) {
    for (const b of _levelBuckets![lv - 1]) {
      if (!ownedIds.has(b.id)) poolMissing.push(b);
    }
  }
  let pool = poolMissing;
  if (!pool.length) {
    pool = [];
    for (let lv = 1; lv <= maxLv; lv++) pool.push(..._levelBuckets![lv - 1]);
  }
  if (!pool.length) pool = BEY_BADGES;

  const badge = pool[Math.floor(Math.random() * pool.length)]!;
  const now = Date.now();
  const existing = owned.find((o) => o.id === badge.id);
  let isNew = false;
  if (existing) {
    existing.count += 1;
    existing.lastAt = now;
  } else {
    isNew = true;
    owned.unshift({ id: badge.id, count: 1, firstAt: now, lastAt: now });
  }
  saveBeyCollection(owned);
  syncCollectionToBattleApp(owned);
  const row = owned.find((o) => o.id === badge.id)!;
  return { badge, isNew, owned: row };
}

export function collectionStats() {
  const list = loadBeyCollection();
  const total = BEY_BADGES.length;
  const unique = list.length;
  const copies = list.reduce((s, o) => s + o.count, 0);
  return {
    unique,
    total,
    copies,
    percent: total ? Math.round((unique / total) * 100) : 0,
    maxDrawLevel: getMaxDrawLevel(new Set(list.map((o) => o.id))),
  };
}

export function getOwnedMap(): Record<string, OwnedBey> {
  const m: Record<string, OwnedBey> = {};
  for (const o of loadBeyCollection()) m[o.id] = o;
  return m;
}

/** 圖鑑：由戰鬥 App 同級 Lv 低至高排列 */
export function resolveOwned(): { badge: BeyBadge; owned: OwnedBey | null; level: number }[] {
  ensureLevels();
  const map = getOwnedMap();
  const rows = BEY_BADGES.map((b) => ({
    badge: b,
    owned: map[b.id] || null,
    level: getBeyLevel(b.id),
  }));
  rows.sort(
    (a, b) => a.level - b.level || a.badge.name.localeCompare(b.badge.name, "zh-Hant")
  );
  return rows;
}

export { getBeyById };
