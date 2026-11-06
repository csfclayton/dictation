"use client";

export type LeaderboardEntry = {
  id: string;
  name: string;
  topics: string;
  score: number;
  date: string;
  time: string;
  wrongCount: number;
};

export const LEADERBOARD_KEY = "quiz_leaderboard_v1";
export const ALL_TOPICS = ["健康", "科學", "氣候", "地理", "香港"] as const;

export type QuizQuestion = {
  id: string;
  topic: string;
  question: string;
  options: string[];
  answer: number;
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffleQuestion(q: QuizQuestion): QuizQuestion {
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    answer: order.indexOf(q.answer),
  };
}

export function loadLeaderboardLocal(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadLeaderboard(): LeaderboardEntry[] {
  return loadLeaderboardLocal();
}

export function saveLeaderboardLocal(entry: LeaderboardEntry) {
  const list = loadLeaderboardLocal();
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list.slice(0, 50)));
}

export function clearLeaderboardLocal() {
  localStorage.removeItem(LEADERBOARD_KEY);
}

export function deleteLeaderboardEntryLocal(id: string): boolean {
  const list = loadLeaderboardLocal();
  const next = list.filter((e) => e.id !== id);
  if (next.length === list.length) return false;
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
  return true;
}

export async function deleteLeaderboardEntry(id: string): Promise<{ local: boolean; cloud: boolean }> {
  const local = deleteLeaderboardEntryLocal(id);
  let cloud = false;
  try {
    const { isCloudSyncEnabled, cloudDeleteLeaderboardEntry } = await import("@/lib/firebase");
    if (isCloudSyncEnabled()) {
      cloud = await cloudDeleteLeaderboardEntry(id);
    }
  } catch (e) {
    console.warn("cloud delete entry failed", e);
  }
  return { local, cloud };
}

export async function loadLeaderboardAsync(): Promise<LeaderboardEntry[]> {
  try {
    const { isCloudSyncEnabled, cloudLoadLeaderboard } = await import("@/lib/firebase");
    if (isCloudSyncEnabled()) {
      const cloud = await cloudLoadLeaderboard();
      if (cloud) {
        try {
          localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(cloud.slice(0, 50)));
        } catch {}
        return cloud;
      }
    }
  } catch (e) {
    console.warn("cloud load fallback", e);
  }
  return loadLeaderboardLocal();
}

export async function saveLeaderboardEntry(entry: LeaderboardEntry): Promise<void> {
  saveLeaderboardLocal(entry);
  try {
    const { isCloudSyncEnabled, cloudSaveLeaderboardEntry } = await import("@/lib/firebase");
    if (isCloudSyncEnabled()) {
      await cloudSaveLeaderboardEntry(entry);
    }
  } catch (e) {
    console.warn("cloud save failed, kept local", e);
  }
}

export async function clearLeaderboardAll(): Promise<{ cloud: boolean; local: boolean }> {
  clearLeaderboardLocal();
  let cloud = false;
  try {
    const { isCloudSyncEnabled, cloudClearLeaderboard } = await import("@/lib/firebase");
    if (isCloudSyncEnabled()) {
      cloud = await cloudClearLeaderboard();
    }
  } catch (e) {
    console.warn("cloud clear failed", e);
  }
  return { cloud, local: true };
}

let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.08) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
}

export function sfxClick() {
  playTone(880, 0.06, "square", 0.05);
}
export function sfxCorrect() {
  playTone(523, 0.1, "sine", 0.08);
  setTimeout(() => playTone(659, 0.12, "sine", 0.08), 80);
}
export function sfxWrong() {
  playTone(200, 0.2, "sawtooth", 0.06);
}
export function sfxUrgent() {
  playTone(1200, 0.1, "square", 0.1);
}
export function sfxComplete() {
  [523, 659, 784, 1046].forEach((f, i) =>
    setTimeout(() => playTone(f, 0.15, "sine", 0.09), i * 100)
  );
}

export function createBgMusic(): { stop: () => void } | null {
  const ctx = getAudioCtx();
  if (!ctx) return null;
  if (ctx.state === "suspended") void ctx.resume();

  const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66];
  let noteIndex = 0;
  let stopped = false;
  const master = ctx.createGain();
  master.gain.value = 0.04;
  master.connect(ctx.destination);

  const playNote = () => {
    if (stopped) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = notes[noteIndex % notes.length];
    noteIndex++;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(master);
    const now = ctx.currentTime;
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.start(now);
    osc.stop(now + 0.6);
  };

  playNote();
  const interval = setInterval(playNote, 480);

  const pad = ctx.createOscillator();
  const padGain = ctx.createGain();
  pad.type = "sine";
  pad.frequency.value = 130.81;
  padGain.gain.value = 0.012;
  pad.connect(padGain);
  padGain.connect(master);
  pad.start();

  return {
    stop: () => {
      stopped = true;
      clearInterval(interval);
      try {
        pad.stop();
      } catch {}
      try {
        master.disconnect();
      } catch {}
    },
  };
}
