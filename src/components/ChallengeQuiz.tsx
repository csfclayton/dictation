"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { quizBank } from "@/data/quizBank";
import type { QuizQuestion } from "@/data/quizTypes";
import {
  ALL_TOPICS,
  LEADERBOARD_KEY,
  shuffle,
  shuffleQuestion,
  loadLeaderboard,
  saveLeaderboardEntry,
  sfxClick,
  sfxCorrect,
  sfxWrong,
  sfxUrgent,
  sfxComplete,
  createBgMusic,
  type LeaderboardEntry,
} from "@/lib/quizHelpers";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

type View = "menu" | "practice" | "challengeSetup" | "challengePlay" | "challengeResult" | "leaderboard";

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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgRef = useRef<{ stop: () => void } | null>(null);

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

  useEffect(() => () => { clearTimer(); stopBg(); }, [clearTimer, stopBg]);

  const pool = () => {
    const f = quizBank.filter((q) => topics.includes(q.topic));
    return f.length ? f : quizBank;
  };

  const startPractice = (n: number) => {
    const picked = shuffle(pool()).slice(0, Math.min(n, pool().length)).map(shuffleQuestion);
    setList(picked);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
    setFinished(false);
    setView("practice");
    sfxClick();
  };

  const startChallenge = () => {
    if (!name.trim()) return alert("請先輸入名字");
    if (!topics.length) return alert("請至少選擇一個主題");
    const picked = shuffle(pool()).slice(0, Math.min(10, pool().length)).map(shuffleQuestion);
    if (!picked.length) return alert("冇題目");
    setList(picked);
    setIndex(0);
    setCScore(0);
    setWrongs([]);
    setAnswered(false);
    setSelected(null);
    setTimeLeft(10);
    setView("challengePlay");
    sfxClick();
    if (bgOn) bgRef.current = createBgMusic();
  };

  const finishCh = useCallback((finalScore: number, w: { question: string; correct: string; chosen: string }[]) => {
    clearTimer();
    stopBg();
    sfxComplete();
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
    saveLeaderboardEntry(entry);
    setBoard(loadLeaderboard());
    setCScore(entry.score);
    setWrongs(w);
    setView("challengeResult");
  }, [clearTimer, stopBg, name, topics]);

  const advance = useCallback((sel: number | null, left: number, lst: QuizQuestion[], idx: number, sc: number, w: { question: string; correct: string; chosen: string }[]) => {
    const q = lst[idx];
    if (!q) return;
    let ns = sc;
    let nw = w;
    if (sel !== null && sel === q.answer) {
      ns = sc + 10 + left * 0.1;
      sfxCorrect();
    } else {
      sfxWrong();
      nw = [...w, { question: q.question, correct: q.options[q.answer], chosen: sel !== null ? q.options[sel] : "（逾時未答）" }];
    }
    if (idx + 1 >= lst.length) finishCh(ns, nw);
    else {
      setCScore(ns);
      setWrongs(nw);
      setIndex(idx + 1);
      setSelected(null);
      setAnswered(false);
      setTimeLeft(10);
    }
  }, [finishCh]);

  useEffect(() => {
    if (view !== "challengePlay" || answered) return;
    clearTimer();
    setTimeLeft(10);
    timerRef.current = setInterval(() => setTimeLeft((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearTimer();
  }, [view, index, answered, clearTimer]);

  useEffect(() => {
    if (view !== "challengePlay" || answered) return;
    if (timeLeft <= 3 && timeLeft >= 1) sfxUrgent();
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
          <button type="button" onClick={() => { sfxClick(); setTopics([...ALL_TOPICS]); }} className="text-teal-600 underline">全選</button>
          <button type="button" onClick={() => { sfxClick(); setTopics([]); }} className="text-gray-500 underline">取消全選</button>
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALL_TOPICS.map((t) => (
          <button key={t} type="button" onClick={() => { sfxClick(); setTopics((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]); }}
            className={`px-3 py-1.5 rounded-full text-sm border-2 ${topics.includes(t) ? color : "border-gray-200 text-gray-500"}`}>{t}</button>
        ))}
      </div>
    </div>
  );

  if (view === "menu") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-teal-600">常識問答測驗</h2>
            <button onClick={onBack} className="text-gray-500 text-sm">← 返回</button>
          </div>
          <p className="text-sm text-gray-500">題庫 {quizBank.length} 題 · 答案隨機排列</p>
          {topicPicker("border-teal-500 bg-teal-50 text-teal-800")}
          <button type="button" onClick={() => startPractice(5)} className="w-full bg-teal-500 text-white font-semibold py-3 rounded-2xl">5 題練習</button>
          <button type="button" onClick={() => startPractice(10)} className="w-full bg-teal-600 text-white font-semibold py-3 rounded-2xl">10 題練習</button>
          <button type="button" onClick={() => startPractice(20)} className="w-full bg-teal-700 text-white font-semibold py-3 rounded-2xl">20 題練習</button>
          <button type="button" onClick={() => startPractice(9999)} className="w-full border-2 border-teal-500 text-teal-700 font-semibold py-3 rounded-2xl">所選主題全部</button>
          <button type="button" onClick={() => { sfxClick(); setView("challengeSetup"); }} className="w-full bg-red-500 text-white font-semibold py-4 rounded-2xl">⚡ 挑戰模式（10題計時）</button>
          <button type="button" onClick={() => { sfxClick(); setBoard(loadLeaderboard()); setView("leaderboard"); }} className="w-full border-2 border-orange-400 text-orange-600 font-semibold py-3 rounded-2xl">🏆 龍虎榜</button>
        </div>
      </div>
    );
  }

  if (view === "practice") {
    if (finished) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
            <h2 className="text-2xl font-bold text-teal-600">完成！</h2>
            <div className="text-4xl font-bold text-orange-500">{score} / {list.length}</div>
            <button type="button" onClick={() => startPractice(list.length)} className="w-full bg-teal-500 text-white font-semibold py-3 rounded-2xl">再練一次</button>
            <button type="button" onClick={() => setView("menu")} className="w-full bg-gray-200 font-semibold py-3 rounded-2xl">返回</button>
          </div>
        </div>
      );
    }
    const q = list[index];
    if (!q) return null;
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <div className="flex justify-between text-sm text-gray-600">
            <button type="button" onClick={() => setView("menu")}>← 退出</button>
            <span>{index + 1}/{list.length}　分數 {score}</span>
          </div>
          <div className="text-xs text-teal-600">{q.topic}</div>
          <div className="text-xl font-semibold">{q.question}</div>
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              let cls = "w-full text-left px-4 py-3 rounded-xl border-2 ";
              if (showAnswer) {
                if (i === q.answer) cls += "border-green-500 bg-green-50";
                else if (i === selected) cls += "border-red-400 bg-red-50";
                else cls += "border-gray-200 text-gray-400";
              } else cls += selected === i ? "border-teal-500 bg-teal-50" : "border-gray-200";
              return <button key={i} type="button" disabled={showAnswer} onClick={() => { sfxClick(); setSelected(i); }} className={cls}>{String.fromCharCode(65 + i)}. {opt}</button>;
            })}
          </div>
          {!showAnswer ? (
            <button type="button" disabled={selected === null} onClick={() => {
              if (selected === q.answer) { setScore((s) => s + 1); sfxCorrect(); } else sfxWrong();
              setShowAnswer(true);
            }} className="w-full bg-teal-500 disabled:bg-gray-300 text-white font-semibold py-3 rounded-2xl">提交</button>
          ) : (
            <button type="button" onClick={() => {
              if (index + 1 >= list.length) setFinished(true);
              else { setIndex((i) => i + 1); setSelected(null); setShowAnswer(false); }
            }} className="w-full bg-orange-500 text-white font-semibold py-3 rounded-2xl">{index + 1 >= list.length ? "查看成績" : "下一題"}</button>
          )}
        </div>
      </div>
    );
  }

  if (view === "challengeSetup") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <div className="flex justify-between"><h2 className="text-2xl font-bold text-red-600">⚡ 挑戰模式</h2><button onClick={() => setView("menu")} className="text-sm text-gray-500">← 返回</button></div>
          <p className="text-sm text-gray-600">10 題 · 每題 10 秒 · 答對 10 分 + 剩餘秒×0.1</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="輸入名字" maxLength={20} className="w-full border-2 rounded-xl px-4 py-3 text-lg focus:border-red-400 outline-none" />
          {topicPicker("border-red-400 bg-red-50")}
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={bgOn} onChange={(e) => setBgOn(e.target.checked)} />背景音效</label>
          <button type="button" onClick={startChallenge} className="w-full bg-red-500 text-white text-xl font-semibold py-4 rounded-2xl">開始挑戰！</button>
        </div>
      </div>
    );
  }

  if (view === "challengePlay") {
    const q = list[index];
    if (!q) return null;
    const urgent = timeLeft <= 3;
    return (
      <div className={`min-h-screen p-4 ${urgent ? "bg-red-100" : "bg-amber-50"}`}>
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <div className="flex justify-between text-sm"><span>{name}</span><span className="font-bold text-orange-600">{cScore.toFixed(1)} 分</span></div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{index + 1}/{list.length}</span>
            <span className={`text-3xl font-bold ${urgent ? "text-red-600 animate-pulse" : "text-teal-600"}`}>{timeLeft}s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${urgent ? "bg-red-500" : "bg-teal-500"}`} style={{ width: `${timeLeft * 10}%` }} /></div>
          <div className="text-xs text-teal-600">{q.topic}</div>
          <div className="text-xl font-semibold">{q.question}</div>
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button key={i} type="button" disabled={answered} onClick={() => {
                if (answered) return;
                setAnswered(true); setSelected(i); clearTimer(); sfxClick();
                const t = timeLeft;
                setTimeout(() => advance(i, t, list, index, cScore, wrongs), 300);
              }} className={`w-full text-left px-4 py-3 rounded-xl border-2 ${answered && i === q.answer ? "border-green-500 bg-green-50" : answered && i === selected ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { clearTimer(); stopBg(); setView("menu"); }} className="w-full text-gray-400 text-sm">退出</button>
        </div>
      </div>
    );
  }

  if (view === "challengeResult") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center text-red-600">挑戰完成！</h2>
          <div className="text-center text-5xl font-bold text-orange-500">{cScore.toFixed(1)}</div>
          <div className="text-center text-sm text-gray-500">{name}</div>
          {wrongs.length ? (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              <div className="font-medium text-red-600">錯題（{wrongs.length}）</div>
              {wrongs.map((w, i) => (
                <div key={i} className="bg-red-50 rounded-xl p-3 text-sm">
                  <div className="font-medium">{w.question}</div>
                  <div className="text-red-600">你的：{w.chosen}</div>
                  <div className="text-green-700">正確：{w.correct}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-center text-green-600 py-4">全部答對！🎉</div>}
          <button type="button" onClick={() => { setBoard(loadLeaderboard()); setView("leaderboard"); }} className="w-full bg-orange-500 text-white font-semibold py-3 rounded-2xl">龍虎榜 🏆</button>
          <button type="button" onClick={() => setView("challengeSetup")} className="w-full bg-red-500 text-white font-semibold py-3 rounded-2xl">再挑戰</button>
          <button type="button" onClick={() => setView("menu")} className="w-full bg-gray-200 font-semibold py-3 rounded-2xl">返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-amber-50">
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
        <div className="flex justify-between"><h2 className="text-2xl font-bold text-orange-600">🏆 龍虎榜</h2><button onClick={() => setView("menu")} className="text-sm text-gray-500">← 返回</button></div>
        {board.length === 0 ? <div className="text-center text-gray-400 py-12">暫無紀錄</div> : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {board.map((e, i) => (
              <div key={e.id} className={`flex gap-3 p-3 rounded-xl ${i === 0 ? "bg-yellow-50 border-2 border-yellow-300" : "bg-gray-50"}`}>
                <div className={`w-8 text-center font-bold ${i < 3 ? "text-orange-500" : "text-gray-400"}`}>{i + 1}</div>
                <div className="flex-1 min-w-0"><div className="font-semibold truncate">{e.name}</div><div className="text-xs text-gray-500 truncate">{e.topics} · {e.date} {e.time}</div></div>
                <div className="text-right"><div className="font-bold text-orange-600">{e.score}</div><div className="text-xs text-gray-400">錯{e.wrongCount}</div></div>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={() => { if (confirm("清除龍虎榜？")) { localStorage.removeItem(LEADERBOARD_KEY); setBoard([]); } }} className="w-full text-red-400 text-sm">清除龍虎榜</button>
      </div>
    </div>
  );
}
