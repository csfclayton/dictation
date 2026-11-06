use client;

import { useState, useRef, useEffect, useCallback } from "react";
import { getActiveQuizBank } from "@/lib/quizBankStore";
import QuizBankManager from "@/components/QuizBankManager";
import type { QuizQuestion } from "@/data/quizTypes";
import {
  ALL_TOPICS,
  shuffle,
  shuffleQuestion,
  loadLeaderboardAsync,
  saveLeaderboardEntry,
  deleteLeaderboardEntry,
  sfxClick,
  sfxCorrect,
  sfxWrong,
  sfxComplete,
  type LeaderboardEntry,
} from "@/lib/quizHelpers";
import { Confetti, ScorePopup } from "@/components/GameEffects";
import { FIREBASE_ENABLED } from "@/lib/firebaseConfig";
import { loadChallengeSettings } from "@/lib/challengeSettings";
import AdventureMap from "@/components/AdventureMap";
import { applyChallengeToAdventure, type UnlockResult } from "@/lib/adventureProgress";
import { grantRandomBey, collectionStats } from "@/lib/beyCollection";
import type { BeyBadge } from "@/data/beyBadges";
import BeyCollection from "@/components/BeyCollection";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function playChallengeBgm(): { stop: () => void } | null {
  if (typeof window === "undefined") return null;
  try {
    const base = window.location.pathname.startsWith("/dictation") ? "/dictation" : "";
    const audio = new Audio(`${base}/Schoolyard_Quest.mp3`);
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = "auto";
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
    return {
      stop: () => {
        try { audio.pause(); audio.currentTime = 0; audio.src = ""; } catch {}
      },
    };
  } catch {
    return null;
  }
}

const APP_VERSION = "v2026.11.06h";

type View =
  | "menu" | "practiceMenu" | "practice" | "challengeSetup" | "challengePlay"
  | "challengeResult" | "leaderboard" | "bankManage" | "adventure" | "beyCollection";

export default function ChallengeQuiz({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("menu");
  const [topics, setTopics] = useState<string[]>([...ALL_TOPICS]);
  const [list, setList] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [cScore, setCScore] = useState(0);
  const [wrongs, setWrongs] = useState<{ question: string; correct: string; chosen: string }[]>([]);
  const [answered, setAnswered] = useState(false);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [settings, setSettings] = useState(() => loadChallengeSettings());
  const [showConfetti, setShowConfetti] = useState(false);
  const [scorePopup, setScorePopup] = useState<{ score: number; x: number; y: number } | null>(null);
  const [unlockResult, setUnlockResult] = useState<UnlockResult | null>(null);
  const [rewardBey, setRewardBey] = useState<{ badge: BeyBadge; isNew: boolean } | null>(null);
  const cloudOn = FIREBASE_ENABLED;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgRef = useRef<{ stop: () => void } | null>(null);
  /** 上一局挑戰題 id，下一局避免重複 */
  const lastChallengeIdsRef = useRef<string[]>([]);

  const refreshBoard = useCallback(async () => {
    setBoardLoading(true);
    try {
      const entries = await loadLeaderboardAsync();
      setBoard(entries);
    } finally {
      setBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "leaderboard") void refreshBoard();
  }, [view, refreshBoard]);

  const playClick = () => { if (settings.soundOn) sfxClick(); };
  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const stopBg = () => { bgRef.current?.stop(); bgRef.current = null; };

  // PLACEHOLDER_REST_OF_FILE - will complete in follow-up if this succeeds
  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-amber-50 to-orange-50 relative">
      <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
      <div className="max-w-md mx-auto space-y-4 pt-8 text-center">
        <h1 className="text-2xl font-bold text-orange-700">📚 默書挑戰</h1>
        <p className="text-sm text-gray-500">正在修復部署中…請稍後重新整理</p>
        <button type="button" onClick={onBack} className="w-full text-gray-500 text-sm py-2">← 返回主選單</button>
      </div>
    </div>
  );
}
