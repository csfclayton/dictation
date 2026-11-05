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

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLeaderboardEntry(entry: LeaderboardEntry) {
  const list = loadLeaderboard();
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list.slice(0, 50)));
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
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 220;
  gain.gain.value = 0.015;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  return {
    stop: () => {
      try {
        osc.stop();
      } catch {}
    },
  };
}
