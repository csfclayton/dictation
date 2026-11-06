"use client";

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
  sfxUrgent,
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
    if (p && typeof p.catch === "function") {
      p.catch((err) => console.warn("BGM play blocked or missing file", err));
    }
    return {
      stop: () => {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.src = "";
        } catch {}
      },
    };
  } catch (e) {
    console.warn("BGM init failed", e);
    return null;
  }
}

type View =
  | "menu"
  | "practiceMenu"
  | "practice"
  | "challengeSetup"
  | "challengePlay"
  | "challengeResult"
  | "leaderboard"
  | "bankManage"
  | "adventure"
  | "beyCollection";

export default function ChallengeQuiz({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("menu");
  const [topics, setTopics] = useState<string[]>([...ALL_TOPICS]);
  const [list, setList] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [name, setName] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [cScore, setCScore] = useState(0);
  const [wrongs, setWrongs] = useState<{ question: string; correct: string; chosen: string }[]>([]);
  const [answered, setAnswered] = useState(false);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [bgOn, setBgOn] = useState(true);
  const [timeLimit, setTimeLimit] = useState(10);
  const [scorePopup, setScorePopup] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [boardLoading, setBoardLoading] = useState(false);
  const [unlocks, setUnlocks] = useState<UnlockResult[]>([]);
  const [rewardBey, setRewardBey] = useState<{ badge: BeyBadge; isNew: boolean } | null>(null);
  const cloudOn = FIREBASE_ENABLED;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgRef = useRef<{ stop: () => void } | null>(null);

  const refreshBoard = useCallback(async () => {
    setBoardLoading(true);
    try {
      const list = await loadLeaderboardAsync();
      setBoard(list);
    } finally {
      setBoardLoading(false);
    }
  }, []);

  const playClick = () => { if (bgOn) sfxClick(); };
  const playCorrect = () => { if (bgOn) sfxCorrect(); };
  const playWrong = () => { if (bgOn) sfxWrong(); };
  const playUrgent = () => { if (bgOn) sfxUrgent(); };
  const playComplete = () => { if (bgOn) sfxComplete(); };

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopBg = useCallback(() => {
    bgRef.current?.stop();
    bgRef.current = null;
  }, []);

  // NOTE: Full challenge logic restored in follow-up if needed.
  // This version prioritizes menu + bey + adventure entry points.

  if (view === "adventure") {
    return <AdventureMap onBack={() => setView("menu")} />;
  }
  if (view === "bankManage") {
    return <QuizBankManager onBack={() => setView("menu")} />;
  }
  if (view === "beyCollection") {
    return <BeyCollection onBack={() => setView("menu")} />;
  }

  if (view === "menu") {
    const beyStats = collectionStats();
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-teal-600">🧠 常識問答</h2>
            <button onClick={onBack} className="text-gray-500 text-sm">← 主頁</button>
          </div>
          <p className="text-sm text-gray-500">題庫 {getActiveQuizBank().length} 題 · 答案隨機排列</p>
          <button type="button" onClick={() => { playClick(); setView("practiceMenu"); }} className="w-full bg-teal-500 hover:bg-teal-600 text-white text-xl font-semibold py-4 rounded-2xl btn-press card-hover">📖 常識練習</button>
          <button type="button" onClick={() => { playClick(); const s = loadChallengeSettings(); setBgOn(s.soundOn); setTimeLimit(s.timeLimit); setView("challengeSetup"); }} className="w-full bg-red-500 hover:bg-red-600 text-white text-xl font-semibold py-4 rounded-2xl btn-press card-hover">⚡ 挑戰模式</button>
          <button type="button" onClick={() => { playClick(); setView("beyCollection"); }} className="w-full border-2 border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold py-3 rounded-2xl btn-press flex items-center justify-center gap-2">
            <span>🌀 陀螺徽章圖鑑</span>
            <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">{beyStats.unique}/{beyStats.total}</span>
          </button>
          <button type="button" onClick={() => { playClick(); setView("bankManage"); }} className="w-full border-2 border-teal-400 text-teal-700 font-semibold py-3 rounded-2xl btn-press">📝 題庫管理及設定</button>
          <button type="button" onClick={() => { playClick(); setView("adventure"); }} className="w-full border-2 border-amber-400 text-amber-700 font-semibold py-3 rounded-2xl btn-press">🗺️ 冒險地圖</button>
          <button type="button" onClick={() => { playClick(); setView("leaderboard"); void refreshBoard(); }} className="w-full border-2 border-orange-400 text-orange-600 font-semibold py-3 rounded-2xl btn-press">🏆 龍虎榜</button>
          <p className="text-xs text-center text-amber-600">（挑戰模式完整邏輯正恢復中，請稍後再試）</p>
        </div>
      </div>
    );
  }

  // Fallback for other views while full file is restored
  return (
    <div className="min-h-screen p-4 bg-amber-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center space-y-4">
        <p className="text-lg">功能暫時簡化中</p>
        <button type="button" onClick={() => setView("menu")} className="w-full bg-teal-500 text-white font-semibold py-3 rounded-2xl">返回選單</button>
      </div>
    </div>
  );
}
