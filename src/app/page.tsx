"use client";

import { useState } from "react";

const sampleWords = [
  { text: "香港", jyutping: "hoeng1 gong2" },
  { text: "小學生", jyutping: "siu2 hok6 saang1" },
  { text: "默書", jyutping: "mak6 syu1" },
  { text: "練習", jyutping: "lin6 zaap6" },
  { text: "廣東話", jyutping: "gwong2 dung1 waa2" },
];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentWord = sampleWords[currentIndex];

  // 使用瀏覽器 Web Speech API 播放（zh-HK，作為 fallback）
  const playAudio = () => {
    if (!("speechSynthesis" in window)) {
      alert("你的瀏覽器不支援語音合成");
      return;
    }
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(currentWord.text);
    utterance.lang = "zh-HK";
    utterance.rate = 0.85; // 稍慢，適合小朋友
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
  };

  const checkAnswer = () => {
    const correct = currentWord.text;
    if (input.trim() === correct) {
      setResult("correct");
      setScore((s) => s + 1);
    } else {
      setResult("wrong");
    }
  };

  const nextWord = () => {
    setInput("");
    setResult(null);
    setCurrentIndex((i) => (i + 1) % sampleWords.length);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-orange-600 mb-2">
          香港小學默書練習
        </h1>
        <p className="text-gray-500 mb-6">廣東話 · 繁體中文</p>

        <div className="mb-4 text-sm text-gray-600">
          分數：{score} / {sampleWords.length}
        </div>

        <button
          onClick={playAudio}
          disabled={isPlaying}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xl font-semibold px-8 py-4 rounded-2xl mb-6 transition-colors w-full"
        >
          {isPlaying ? "播放中..." : "▶️ 播放廣東話"}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
          className="w-full text-3xl border-4 border-orange-200 focus:border-orange-400 rounded-2xl px-4 py-3 text-center outline-none mb-4"
          placeholder="喺度輸入答案"
          autoFocus
        />

        <div className="flex gap-3 mb-6">
          <button
            onClick={checkAnswer}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-lg font-semibold py-3 rounded-2xl transition-colors"
          >
            檢查答案 ✅
          </button>
          <button
            onClick={nextWord}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-lg font-semibold py-3 rounded-2xl transition-colors"
          >
            下一個 →
          </button>
        </div>

        {result && (
          <div
            className={`text-2xl font-bold p-4 rounded-2xl ${
              result === "correct"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {result === "correct"
              ? "正確！👍"
              : `正確答案是：${currentWord.text}`}
            <div className="text-sm mt-1 text-gray-600">
              粵拼：{currentWord.jyutping}
            </div>
          </div>
        )}

        <p className="mt-8 text-xs text-gray-400">
          目前使用瀏覽器語音（zh-HK）。之後可接上 cantonese.ai 等更自然的粵語 TTS。
        </p>
      </div>
    </div>
  );
}
