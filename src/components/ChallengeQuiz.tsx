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

const APP_VERSION = "v2026.11.06c";

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
  const [bgOn, setBgOn] = useState(true);
  const [timeLimit, setTimeLimit] = useState(10);
  const [timeLeft, setTimeLeft] = useState(10);
  const [name, setName] = useState("");
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
    try { setBoard(await loadLeaderboardAsync()); } finally { setBoardLoading(false); }
  }, []);

  const playClick = () => { if (bgOn) sfxClick(); };
  const playCorrect = () => { if (bgOn) sfxCorrect(); };
  const playWrong = () => { if (bgOn) sfxWrong(); };
  const playComplete = () => { if (bgOn) sfxComplete(); };

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  const stopBg = useCallback(() => { bgRef.current?.stop(); bgRef.current = null; }, []);

  const finishCh = useCallback((finalScore: number, w: typeof wrongs) => {
    clearTimer();
    stopBg();
    playComplete();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
    const now = new Date();
    const entry: LeaderboardEntry = {
      id: generateId(),
      name: name.trim() || "匿名",
      topics: topics.join("、") || "全部",
      score: Math.round(finalScore * 10) / 10,
      date: now.toLocaleDateString("zh-HK"),
      time: now.toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" }),
      wrongCount: w.length,
    };
    void saveLeaderboardEntry(entry).then(() => refreshBoard());
    setUnlocks(applyChallengeToAdventure(topics, entry.score));
    try {
      const reward = grantRandomBey();
      setRewardBey({ badge: reward.badge, isNew: reward.isNew });
    } catch { setRewardBey(null); }
    setCScore(entry.score);
    setWrongs(w);
    setView("challengeResult");
  }, [clearTimer, stopBg, name, topics, refreshBoard]);

  const startChallenge = () => {
    const bank = getActiveQuizBank();
    let pool = topics.length ? bank.filter((q) => topics.includes(q.topic)) : bank;
    if (!pool.length) pool = bank;
    const picked = shuffle(pool).slice(0, Math.min(10, pool.length)).map(shuffleQuestion);
    setList(picked);
    setIndex(0);
    setSelected(null);
    setAnswered(false);
    setCScore(0);
    setWrongs([]);
    setCombo(0);
    setRewardBey(null);
    setUnlocks([]);
    setTimeLeft(timeLimit);
    setView("challengePlay");
    playClick();
    if (bgOn) bgRef.current = playChallengeBgm();
  };

  const advance = useCallback((sel: number | null, left: number, lst: QuizQuestion[], idx: number, sc: number, w: typeof wrongs) => {
    const q = lst[idx];
    if (!q) return;
    let ns = sc;
    let nw = w;
    if (sel !== null && sel === q.answer) {
      const gained = 10 + left * 0.1;
      ns = sc + gained;
      playCorrect();
      setScorePopup(gained);
      setTimeout(() => setScorePopup(0), 1000);
      setCombo((c) => {
        const next = c + 1;
        if (next >= 2) { setShowCombo(true); setTimeout(() => setShowCombo(false), 900); }
        return next;
      });
    } else {
      playWrong();
      setCombo(0);
      nw = [...w, { question: q.question, correct: q.options[q.answer], chosen: sel !== null ? q.options[sel] : "（逾時未答）" }];
    }
    if (idx + 1 >= lst.length) finishCh(ns, nw);
    else {
      setCScore(ns);
      setWrongs(nw);
      setIndex(idx + 1);
      setSelected(null);
      setAnswered(false);
      setTimeLeft(timeLimit);
    }
  }, [finishCh, timeLimit]);

  useEffect(() => {
    if (view !== "challengePlay" || answered) return;
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          setAnswered(true);
          advance(null, 0, list, index, cScore, wrongs);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return clearTimer;
  }, [view, index, answered, clearTimer, timeLimit, list, cScore, wrongs, advance]);

  if (view === "adventure") return <AdventureMap onBack={() => setView("menu")} />;
  if (view === "bankManage") return <QuizBankManager onBack={() => setView("menu")} />;
  if (view === "beyCollection") return <BeyCollection onBack={() => setView("menu")} />;

  if (view === "menu") {
    const beyStats = collectionStats();
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
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
        </div>
      </div>
    );
  }

  if (view === "challengeSetup") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-red-600">⚡ 挑戰模式</h2>
            <button onClick={() => setView("menu")} className="text-sm text-gray-500">← 返回</button>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的名字" className="w-full border-2 rounded-xl px-4 py-3" />
          <div className="flex flex-wrap gap-2">
            {ALL_TOPICS.map((t) => (
              <button key={t} type="button" onClick={() => setTopics((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])}
                className={`px-3 py-1.5 rounded-full text-sm border-2 ${topics.includes(t) ? "border-red-500 bg-red-50 text-red-800" : "border-gray-200 text-gray-500"}`}>{t}</button>
            ))}
          </div>
          <button type="button" onClick={startChallenge} className="w-full bg-red-500 text-white font-semibold py-4 rounded-2xl btn-press">開始挑戰（10題）</button>
        </div>
      </div>
    );
  }

  if (view === "challengePlay") {
    const q = list[index];
    if (!q) return null;
    const urgent = timeLeft <= 3;
    return (
      <div className={`min-h-screen p-4 transition-colors duration-300 ${urgent ? "bg-red-100" : "bg-amber-50"}`}>
        <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
        <ScorePopup points={scorePopup} show={scorePopup > 0} />
        <div key={index} className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-slide-up relative">
          {bgOn && <div className="absolute top-3 right-3 text-xs text-teal-500">♪ 音樂中</div>}
          <div className="flex justify-between text-sm items-center pr-14">
            <span>{name}</span>
            <div className="flex items-center gap-2">
              {combo >= 2 && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">🔥 {combo} 連擊</span>}
              <span className="font-bold text-orange-600">{cScore.toFixed(1)} 分</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{index + 1}/{list.length}</span>
            <span className={`text-3xl font-bold tabular-nums ${urgent ? "text-red-600" : "text-teal-600"}`}>{timeLeft}s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${urgent ? "bg-red-500" : "bg-teal-500"}`} style={{ width: `${(timeLeft / timeLimit) * 100}%` }} />
          </div>
          <div className="text-xs text-teal-600">{q.topic}</div>
          <div className="text-xl font-semibold">{q.question}</div>
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button key={i} type="button" disabled={answered} onClick={() => {
                if (answered) return;
                setAnswered(true); setSelected(i); clearTimer(); playClick();
                const t = timeLeft;
                setTimeout(() => advance(i, t, list, index, cScore, wrongs), 300);
              }} className={`w-full text-left px-4 py-3 rounded-xl border-2 transition btn-press ${
                answered && i === q.answer ? "border-green-500 bg-green-50" :
                answered && i === selected ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}>{String.fromCharCode(65 + i)}. {opt}</button>
            ))}
          </div>
          <button type="button" onClick={() => { clearTimer(); stopBg(); setView("menu"); }} className="w-full text-gray-400 text-sm">退出</button>
        </div>
      </div>
    );
  }

  if (view === "challengeResult") {
    return (
      <div className="min-h-screen p-4 bg-amber-50 relative overflow-hidden">
        <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
        <Confetti show={showConfetti} />
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-bounce-in">
          <div className="text-center text-5xl">🏆</div>
          <h2 className="text-2xl font-bold text-center text-red-600">挑戰完成！</h2>
          <div className="text-center text-5xl font-bold text-orange-500">{cScore.toFixed(1)}</div>
          <div className="text-center text-sm text-gray-500">{name}</div>
          {rewardBey && (
            <div className="bg-indigo-50 border-2 border-indigo-300 rounded-2xl p-4 text-center space-y-2">
              <div className="text-sm font-bold text-indigo-700">{rewardBey.isNew ? "✨ 新徽章解鎖！" : "🌀 又獲得一枚！"}</div>
              <div className="mx-auto w-24 h-24 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={rewardBey.badge.image} alt={rewardBey.badge.name} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <div className="text-sm font-medium text-indigo-900">{rewardBey.badge.name}</div>
              <button type="button" onClick={() => setView("beyCollection")} className="text-xs text-indigo-600 underline">查看圖鑑</button>
            </div>
          )}
          {unlocks.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-bold text-amber-700 text-center">🗺️ 地圖有新進展！</div>
              {unlocks.map((u) => (
                <div key={u.routeId + u.newIndex} className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-sm">
                  <div className="font-semibold text-amber-800">{u.stationEmoji} {u.routeName} · {u.stationTitle}</div>
                  <p className="text-gray-600 mt-1">{u.story}</p>
                </div>
              ))}
              <button type="button" onClick={() => setView("adventure")} className="w-full border-2 border-amber-400 text-amber-700 font-semibold py-2 rounded-xl text-sm">查看完整冒險地圖</button>
            </div>
          )}
          {wrongs.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <div className="font-medium text-red-600">錯題（{wrongs.length}）</div>
              {wrongs.map((w, i) => (
                <div key={i} className="bg-red-50 rounded-xl p-3 text-sm">
                  <div className="font-medium">{w.question}</div>
                  <div className="text-red-600">你的：{w.chosen}</div>
                  <div className="text-green-700">正確：{w.correct}</div>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => { setView("leaderboard"); void refreshBoard(); }} className="w-full bg-orange-500 text-white font-semibold py-3 rounded-2xl">龍虎榜 🏆</button>
          <button type="button" onClick={() => setView("challengeSetup")} className="w-full bg-red-500 text-white font-semibold py-3 rounded-2xl">再挑戰</button>
          <button type="button" onClick={() => setView("menu")} className="w-full bg-gray-200 font-semibold py-3 rounded-2xl">返回</button>
        </div>
      </div>
    );
  }

  if (view === "leaderboard") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-600">🏆 龍虎榜</h2>
            <button onClick={() => setView("menu")} className="text-sm text-gray-500">← 返回</button>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{cloudOn ? "☁️ 雲端同步（各裝置共用）" : "💾 本機儲存（各裝置獨立）"}</span>
            <button type="button" onClick={() => void refreshBoard()} className="text-teal-600 underline">重新整理</button>
          </div>
          <p className="text-xs text-gray-400 text-center">撳 ✕ 可刪除單筆；清空全部請到「題庫管理及設定」</p>
          {boardLoading ? (
            <div className="text-center text-gray-400 py-12">載入中…</div>
          ) : board.length === 0 ? (
            <div className="text-center text-gray-400 py-12">暫無紀錄</div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {board.map((e, i) => (
                <div key={e.id} className={`flex gap-3 p-3 rounded-xl items-center ${i === 0 ? "bg-yellow-50 border-2 border-yellow-300" : "bg-gray-50"}`}>
                  <div className={`w-8 text-center font-bold text-lg ${i === 0 ? "" : i < 3 ? "text-orange-500" : "text-gray-400"}`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{e.name}</div>
                    <div className="text-xs text-gray-500 truncate">{e.topics} · {e.date} {e.time}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-orange-600">{e.score}</div>
                    <div className="text-xs text-gray-400">錯{e.wrongCount}</div>
                  </div>
                  <button
                    type="button"
                    title="刪除此紀錄"
                    className="text-red-400 hover:text-red-600 text-xs shrink-0 px-1"
                    onClick={async () => {
                      if (!confirm(`刪除「${e.name}」${e.score} 分的紀錄？`)) return;
                      await deleteLeaderboardEntry(e.id);
                      playClick();
                      void refreshBoard();
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-amber-50 flex items-center justify-center">
      <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center space-y-4">
        <p className="text-lg">練習模式稍後恢復</p>
        <button type="button" onClick={() => setView("menu")} className="w-full bg-teal-500 text-white font-semibold py-3 rounded-2xl">返回選單</button>
      </div>
    </div>
  );
}
