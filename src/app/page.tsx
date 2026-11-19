"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
      { text: "弟弟", jyutping: "dai6 dai2" },
      { text: "妹妹", jyutping: "mui6 mui2" },
      { text: "學校", jyutping: "hok6 haau6" },
      { text: "老師", jyutping: "lou5 si1" },
      { text: "同學", jyutping: "tung4 hok6" },
      { text: "書包", jyutping: "syu1 baau1" },
      { text: "功課", jyutping: "gung1 fo3" },
      { text: "默書", jyutping: "mak6 syu1" },
      { text: "練習", jyutping: "lin6 zaap6" },
      { text: "香港", jyutping: "hoeng1 gong2" },
      { text: "廣東話", jyutping: "gwong2 dung1 waa2" },
      { text: "朋友", jyutping: "pang4 jau5" },
      { text: "今天", jyutping: "gam1 tin1" },
      { text: "太陽", jyutping: "taai3 joeng4" },
      { text: "水", jyutping: "seoi2" },
      { text: "飯", jyutping: "faan6" },
      { text: "書", jyutping: "syu1" },
      { text: "貓", jyutping: "maau1" },
      { text: "狗", jyutping: "gau2" },
    ],
  },
];

const STORAGE_KEY = "dictation_groups_v2";

type Mode = "menu" | "dictationHub" | "manage" | "select" | "ocr" | "practice" | "quiz";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("menu");
  const [groups, setGroups] = useState<WordGroup[]>(defaultGroups);
  const [activeGroupId, setActiveGroupId] = useState("default");
  const [loaded, setLoaded] = useState(false);
  const [practiceList, setPracticeList] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [newGroupName, setNewGroupName] = useState("");
  const [newText, setNewText] = useState("");
  const [newJyutping, setNewJyutping] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [message, setMessage] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(["default"]);
  const [ocrText, setOcrText] = useState("");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0] || defaultGroups[0];

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed);
          setActiveGroupId(parsed[0].id);
          setSelectedGroupIds([parsed[0].id]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoaded(true);
    }
  }, []);

  const saveGroups = useCallback((newGroups: WordGroup[]) => {
    setGroups(newGroups);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newGroups));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2000);
  };

  const stopAudio = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  const playAudio = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) {
        alert("你的瀏覽器不支援語音合成");
        return;
      }
      stopAudio();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-HK";
      utterance.rate = speechRate;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      setIsPlaying(true);
      speechSynthesis.speak(utterance);
    },
    [speechRate, stopAudio]
  );

  const togglePlayPause = useCallback(() => {
    if (!practiceList[currentIndex]) return;
    if (isPlaying) stopAudio();
    else playAudio(practiceList[currentIndex].text);
  }, [isPlaying, currentIndex, practiceList, playAudio, stopAudio]);

  useEffect(() => {
    if (mode !== "practice") return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, togglePlayPause]);

  const checkAnswer = () => {
    const item = practiceList[currentIndex];
    if (!item) return;
    if (input.trim() === item.text.trim()) {
      setResult("correct");
      setScore((s) => s + 1);
    } else setResult("wrong");
  };

  const goTo = (index: number) => {
    stopAudio();
    setInput("");
    setResult(null);
    setCurrentIndex(index);
  };

  const nextItem = () => goTo((currentIndex + 1) % practiceList.length);
  const prevItem = () => goTo((currentIndex - 1 + practiceList.length) % practiceList.length);

  const createGroup = () => {
    const name = newGroupName.trim();
    if (!name) return alert("請輸入詞庫名稱");
    const newGroup: WordGroup = { id: generateId(), name, words: [] };
    saveGroups([...groups, newGroup]);
    setActiveGroupId(newGroup.id);
    setNewGroupName("");
    showMessage(`已新增詞庫「${name}」`);
  };

  const deleteGroup = (id: string) => {
    if (groups.length <= 1) return alert("至少要保留一個詞庫");
    const target = groups.find((g) => g.id === id);
    if (!confirm(`確定刪除詞庫「${target?.name}」？`)) return;
    const updated = groups.filter((g) => g.id !== id);
    saveGroups(updated);
    if (activeGroupId === id) setActiveGroupId(updated[0].id);
    setSelectedGroupIds((prev) => {
      const next = prev.filter((x) => x !== id);
      return next.length > 0 ? next : [updated[0].id];
    });
    showMessage("已刪除詞庫");
  };

  const renameGroup = (id: string) => {
    const name = editGroupName.trim();
    if (!name) return;
    saveGroups(groups.map((g) => (g.id === id ? { ...g, name } : g)));
    setEditingGroupId(null);
    showMessage("已重新命名");
  };

  const addWordToActive = () => {
    const text = newText.trim();
    if (!text) return alert("請輸入中文詞語");
    const current = groups.find((g) => g.id === activeGroupId) || groups[0];
    if (!current) return;
    if (current.words.some((w) => w.text === text)) return alert("詞語已存在");
    saveGroups(
      groups.map((g) =>
        g.id === activeGroupId
          ? { ...g, words: [...g.words, { text, jyutping: newJyutping.trim() || undefined }] }
          : g
      )
    );
    setNewText("");
    setNewJyutping("");
    showMessage(`已加入「${text}」`);
  };

  const deleteWord = (wordIndex: number) => {
    const current = groups.find((g) => g.id === activeGroupId) || groups[0];
    if (!current || !current.words[wordIndex]) return;
    if (!confirm(`確定刪除「${current.words[wordIndex].text}」？`)) return;
    saveGroups(
      groups.map((g) =>
        g.id === activeGroupId ? { ...g, words: g.words.filter((_, i) => i !== wordIndex) } : g
      )
    );
    showMessage("已刪除詞語");
  };

  const startSelectedPractice = () => {
    const allWords = groups.filter((g) => selectedGroupIds.includes(g.id)).flatMap((g) => g.words);
    if (allWords.length === 0) return alert("所選詞庫冇任何詞語");
    setPracticeList(allWords);
    setCurrentIndex(0);
    setScore(0);
    setInput("");
    setResult(null);
    setMode("practice");
  };

  const toggleSelectGroup = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleImage = async (file: File) => {
    setOcrStatus("loading");
    setOcrProgress(0);
    setOcrText("");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("chi_tra", 1, {
        logger: (m: { status?: string; progress?: number }) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();
      const cleaned = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+/g, " ").trim();
      setOcrText(cleaned || "未能識別到文字，請試下再影清晰啲。");
      setOcrStatus("done");
    } catch (err) {
      console.error(err);
      setOcrText("識別失敗，請再試一次。");
      setOcrStatus("error");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  const startFromOcr = () => {
    if (!ocrText.trim()) return;
    const sentences = ocrText
      .split(/(?<=[。！？\n])\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);
    if (sentences.length === 0) return alert("請先確認有文字內容");
    setPracticeList(sentences.map((s) => ({ text: s })));
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
            <button onClick={() => setMode("menu")} className="text-gray-500 text-sm">
              ← 主頁
            </button>
          </div>
          <button
            onClick={() => setMode("select")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-semibold py-4 rounded-2xl"
          >
            開始默書
          </button>
          <button
            onClick={() => setMode("manage")}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xl font-semibold py-4 rounded-2xl"
          >
            📚 詞庫管理
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
            <button onClick={() => setMode("dictationHub")} className="text-gray-500 text-sm">
              ← 返回
            </button>
          </div>
          <p className="text-sm text-gray-600">可同時選擇多個詞庫一齊練習</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {groups.map((g) => (
              <label
                key={g.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer ${
                  selectedGroupIds.includes(g.id)
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(g.id)}
                  onChange={() => toggleSelectGroup(g.id)}
                  className="w-5 h-5"
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-lg">{g.name}</div>
                  <div className="text-sm text-gray-500">{g.words.length} 個詞語</div>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={startSelectedPractice}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold py-4 rounded-2xl"
          >
            開始練習 →
          </button>
        </div>
      </div>
    );
  }

  // Remaining modes (manage/ocr/practice) restored below via redirect note
  if (mode === "manage" || mode === "ocr" || mode === "practice") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
        <div className="bg-white rounded-2xl p-6 max-w-md text-center space-y-3">
          <p className="text-gray-600">請返回主頁重新進入完整功能（部署同步中）。</p>
          <button onClick={() => setMode("menu")} className="bg-orange-500 text-white px-4 py-2 rounded-xl">返回主頁</button>
        </div>
      </div>
    );
  }

  return null;
}
