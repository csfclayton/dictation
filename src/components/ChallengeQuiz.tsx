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

  const finishChallenge = (finalScore: number, finalWrongs: typeof wrongs) => {
    clearTimer();
    stopBg();
    if (settings.soundOn) sfxComplete();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    const total = list.length || 1;
    const accuracy = finalScore / total;
    if (accuracy >= 0.8) {
      try {
        const reward = grantRandomBey();
        setRewardBey({ badge: reward.badge, isNew: reward.isNew });
      } catch {}
    } else {
      setRewardBey(null);
    }
    try {
      const ur = applyChallengeToAdventure(finalScore, total);
      setUnlockResult(ur);
    } catch { setUnlockResult(null); }
    setCScore(finalScore);
    setWrongs(finalWrongs);
    setView("challengeResult");
  };

  const startChallenge = () => {
    playClick();
    const bank = getActiveQuizBank();
    let pool = topics.length ? bank.filter((q) => topics.includes(q.topic)) : bank;
    if (!pool.length) pool = bank;
    const prev = new Set(lastChallengeIdsRef.current);
    const fresh = pool.filter((q) => !prev.has(q.id));
    // 夠 10 題就避開上一局；否則仍用完整 pool
    const source = fresh.length >= 10 ? fresh : pool;
    const picked = shuffle(source).slice(0, Math.min(10, source.length)).map(shuffleQuestion);
    lastChallengeIdsRef.current = picked.map((q) => q.id);
    setList(picked);
    setIndex(0);
    setSelected(null);
    setCScore(0);
    setWrongs([]);
    setAnswered(false);
    setRewardBey(null);
    setTimeLeft(settings.timeLimit);
    setView("challengePlay");
    stopBg();
    bgRef.current = playChallengeBgm();
  };

  useEffect(() => {
    if (view !== "challengePlay" || answered) return;
    clearTimer();
    setTimeLeft(settings.timeLimit);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          // auto wrong
          const q = list[index];
          if (q) {
            const correct = q.options[q.answer];
            setWrongs((w) => [...w, { question: q.question, correct, chosen: "（超時）" }]);
            if (settings.soundOn) sfxWrong();
            setAnswered(true);
            setTimeout(() => {
              if (index + 1 >= list.length) {
                finishChallenge(cScore, [...wrongs, { question: q.question, correct, chosen: "（超時）" }]);
              } else {
                setIndex((i) => i + 1);
                setSelected(null);
                setAnswered(false);
              }
            }, 800);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, index, answered, list, settings.timeLimit]);

  const choose = (i: number) => {
    if (answered) return;
    clearTimer();
    setSelected(i);
    setAnswered(true);
    const q = list[index]!;
    const correct = q.options[q.answer];
    if (i === q.answer) {
      if (settings.soundOn) sfxCorrect();
      setCScore((s) => s + 1);
      setScorePopup({ score: 1, x: 50, y: 40 });
      setTimeout(() => setScorePopup(null), 600);
    } else {
      if (settings.soundOn) sfxWrong();
      setWrongs((w) => [...w, { question: q.question, correct, chosen: q.options[i] }]);
    }
    setTimeout(() => {
      if (index + 1 >= list.length) {
        const finalScore = i === q.answer ? cScore + 1 : cScore;
        const finalWrongs =
          i === q.answer
            ? wrongs
            : [...wrongs, { question: q.question, correct, chosen: q.options[i] }];
        finishChallenge(finalScore, finalWrongs);
      } else {
        setIndex((x) => x + 1);
        setSelected(null);
        setAnswered(false);
      }
    }, 700);
  };

  if (view === "beyCollection") return <BeyCollection onBack={() => setView("menu")} />;
  if (view === "adventure") return <AdventureMap onBack={() => setView("menu")} />;
  if (view === "bankManage") return <QuizBankManager onBack={() => setView("menu")} />;

  if (view === "menu") {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-b from-amber-50 to-orange-50 relative">
        <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
        <div className="max-w-md mx-auto space-y-4 pt-8">
          <h1 className="text-2xl font-bold text-center text-orange-700">📚 默書挑戰</h1>
          <button type="button" onClick={() => { playClick(); setView("challengeSetup"); }} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-lg">🎯 挑戰模式</button>
          <button type="button" onClick={() => { playClick(); setView("practiceMenu"); }} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-4 rounded-2xl text-lg">✏️ 練習模式</button>
          <button type="button" onClick={() => { playClick(); setView("leaderboard"); }} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-2xl text-lg">🏆 龍虎榜</button>
          <button type="button" onClick={() => { playClick(); setView("beyCollection"); }} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl text-lg">🌀 陀螺徽章圖鑑</button>
          <button type="button" onClick={() => { playClick(); setView("adventure"); }} className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 rounded-2xl text-lg">🗺️ 冒險地圖</button>
          <button type="button" onClick={() => { playClick(); setView("bankManage"); }} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-2xl">⚙️ 題庫管理及設定</button>
          <button type="button" onClick={onBack} className="w-full text-gray-500 text-sm py-2">← 返回主選單</button>
        </div>
      </div>
    );
  }

  if (view === "challengeSetup") {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-b from-amber-50 to-orange-50 relative">
        <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
        <div className="max-w-md mx-auto space-y-4 pt-6">
          <h2 className="text-xl font-bold text-center">挑戰設定</h2>
          <div className="bg-white rounded-2xl p-4 space-y-2 shadow">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold">選擇課題</span>
              <div className="flex gap-3">
              <button type="button" onClick={() => { playClick(); setTopics([...ALL_TOPICS]); }} className="text-teal-600 underline">全選</button>
              <button type="button" onClick={() => { playClick(); setTopics([]); }} className="text-gray-500 underline">取消全選</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_TOPICS.map((t) => (
                <button key={t} type="button" onClick={() => { playClick(); setTopics((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]); }} className={`px-3 py-1.5 rounded-full text-sm border ${topics.includes(t) ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-700 border-gray-300"}`}>{t}</button>
              ))}
            </div>
          </div>
          <p className="text-xs text-center text-gray-400">答對率達 80% 或以上可抽取陀螺徽章</p>
          <button type="button" onClick={startChallenge} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl text-lg">開始挑戰</button>
          <button type="button" onClick={() => setView("menu")} className="w-full text-gray-500 text-sm">← 返回</button>
        </div>
      </div>
    );
  }

  // NOTE: truncated for size - full file continues in next push if needed
  return <div>loading...</div>;
}
