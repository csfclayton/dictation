"use client";

import { useState, useEffect, useCallback } from "react";
import ChallengeQuiz from "@/components/ChallengeQuiz";

type WordItem = { text: string; jyutping?: string };
type WordGroup = { id: string; name: string; words: WordItem[] };

const defaultGroups: WordGroup[] = [
  {
    id: "default",
    name: "預設詞庫",
    words: [
      { text: "爸爸", jyutping: "baa4 baa1" },
      { text: "媽媽", jyutping: "maa4 maa1" },
      { text: "哥哥", jyutping: "go4 go1" },
      { text: "姐姐", jyutping: "ze4 ze1" },
      { text: "學校", jyutping: "hok6 haau6" },
      { text: "老師", jyutping: "lou5 si1" },
      { text: "香港", jyutping: "hoeng1 gong2" },
      { text: "朋友", jyutping: "pang4 jau5" },
    ],
  },
];

const STORAGE_KEY = "dictation_groups_v2";
type Mode = "menu" | "dictationHub" | "select" | "practice" | "quiz";

export default function DictationApp() {
  const [mode, setMode] = useState<Mode>("menu");
  const [groups, setGroups] = useState<WordGroup[]>(defaultGroups);
  const [loaded, setLoaded] = useState(false);
  const [practiceList, setPracticeList] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(["default"]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed);
          setSelectedGroupIds([parsed[0].id]);
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  const stopAudio = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;
      stopAudio();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-HK";
      u.rate = speechRate;
      u.onend = () => setIsPlaying(false);
      setIsPlaying(true);
      speechSynthesis.speak(u);
    },
    [speechRate, stopAudio]
  );

  const togglePlay = () => {
    const item = practiceList[currentIndex];
    if (!item) return;
    if (isPlaying) stopAudio();
    else playAudio(item.text);
  };

  const startPractice = () => {
    const words = groups.filter((g) => selectedGroupIds.includes(g.id)).flatMap((g) => g.words);
    if (!words.length) return alert("所選詞庫冇詞語");
    setPracticeList(words);
    setCurrentIndex(0);
    setScore(0);
    setInput("");
    setResult(null);
    setMode("practice");
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  if (mode === "menu") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="max-w-md w-full text-center space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-orange-600 tracking-tight">小天才學習app</h1>
            <p className="text-gray-500 mt-2 text-sm">香港小學 · 繁體中文 · 廣東話</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode("dictationHub")}
              className="aspect-square bg-white rounded-3xl shadow-lg border-2 border-orange-100 hover:border-orange-400 hover:shadow-xl transition flex flex-col items-center justify-center gap-3 p-4 active:scale-95"
            >
              <span className="text-5xl">✏️</span>
              <span className="text-lg font-bold text-orange-600">默書練習</span>
            </button>
            <button
              onClick={() => setMode("quiz")}
              className="aspect-square bg-white rounded-3xl shadow-lg border-2 border-teal-100 hover:border-teal-400 hover:shadow-xl transition flex flex-col items-center justify-center gap-3 p-4 active:scale-95"
            >
              <span className="text-5xl">🧠</span>
              <span className="text-lg font-bold text-teal-600">常識問答</span>
            </button>
          </div>
          <a
            href="https://csfclayton.github.io/beyblade-x-arena/"
            className="block w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-lg font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition"
          >
            🌀 挑戰塔對戰
          </a>
          <p className="text-xs text-gray-400">答常識挑戰抽取陀螺後，可到挑戰塔對戰</p>
        </div>
      </div>
    );
  }

  if (mode === "dictationHub") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-600">✏️ 默書練習</h2>
            <button onClick={() => setMode("menu")} className="text-gray-500 text-sm">← 主頁</button>
          </div>
          <button onClick={() => setMode("select")} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-semibold py-4 rounded-2xl">
            開始默書
          </button>
        </div>
      </div>
    );
  }

  if (mode === "quiz") {
    return <ChallengeQuiz onBack={() => setMode("menu")} />;
  }

  if (mode === "select") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-600">選擇默書詞庫</h2>
            <button onClick={() => setMode("dictationHub")} className="text-gray-500 text-sm">← 返回</button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {groups.map((g) => (
              <label key={g.id} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer ${selectedGroupIds.includes(g.id) ? "border-orange-400 bg-orange-50" : "border-gray-200"}`}>
                <input type="checkbox" checked={selectedGroupIds.includes(g.id)} onChange={() => setSelectedGroupIds((p) => p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id])} className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-lg">{g.name}</div>
                  <div className="text-sm text-gray-500">{g.words.length} 個詞語</div>
                </div>
              </label>
            ))}
          </div>
          <button onClick={startPractice} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold py-4 rounded-2xl">開始練習 →</button>
        </div>
      </div>
    );
  }

  const item = practiceList[currentIndex];
  return (
    <div className="min-h-screen p-4 bg-amber-50">
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <button onClick={() => { stopAudio(); setMode("select"); }} className="text-gray-500 text-sm">← 返回</button>
          <div className="text-sm text-gray-600">{currentIndex + 1} / {practiceList.length}　分數 {score}</div>
        </div>
        <button onClick={togglePlay} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-semibold py-4 rounded-2xl">
          {isPlaying ? "⏸ 暫停" : "▶️ 播放"}
        </button>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2} className="w-full text-2xl border-4 border-orange-200 focus:border-orange-400 rounded-2xl px-4 py-3 text-center outline-none" placeholder="喺度輸入答案" autoFocus />
        <div className="flex gap-2">
          <button onClick={() => { stopAudio(); setInput(""); setResult(null); setCurrentIndex((i) => (i - 1 + practiceList.length) % practiceList.length); }} className="flex-1 bg-gray-200 py-3 rounded-2xl">← 上一句</button>
          <button onClick={() => { if (!item) return; if (input.trim() === item.text.trim()) { setResult("correct"); setScore((s) => s + 1); } else setResult("wrong"); }} className="flex-1 bg-green-500 text-white py-3 rounded-2xl">檢查 ✅</button>
          <button onClick={() => { stopAudio(); setInput(""); setResult(null); setCurrentIndex((i) => (i + 1) % practiceList.length); }} className="flex-1 bg-blue-500 text-white py-3 rounded-2xl">下一句 →</button>
        </div>
        {result && item && (
          <div className={`text-xl font-bold p-4 rounded-2xl ${result === "correct" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {result === "correct" ? "正確！👍" : <>正確答案：{item.text}</>}
          </div>
        )}
      </div>
    </div>
  );
}
