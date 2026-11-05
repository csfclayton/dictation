"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { quizBank } from "@/data/quizBank";
import type { QuizQuestion } from "@/data/quizTypes";
import {
  ALL_TOPICS,
  shuffle,
  shuffleQuestion,
  loadLeaderboardAsync,
  saveLeaderboardEntry,
  clearLeaderboardAll,
  sfxClick,
  sfxCorrect,
  sfxWrong,
  sfxUrgent,
  sfxComplete,
  type LeaderboardEntry,
} from "@/lib/quizHelpers";
import { Confetti, ScorePopup } from "@/components/GameEffects";
import { FIREBASE_ENABLED } from "@/lib/firebaseConfig";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** 挑戰背景音樂（public/Schoolyard_Quest.mp3） */
function playChallengeBgm(): { stop: () => void } | null {
  if (typeof window === "undefined") return null;
  try {
    const base =
      window.location.pathname.startsWith("/dictation")
        ? "/dictation"
        : "";
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
  | "leaderboard";

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
  const [showSettings, setShowSettings] = useState(false);
  const [scorePopup, setScorePopup] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [boardLoading, setBoardLoading] = useState(false);
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

  const playClick = () => {
    if (bgOn) sfxClick();
  };
  const playCorrect = () => {
    if (bgOn) sfxCorrect();
  };
  const playWrong = () => {
    if (bgOn) sfxWrong();
  };
  const playUrgent = () => {
    if (bgOn) sfxUrgent();
  };
  const playComplete = () => {
    if (bgOn) sfxComplete();
  };

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

  useEffect(
    () => () => {
      clearTimer();
      stopBg();
    },
    [clearTimer, stopBg]
  );

  const pool = () => {
    const f = quizBank.filter((q) => topics.includes(q.topic));
    return f.length ? f : quizBank;
  };

  const startPractice = (n: number) => {
    const picked = shuffle(pool())
      .slice(0, Math.min(n, pool().length))
      .map(shuffleQuestion);
    setList(picked);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
    setFinished(false);
    setView("practice");
    playClick();
  };

  const startChallenge = () => {
    if (!name.trim()) return alert("請先輸入名字");
    if (!topics.length) return alert("請至少選擇一個主題");
    const picked = shuffle(pool())
      .slice(0, Math.min(10, pool().length))
      .map(shuffleQuestion);
    if (!picked.length) return alert("冇題目");
    setList(picked);
    setIndex(0);
    setCScore(0);
    setWrongs([]);
    setAnswered(false);
    setSelected(null);
    setCombo(0);
    setShowCombo(false);
    setTimeLeft(timeLimit);
    setView("challengePlay");
    playClick();
    if (bgOn) bgRef.current = playChallengeBgm();
  };

  const finishCh = useCallback(
    (finalScore: number, w: { question: string; correct: string; chosen: string }[]) => {
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
      setCScore(entry.score);
      setWrongs(w);
      setView("challengeResult");
    },
    [clearTimer, stopBg, name, topics, bgOn, refreshBoard]
  );

  const advance = useCallback(
    (
      sel: number | null,
      left: number,
      lst: QuizQuestion[],
      idx: number,
      sc: number,
      w: { question: string; correct: string; chosen: string }[]
    ) => {
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
          if (next >= 2) {
            setShowCombo(true);
            setTimeout(() => setShowCombo(false), 900);
          }
          return next;
        });
      } else {
        playWrong();
        setCombo(0);
        nw = [
          ...w,
          {
            question: q.question,
            correct: q.options[q.answer],
            chosen: sel !== null ? q.options[sel] : "（逾時未答）",
          },
        ];
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
    },
    [finishCh, timeLimit, bgOn]
  );

  useEffect(() => {
    if (view !== "challengePlay" || answered) return;
    clearTimer();
    setTimeLeft(timeLimit);
    timerRef.current = setInterval(() => setTimeLeft((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearTimer();
  }, [view, index, answered, clearTimer, timeLimit]);

  useEffect(() => {
    if (view !== "challengePlay" || answered) return;
    if (timeLeft <= 3 && timeLeft >= 1) playUrgent();
    if (timeLeft === 0) {
      setAnswered(true);
      clearTimer();
      advance(null, 0, list, index, cScore, wrongs);
    }
  }, [timeLeft]);

  const topicPicker = (color: string) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">選擇主題</span>
        <span className="text-xs space-x-2">
          <button type="button" onClick={() => { playClick(); setTopics([...ALL_TOPICS]); }} className="text-teal-600 underline">全選</button>
          <button type="button" onClick={() => { playClick(); setTopics([]); }} className="text-gray-500 underline">取消全選</button>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_TOPICS.map((t) => (
          <button key={t} type="button" onClick={() => { playClick(); setTopics((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t])); }}
            className={`px-3 py-1.5 rounded-full text-sm border-2 ${topics.includes(t) ? color : "border-gray-200 text-gray-500"}`}>{t}</button>
        ))}
      </div>
    </div>
  );

  if (view === "menu") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-teal-600">🧠 常識問答</h2>
            <button onClick={onBack} className="text-gray-500 text-sm">← 主頁</button>
          </div>
          <p className="text-sm text-gray-500">題庫 {quizBank.length} 題 · 答案隨機排列</p>
          <button type="button" onClick={() => { playClick(); setView("practiceMenu"); }} className="w-full bg-teal-500 hover:bg-teal-600 text-white text-xl font-semibold py-4 rounded-2xl btn-press card-hover">📖 常識練習</button>
          <button type="button" onClick={() => { playClick(); setView("challengeSetup"); }} className="w-full bg-red-500 hover:bg-red-600 text-white text-xl font-semibold py-4 rounded-2xl btn-press card-hover">⚡ 挑戰模式</button>
          <button type="button" onClick={() => { playClick(); setView("leaderboard"); void refreshBoard(); }} className="w-full border-2 border-orange-400 text-orange-600 font-semibold py-3 rounded-2xl btn-press">🏆 龍虎榜</button>
        </div>
      </div>
    );
  }

  if (view === "practiceMenu") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-slide-up">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-teal-600">📖 常識練習</h2>
            <button onClick={() => setView("menu")} className="text-gray-500 text-sm">← 返回</button>
          </div>
          {topicPicker("border-teal-500 bg-teal-50 text-teal-800")}
          <button type="button" onClick={() => startPractice(5)} className="w-full bg-teal-500 text-white font-semibold py-3 rounded-2xl btn-press card-hover">5 題練習</button>
          <button type="button" onClick={() => startPractice(10)} className="w-full bg-teal-600 text-white font-semibold py-3 rounded-2xl btn-press">10 題練習</button>
          <button type="button" onClick={() => startPractice(20)} className="w-full bg-teal-700 text-white font-semibold py-3 rounded-2xl btn-press">20 題練習</button>
          <button type="button" onClick={() => startPractice(9999)} className="w-full border-2 border-teal-500 text-teal-700 font-semibold py-3 rounded-2xl btn-press">所選主題全部</button>
        </div>
      </div>
    );
  }

  if (view === "practice") {
    if (finished) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50 relative overflow-hidden">
          <Confetti show={true} />
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-4 anim-bounce-in">
            <div className="text-5xl anim-star">⭐</div>
            <h2 className="text-2xl font-bold text-teal-600">完成！</h2>
            <div className="text-4xl font-bold text-orange-500 anim-pop">{score} / {list.length}</div>
            <button type="button" onClick={() => startPractice(list.length)} className="w-full bg-teal-500 text-white font-semibold py-3 rounded-2xl btn-press">再練一次</button>
            <button type="button" onClick={() => setView("practiceMenu")} className="w-full bg-gray-200 font-semibold py-3 rounded-2xl btn-press">返回</button>
          </div>
        </div>
      );
    }
    const q = list[index];
    if (!q) return null;
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div key={index} className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-slide-up">
          <div className="flex justify-between text-sm text-gray-600">
            <button type="button" onClick={() => setView("practiceMenu")}>← 退出</button>
            <span>{index + 1}/{list.length}　分數 {score}</span>
          </div>
          <div className="text-xs text-teal-600">{q.topic}</div>
          <div className="text-xl font-semibold">{q.question}</div>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              let cls = "w-full text-left px-4 py-3 rounded-xl border-2 btn-press ";
              if (showAnswer) {
                if (i === q.answer) cls += "border-green-500 bg-green-50 option-flash-correct";
                else if (i === selected) cls += "border-red-400 bg-red-50 option-flash-wrong";
                else cls += "border-gray-200 text-gray-400";
              } else cls += selected === i ? "border-teal-500 bg-teal-50" : "border-gray-200";
              return (
                <button key={i} type="button" disabled={showAnswer} onClick={() => { playClick(); setSelected(i); }} className={cls}>
                  {String.fromCharCode(65 + i)}. {opt}
                </button>
              );
            })}
          </div>
          {!showAnswer ? (
            <button type="button" disabled={selected === null} onClick={() => {
              if (selected === q.answer) { setScore((s) => s + 1); playCorrect(); } else playWrong();
              setShowAnswer(true);
            }} className="w-full bg-teal-500 disabled:bg-gray-300 text-white font-semibold py-3 rounded-2xl btn-press">提交</button>
          ) : (
            <button type="button" onClick={() => {
              if (index + 1 >= list.length) setFinished(true);
              else { setIndex((i) => i + 1); setSelected(null); setShowAnswer(false); }
            }} className="w-full bg-orange-500 text-white font-semibold py-3 rounded-2xl btn-press">{index + 1 >= list.length ? "查看成績" : "下一題"}</button>
          )}
        </div>
      </div>
    );
  }

  if (view === "challengeSetup") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-slide-up">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-red-600">⚡ 挑戰模式</h2>
            <button onClick={() => setView("menu")} className="text-sm text-gray-500">← 返回</button>
          </div>
          <p className="text-sm text-gray-600">10 題計時挑戰 · 答對 10 分 + 剩餘秒×0.1</p>
          <p className={`text-xs ${cloudOn ? "text-teal-600" : "text-gray-400"}`}>
            {cloudOn ? "☁️ 成績會同步到雲端龍虎榜" : "💾 未設定 Firebase：成績只存本機（見 FIREBASE_SETUP.md）"}
          </p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="輸入名字" maxLength={20} className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:border-red-400 outline-none" />
          {topicPicker("border-red-400 bg-red-50")}
          <div className="border-2 border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">⚙️ 設定</span>
              <button type="button" onClick={() => setShowSettings((s) => !s)} className="text-sm text-teal-600">{showSettings ? "收起" : "展開"}</button>
            </div>
            {showSettings && (
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <label className="flex items-center justify-between text-sm">
                  <span>音效與背景音樂</span>
                  <button type="button" onClick={() => setBgOn((v) => !v)} className={`px-4 py-1.5 rounded-full font-medium ${bgOn ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"}`}>{bgOn ? "開" : "關"}</button>
                </label>
                <p className="text-xs text-gray-400">挑戰時會播放背景音樂 Schoolyard Quest（可在設定關閉）</p>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between"><span>每題答題時間</span><span className="font-bold text-red-600">{timeLimit} 秒</span></div>
                  <input type="range" min={5} max={30} step={1} value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))} className="w-full" />
                  <div className="flex justify-between text-xs text-gray-400"><span>5秒</span><span>30秒</span></div>
                </div>
                <button type="button" onClick={async () => {
                  if (!confirm(cloudOn ? "確定清除雲端＋本機所有龍虎榜成績？" : "確定清除本機龍虎榜成績？")) return;
                  const r = await clearLeaderboardAll();
                  setBoard([]);
                  alert(r.cloud ? "已清除雲端及本機龍虎榜" : "已清除本機龍虎榜" + (cloudOn ? "（雲端清除失敗，請檢查 Firebase 規則）" : ""));
                }} className="w-full border border-red-300 text-red-500 text-sm font-medium py-2 rounded-xl">清除龍虎榜成績</button>
              </div>
            )}
          </div>
          <button type="button" onClick={startChallenge} className="w-full bg-red-500 text-white text-xl font-semibold py-4 rounded-2xl btn-press">開始挑戰！</button>
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
        <ScorePopup points={scorePopup} show={scorePopup > 0} />
        <div key={index} className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-slide-up relative">
          {bgOn && (
            <div className="absolute top-3 right-3 text-xs text-teal-500 anim-soft-pulse">♪ 音樂中</div>
          )}
          <div className="flex justify-between text-sm items-center pr-14">
            <span>{name}</span>
            <div className="flex items-center gap-2">
              {combo >= 2 && (
                <span className={`text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full ${showCombo ? "anim-combo" : "anim-streak"}`}>
                  🔥 {combo} 連擊
                </span>
              )}
              <span className="font-bold text-orange-600 anim-soft-pulse">{cScore.toFixed(1)} 分</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{index + 1}/{list.length}</span>
            <span className={`text-3xl font-bold tabular-nums ${urgent ? "text-red-600 timer-urgent" : "text-teal-600"}`}>{timeLeft}s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full progress-bar-fill ${urgent ? "bg-red-500" : "bg-teal-500"}`} style={{ width: `${(timeLeft / timeLimit) * 100}%` }} />
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
                answered && i === q.answer ? "border-green-500 bg-green-50 option-flash-correct" :
                answered && i === selected ? "border-red-400 bg-red-50 option-flash-wrong" : "border-gray-200"
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
        <Confetti show={showConfetti} />
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-bounce-in">
          <div className="text-center text-5xl anim-star">🏆</div>
          <h2 className="text-2xl font-bold text-center text-red-600">挑戰完成！</h2>
          <div className="text-center text-5xl font-bold text-orange-500 anim-pop">{cScore.toFixed(1)}</div>
          <div className="text-center text-sm text-gray-500">{name}</div>
          {wrongs.length ? (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              <div className="font-medium text-red-600">錯題（{wrongs.length}）</div>
              {wrongs.map((w, i) => (
                <div key={i} className="bg-red-50 rounded-xl p-3 text-sm anim-slide-up">
                  <div className="font-medium">{w.question}</div>
                  <div className="text-red-600">你的：{w.chosen}</div>
                  <div className="text-green-700">正確：{w.correct}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-green-600 py-4 anim-bounce-in">全部答對！🎉</div>
          )}
          <button type="button" onClick={() => { setView("leaderboard"); void refreshBoard(); }} className="w-full bg-orange-500 text-white font-semibold py-3 rounded-2xl btn-press">龍虎榜 🏆</button>
          <button type="button" onClick={() => setView("challengeSetup")} className="w-full bg-red-500 text-white font-semibold py-3 rounded-2xl btn-press">再挑戰</button>
          <button type="button" onClick={() => setView("menu")} className="w-full bg-gray-200 font-semibold py-3 rounded-2xl btn-press">返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-amber-50">
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 anim-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-600">🏆 龍虎榜</h2>
          <button onClick={() => setView("menu")} className="text-sm text-gray-500">← 返回</button>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{cloudOn ? "☁️ 雲端同步（各裝置共用）" : "💾 本機儲存（各裝置獨立）"}</span>
          <button type="button" onClick={() => void refreshBoard()} className="text-teal-600 underline">重新整理</button>
        </div>
        <p className="text-xs text-gray-400 text-center">如需清除成績，請到挑戰模式 → 設定</p>
        {boardLoading ? (
          <div className="text-center text-gray-400 py-12">載入中…</div>
        ) : board.length === 0 ? (
          <div className="text-center text-gray-400 py-12">暫無紀錄</div>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {board.map((e, i) => (
              <div key={e.id} className={`flex gap-3 p-3 rounded-xl ${i === 0 ? "bg-yellow-50 border-2 border-yellow-300 anim-float" : "bg-gray-50 anim-slide-up"}`}>
                <div className={`w-8 text-center font-bold text-lg ${i === 0 ? "anim-medal" : i < 3 ? "text-orange-500" : "text-gray-400"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{e.name}</div>
                  <div className="text-xs text-gray-500 truncate">{e.topics} · {e.date} {e.time}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-orange-600">{e.score}</div>
                  <div className="text-xs text-gray-400">錯{e.wrongCount}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
