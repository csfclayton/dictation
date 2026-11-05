"use client";

const KEY = "challenge_settings_v1";

export type ChallengeSettings = {
  soundOn: boolean;
  timeLimit: number;
};

const defaults: ChallengeSettings = {
  soundOn: true,
  timeLimit: 10,
};

export function loadChallengeSettings(): ChallengeSettings {
  if (typeof window === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const p = JSON.parse(raw);
    return {
      soundOn: typeof p.soundOn === "boolean" ? p.soundOn : true,
      timeLimit: Math.min(30, Math.max(5, Number(p.timeLimit) || 10)),
    };
  } catch {
    return { ...defaults };
  }
}

export function saveChallengeSettings(s: ChallengeSettings) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      soundOn: !!s.soundOn,
      timeLimit: Math.min(30, Math.max(5, Number(s.timeLimit) || 10)),
    })
  );
}
