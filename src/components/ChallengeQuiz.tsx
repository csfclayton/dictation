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
sfxUrgent,
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
import ChallengeRest from "@/components/ChallengeRest";
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
try {
audio.pause();
audio.currentTime = 0;
audio.src = "";
} catch {}
},
};
} catch {
return null;
}
}
const APP_VERSION = "v2026.11.19";
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
const [cScore, setCScore] = useState(0);
const [wrongs, setWrongs] = useState<{ question: string; correct: string; chosen: string }[]>([]);
const [answered, setAnswered] = useState(false);
const [board, setBoard] = useState<LeaderboardEntry[]>([]);
const [boardLoading, setBoardLoading] = useState(false);
const [name, setName] = useState("");
const [timeLimit, setTimeLimit] = useState(10);
const [timeLeft, setTimeLeft] = useState(10);
const [bgOn, setBgOn] = useState(true);
const [showConfetti, setShowConfetti] = useState(false);
const [scorePopup, setScorePopup] = useState(0);
const [combo, setCombo] = useState(0);
const [unlocks, setUnlocks] = useState<UnlockResult[]>([]);
const [rewardBey, setRewardBey] = useState<{ badge: BeyBadge; isNew: boolean } | null>(null);
const cloudOn = FIREBASE_ENABLED;
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
const bgRef = useRef<{ stop: () => void } | null>(null);
const lastChallengeIdsRef = useRef<string[]>([]);
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
clearTimer(); stopBg(); playComplete();
setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3500);
const now = new Date();
const entry: LeaderboardEntry = {
id: generateId(), name: name.trim() || "匿名", topics: topics.join("、") || "全部",
score: Math.round(finalScore * 10) / 10, date: now.toLocaleDateString("zh-HK"),
time: now.toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" }), wrongCount: w.length,
};
void saveLeaderboardEntry(entry).then(() => refreshBoard());
setUnlocks(applyChallengeToAdventure(topics, entry.score));
const totalQ = Math.max(1, list.length || 10);
const correct = totalQ - w.length;
const accuracy = correct / totalQ;
if (accuracy >= 0.8) {
try { const reward = grantRandomBey(); setRewardBey({ badge: reward.badge, isNew: reward.isNew }); }
catch { setRewardBey(null); }
} else { setRewardBey(null); }
setCScore(entry.score); setWrongs(w); setView("challengeResult");
}, [clearTimer, stopBg, name, topics, refreshBoard, list.length]);
const startChallenge = () => {
const bank = getActiveQuizBank();
let pool = topics.length ? bank.filter((q) => topics.includes(q.topic)) : bank;
if (!pool.length) pool = bank;
const prev = new Set(lastChallengeIdsRef.current);
const fresh = pool.filter((q) => !prev.has(q.id));
const source = fresh.length >= 10 ? fresh : pool;
const picked = shuffle(source).slice(0, Math.min(10, source.length)).map(shuffleQuestion);
lastChallengeIdsRef.current = picked.map((q) => q.id);
setList(picked); setIndex(0); setSelected(null); setAnswered(false); setCScore(0);
setWrongs([]); setCombo(0); setRewardBey(null); setUnlocks([]); setTimeLeft(timeLimit);
setView("challengePlay"); playClick(); if (bgOn) bgRef.current = playChallengeBgm();
};
const advance = useCallback((sel: number | null, left: number, lst: QuizQuestion[], idx: number, sc: number, w: typeof wrongs) => {
const q = lst[idx]; if (!q) return;
let ns = sc; let nw = w;
if (sel !== null && sel === q.answer) {
const gained = 10 + left * 0.1; ns = sc + gained; playCorrect();
setScorePopup(gained); setTimeout(() => setScorePopup(0), 1000); setCombo((c) => c + 1);
} else {
playWrong(); setCombo(0);
nw = [...w, { question: q.question, correct: q.options[q.answer], chosen: sel !== null ? q.options[sel] : "（逾時未答）" }];
}
if (idx + 1 >= lst.length) finishCh(ns, nw);
else { setCScore(ns); setWrongs(nw); setIndex(idx + 1); setSelected(null); setAnswered(false); setTimeLeft(timeLimit); }
}, [finishCh, timeLimit]);
useEffect(() => {
if (view !== "challengePlay" || answered) return;
clearTimer();
timerRef.current = setInterval(() => {
setTimeLeft((t) => {
if (t <= 1) { clearTimer(); setAnswered(true); advance(null, 0, list, index, cScore, wrongs); return 0; }
return t - 1;
});
}, 1000);
return clearTimer;
}, [view, index, answered, clearTimer, timeLimit, list, cScore, wrongs, advance]);
useEffect(() => {
if (view !== "challengePlay" || answered || !bgOn) return;
if (timeLeft >= 1 && timeLeft <= 5) sfxUrgent();
}, [timeLeft, view, answered, bgOn]);
if (view === "adventure") return <AdventureMap onBack={() => setView("menu")} />;
if (view === "bankManage") return <QuizBankManager onBack={() => setView("menu")} />;
if (view === "beyCollection") return <BeyCollection onBack={() => setView("menu")} />;
if (view === "menu") {
const beyStats = collectionStats();
return (
<div className="min-h-screen p-4 bg-amber-50">
<div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
<div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
<div className="flex justify-between items-center">
<h2 className="text-2xl font-bold text-teal-600">🧠 常識問答</h2>
<button onClick={onBack} className="text-gray-500 text-sm">← 主頁</button>
</div>
<p className="text-sm text-gray-500">題庫 {getActiveQuizBank().length} 題 · 答案隨機排列</p>
<button type="button" onClick={() => { playClick(); setView("practiceMenu"); }} className="w-full bg-teal-500 hover:bg-teal-600 text-white text-xl font-semibold py-4 rounded-2xl">📖 常識練習</button>
<button type="button" onClick={() => { playClick(); const s = loadChallengeSettings(); setBgOn(s.soundOn); setTimeLimit(s.timeLimit); setView("challengeSetup"); }} className="w-full bg-red-500 hover:bg-red-600 text-white text-xl font-semibold py-4 rounded-2xl">⚡ 挑戰模式</button>
<button type="button" onClick={() => { playClick(); setView("beyCollection"); }} className="w-full border-2 border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2">
<span>🌀 陀螺徽章圖鑑</span>
<span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">{beyStats.unique}/{beyStats.total}</span>
</button>
<a href="https://csfclayton.github.io/beyblade-x-arena/" onClick={() => playClick()} className="w-full border-2 border-cyan-500 bg-gradient-to-r from-cyan-50 to-indigo-50 text-cyan-800 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2">⚔️ 挑戰塔對戰</a>
<button type="button" onClick={() => { playClick(); setView("bankManage"); }} className="w-full border-2 border-teal-400 text-teal-700 font-semibold py-3 rounded-2xl">📝 題庫管理及設定</button>
<button type="button" onClick={() => { playClick(); setView("adventure"); }} className="w-full border-2 border-amber-400 text-amber-700 font-semibold py-3 rounded-2xl">🗺️ 冒險地圖</button>
<button type="button" onClick={() => { playClick(); setView("leaderboard"); void refreshBoard(); }} className="w-full border-2 border-orange-400 text-orange-600 font-semibold py-3 rounded-2xl">🏆 龍虎榜</button>
</div>
</div>
);
}
return (
<ChallengeRest
view={view} setView={setView} topics={topics} setTopics={setTopics} list={list} setList={setList}
index={index} setIndex={setIndex} selected={selected} setSelected={setSelected}
cScore={cScore} setCScore={setCScore} wrongs={wrongs} setWrongs={setWrongs}
answered={answered} setAnswered={setAnswered} board={board} boardLoading={boardLoading}
name={name} setName={setName} timeLimit={timeLimit} setTimeLimit={setTimeLimit}
timeLeft={timeLeft} setTimeLeft={setTimeLeft} bgOn={bgOn} setBgOn={setBgOn}
showConfetti={showConfetti} scorePopup={scorePopup} combo={combo} unlocks={unlocks}
rewardBey={rewardBey} cloudOn={cloudOn} playClick={playClick} playCorrect={playCorrect}
playWrong={playWrong} startChallenge={startChallenge} advance={advance}
clearTimer={clearTimer} stopBg={stopBg} refreshBoard={refreshBoard} APP_VERSION={APP_VERSION}
/>
);
}
