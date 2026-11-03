"use client";

import { useState, useRef, useEffect } from "react";

type WordItem = { text: string; jyutping?: string };

const defaultWords: WordItem[] = [
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
  { text: "一", jyutping: "jat1" },
  { text: "二", jyutping: "ji6" },
  { text: "三", jyutping: "saam1" },
  { text: "四", jyutping: "sei3" },
  { text: "五", jyutping: "ng5" },
  { text: "紅色", jyutping: "hung4 sik1" },
  { text: "黃色", jyutping: "wong4 sik1" },
  { text: "藍色", jyutping: "laam4 sik1" },
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
];

const STORAGE_KEY = "dictation_wordbank_v1";

type Mode = "menu" | "manage" | "ocr" | "practice";

export default function Home() {
  const [mode, setMode] = useState<Mode>("menu");
  const [wordBank, setWordBank] = useState<WordItem[]>(defaultWords);
  const [practiceList, setPracticeList] = useState<WordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 管理詞庫用
  const [newText, setNewText] = useState("");
  const [newJyutping, setNewJyutping] = useState("");

  // OCR related
  const [ocrText, setOcrText] = useState("");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 載入 localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWordBank(parsed);
        }
      }
    } catch (e) {
      console.error("載入詞庫失敗", e);
    }
  }, []);

  // 儲存到 localStorage
  const saveWordBank = (list: WordItem[]) => {
    setWordBank(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("儲存詞庫失敗", e);
    }
  };

  const currentItem = practiceList[currentIndex];

  const playAudio = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("你的瀏覽器不支援語音合成");
      return;
    }
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-HK";
    utterance.rate = 0.8;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
  };

  const checkAnswer = () => {
    if (!currentItem) return;
    const correct = currentItem.text.trim();
    if (input.trim() === correct) {
      setResult("correct");
      setScore((s) => s + 1);
    } else {
      setResult("wrong");
    }
  };

  const nextItem = () => {
    setInput("");
    setResult(null);
    setCurrentIndex((i) => (i + 1) % practiceList.length);
  };

  // 開始用目前詞庫練習
  const startWordsPractice = () => {
    if (wordBank.length === 0) {
      alert("詞庫係空嘅，請先加入詞語");
      return;
    }
    setPracticeList([...wordBank]);
    setCurrentIndex(0);
    setScore(0);
    setInput("");
    setResult(null);
    setMode("practice");
  };

  // 新增詞語
  const addWord = () => {
    const text = newText.trim();
    if (!text) {
      alert("請輸入中文詞語");
      return;
    }
    // 避免重複
    if (wordBank.some((w) => w.text === text)) {
      alert("呢個詞語已經存在");
      return;
    }
    const newList = [...wordBank, { text, jyutping: newJyutping.trim() || undefined }];
    saveWordBank(newList);
    setNewText("");
    setNewJyutping("");
  };

  // 刪除詞語
  const deleteWord = (index: number) => {
    if (!confirm(`確定刪除「${wordBank[index].text}」？`)) return;
    const newList = wordBank.filter((_, i) => i !== index);
    saveWordBank(newList);
  };

  // 還原預設
  const resetToDefault = () => {
    if (!confirm("確定還原成預設詞庫？你自己加嘅詞語會消失。")) return;
    saveWordBank([...defaultWords]);
  };

  // OCR
  const handleImage = async (file: File) => {
    setOcrStatus("loading");
    setOcrProgress(0);
    setOcrText("");

    try {
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker("chi_tra", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });

      const {
        data: { text },
      } = await worker.recognize(file);

      await worker.terminate();

      const cleaned = text
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .trim();

      setOcrText(cleaned || "未能識別到文字，請試下再影清晰啲。");
      setOcrStatus("done");
    } catch (err) {
      console.error(err);
      setOcrText("識別失敗，請再試一次或換張更清晰的相片。");
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

    if (sentences.length === 0) {
      alert("請先確認有文字內容");
      return;
    }

    setPracticeList(sentences.map((s) => ({ text: s })));
    setCurrentIndex(0);
    setScore(0);
    setInput("");
    setResult(null);
    setMode("practice");
  };

  // ========== UI ==========

  // 主選單
  if (mode === "menu") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <h1 className="text-3xl font-bold text-orange-600">香港小學默書練習</h1>
          <p className="text-gray-500 mb-2">廣東話 · 繁體中文</p>

          <button
            onClick={startWordsPractice}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xl font-semibold py-4 rounded-2xl"
          >
            開始詞語練習
            <div className="text-sm font-normal opacity-90 mt-1">
              目前詞庫有 {wordBank.length} 個詞
            </div>
          </button>

          <button
            onClick={() => setMode("manage")}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white text-xl font-semibold py-4 rounded-2xl"
          >
            📚 詞庫管理
          </button>

          <button
            onClick={() => {
              setMode("ocr");
              setOcrStatus("idle");
              setOcrText("");
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xl font-semibold py-4 rounded-2xl"
          >
            📸 影相匯入課文
          </button>

          <p className="text-xs text-gray-400 mt-4">
            詞庫會自動儲存在呢部手機 / 電腦
          </p>
        </div>
      </div>
    );
  }

  // 詞庫管理頁面
  if (mode === "manage") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-600">詞庫管理</h2>
            <button onClick={() => setMode("menu")} className="text-gray-500 text-sm">
              ← 返回
            </button>
          </div>

          <div className="text-sm text-gray-600">
            目前共有 <span className="font-bold text-orange-600">{wordBank.length}</span> 個詞語
          </div>

          {/* 新增區域 */}
          <div className="border-2 border-dashed border-orange-200 rounded-2xl p-4 space-y-3">
            <div className="font-medium text-gray-700">新增詞語</div>
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="中文詞語（必填）"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-lg outline-none focus:border-orange-400"
            />
            <input
              type="text"
              value={newJyutping}
              onChange={(e) => setNewJyutping(e.target.value)}
              placeholder="粵拼（可選，例如 baa4 baa1）"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
            />
            <button
              onClick={addWord}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl"
            >
              ＋ 加入詞庫
            </button>
          </div>

          {/* 詞語列表 */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {wordBank.length === 0 ? (
              <div className="text-center text-gray-400 py-8">詞庫係空嘅</div>
            ) : (
              wordBank.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3"
                >
                  <div>
                    <div className="text-lg font-medium">{w.text}</div>
                    {w.jyutping && (
                      <div className="text-sm text-gray-500">{w.jyutping}</div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteWord(i)}
                    className="text-red-500 text-sm px-3 py-1 rounded-lg hover:bg-red-50"
                  >
                    刪除
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={resetToDefault}
            className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-xl text-sm"
          >
            還原預設詞庫
          </button>
        </div>
      </div>
    );
  }

  // OCR 頁面
  if (mode === "ocr") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-600">影相匯入課文</h2>
            <button onClick={() => setMode("menu")} className="text-gray-500 text-sm">
              ← 返回
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={ocrStatus === "loading"}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-lg font-semibold py-4 rounded-2xl"
          >
            {ocrStatus === "loading"
              ? `識別中... ${ocrProgress}%`
              : "📷 影相 / 選擇相片"}
          </button>

          {ocrStatus === "loading" && (
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          )}

          {(ocrStatus === "done" || ocrStatus === "error") && (
            <>
              <label className="block text-sm font-medium text-gray-700">
                識別結果（可修改）：
              </label>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                rows={10}
                className="w-full border-2 border-orange-200 rounded-xl p-3 text-lg focus:border-orange-400 outline-none"
                placeholder="識別出的文字會顯示在這裡，你可以修改..."
              />

              <button
                onClick={startFromOcr}
                className="w-full bg-green-500 hover:bg-green-600 text-white text-lg font-semibold py-4 rounded-2xl"
              >
                開始默寫呢段文字 →
              </button>
            </>
          )}

          <p className="text-xs text-gray-400">
            提示：影相時盡量影清晰、光線充足、字體正，識別會準確啲。
          </p>
        </div>
      </div>
    );
  }

  // 練習頁面
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
      <div className="bg-white rounded-3xl shadow-xl p-6 max-w-md w-full text-center">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setMode("menu")} className="text-gray-500 text-sm">
            ← 返回選單
          </button>
          <div className="text-sm text-gray-600">
            {currentIndex + 1} / {practiceList.length}　分數：{score}
          </div>
        </div>

        <button
          onClick={() => currentItem && playAudio(currentItem.text)}
          disabled={isPlaying || !currentItem}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xl font-semibold py-4 rounded-2xl mb-5"
        >
          {isPlaying ? "播放中..." : "▶️ 播放廣東話"}
        </button>

        <div className="mb-3 text-left text-sm text-gray-500 px-1">
          {currentItem && currentItem.text.length > 15 ? "請默寫整句：" : "請默寫："}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={currentItem && currentItem.text.length > 20 ? 4 : 2}
          className="w-full text-2xl border-4 border-orange-200 focus:border-orange-400 rounded-2xl px-4 py-3 text-center outline-none mb-4"
          placeholder="喺度輸入答案"
          autoFocus
        />

        <div className="flex gap-3 mb-5">
          <button
            onClick={checkAnswer}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold py-3 rounded-2xl"
          >
            檢查 ✅
          </button>
          <button
            onClick={nextItem}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-3 rounded-2xl"
          >
            下一個 →
          </button>
        </div>

        {result && currentItem && (
          <div
            className={`text-xl font-bold p-4 rounded-2xl ${
              result === "correct"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {result === "correct" ? (
              "正確！👍"
            ) : (
              <>
                <div>正確答案：</div>
                <div className="mt-1 text-lg break-words">{currentItem.text}</div>
                {currentItem.jyutping && (
                  <div className="text-sm mt-1 text-gray-600">
                    粵拼：{currentItem.jyutping}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
