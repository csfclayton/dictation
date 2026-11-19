"use client";

import { BEY_BADGES, getBeyById, type BeyBadge } from "@/data/beyBadges";

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


/** 戰鬥 App 解鎖 key（與 beyblade-x-arena 共用 localStorage） */
const BATTLE_UNLOCK_KEY = "beyUnlocked_v1";
const BATTLE_FILTER_KEY = "beyUnlockFilterOn_v1";

function badgeIdToBattleKey(id: string): string {
  return String(id || "").replace(/-/g, "").toLowerCase();
}

/** 將圖鑑收藏同步到戰鬥 App 解鎖清單 */
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

/** 優先抽未擁有；若已全收集則隨機（可重複疊加 count） */
export function grantRandomBey(): {
  badge: BeyBadge;
  isNew: boolean;
  owned: OwnedBey;
} {
  const owned = loadBeyCollection();
  const ownedIds = new Set(owned.map((o) => o.id));
  const missing = BEY_BADGES.filter((b) => !ownedIds.has(b.id));
  const pool = missing.length ? missing : BEY_BADGES;
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
  };
}

export function getOwnedMap(): Record<string, OwnedBey> {
  const m: Record<string, OwnedBey> = {};
  for (const o of loadBeyCollection()) m[o.id] = o;
  return m;
}

export function resolveOwned(): { badge: BeyBadge; owned: OwnedBey | null }[] {
  const map = getOwnedMap();
  return BEY_BADGES.map((b) => ({ badge: b, owned: map[b.id] || null }));
}

export { getBeyById };
