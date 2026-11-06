"use client";

import {
  ADVENTURE_ROUTES,
  type AdventureRouteId,
} from "@/data/adventureMap";

const KEY = "adventure_progress_v1";

export type AdventureProgress = {
  hongkong: number;
  science: number;
  clears: number;
};

const defaults: AdventureProgress = {
  hongkong: 0,
  science: 0,
  clears: 0,
};

export function loadAdventureProgress(): AdventureProgress {
  if (typeof window === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const p = JSON.parse(raw);
    return {
      hongkong: Math.max(0, Number(p.hongkong) || 0),
      science: Math.max(0, Number(p.science) || 0),
      clears: Math.max(0, Number(p.clears) || 0),
    };
  } catch {
    return { ...defaults };
  }
}

export function saveAdventureProgress(p: AdventureProgress) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export type UnlockResult = {
  routeId: AdventureRouteId;
  routeName: string;
  newIndex: number;
  stationTitle: string;
  stationEmoji: string;
  story: string;
};

/**
 * 挑戰完成後推進地圖。
 * 條件：分數 >= 40，且所選主題對應路線。
 * 每次有效挑戰每條符合路線最多推進 1 站。
 */
export function applyChallengeToAdventure(
  topics: string[],
  score: number
): UnlockResult[] {
  if (score < 40) return [];

  const progress = loadAdventureProgress();
  progress.clears += 1;
  const unlocked: UnlockResult[] = [];

  for (const route of ADVENTURE_ROUTES) {
    const match = topics.some((t) => route.topics.includes(t));
    if (!match) continue;

    const key = route.id as AdventureRouteId;
    const cur = progress[key];
    const maxIdx = route.stations.length - 1;
    if (cur >= maxIdx) continue;

    const next = cur + 1;
    progress[key] = next;
    const station = route.stations[next];
    unlocked.push({
      routeId: route.id,
      routeName: route.name,
      newIndex: next,
      stationTitle: station.title,
      stationEmoji: station.emoji,
      story: station.story,
    });
  }

  saveAdventureProgress(progress);
  return unlocked;
}

export function maxStationIndex(routeId: AdventureRouteId): number {
  const r = ADVENTURE_ROUTES.find((x) => x.id === routeId);
  return r ? r.stations.length - 1 : 0;
}
