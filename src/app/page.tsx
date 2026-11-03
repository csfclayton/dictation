"use client";

import { useState } from "react";

const sampleWords = [
  // 家庭
  { text: "爸爸", jyutping: "baa4 baa1" },
  { text: "媽媽", jyutping: "maa4 maa1" },
  { text: "哥哥", jyutping: "go4 go1" },
  { text: "姐姐", jyutping: "ze4 ze1" },
  { text: "弟弟", jyutping: "dai6 dai2" },
  { text: "妹妹", jyutping: "mui6 mui2" },
  { text: "爺爺", jyutping: "je4 je4" },
  { text: "嫲嫲", jyutping: "maa4 maa4" },
  { text: "家庭", jyutping: "gaa1 ting4" },

  // 學校
  { text: "學校", jyutping: "hok6 haau6" },
  { text: "老師", jyutping: "lou5 si1" },
  { text: "同學", jyutping: "tung4 hok6" },
  { text: "書包", jyutping: "syu1 baau1" },
  { text: "功課", jyutping: "gung1 fo3" },
  { text: "默書", jyutping: "mak6 syu1" },
  { text: "練習", jyutping: "lin6 zaap6" },
  { text: "上課", jyutping: "soeng5 fo3" },
  { text: "下課", jyutping: "haa6 fo3" },
  { text: "小學生", jyutping: "siu2 hok6 saang1" },

  // 數字
  { text: "一", jyutping: "jat1" },
  { text: "二", jyutping: "ji6" },
  { text: "三", jyutping: "saam1" },
  { text: "四", jyutping: "sei3" },
  { text: "五", jyutping: "ng5" },
  { text: "六", jyutping: "luk6" },
  { text: "七", jyutping: "cat1" },
  { text: "八", jyutping: "baat3" },
  { text: "九", jyutping: "gau2" },
  { text: "十", jyutping: "sap6" },

  // 顏色
  { text: "紅色", jyutping: "hung4 sik1" },
  { text: "黃色", jyutping: "wong4 sik1" },
  { text: "藍色", jyutping: "laam4 sik1" },
  { text: "綠色", jyutping: "luk6 sik1" },
  { text: "白色", jyutping: "baak6 sik1" },
  { text: "黑色", jyutping: "hak1 sik1" },

  // 日常
  { text: "香港", jyutping: "hoeng1 gong2" },
  { text: "廣東話", jyutping: "gwong2 dung1 waa2" },
  { text: "朋友", jyutping: "pang4 jau5" },
  { text: "今天", jyutping: "gam1 tin1" },
  { text: "明天", jyutping: "ming4 tin1" },
  { text: "昨天", jyutping: "zok3 tin1" },
  { text: "太陽", jyutping: "taai3 joeng4" },
  { text: "月亮", jyutping: "jyut6 loeng6" },
  { text: "水", jyutping: "seoi2" },
  { text: "飯", jyutping: "faan6" },
  { text: "書", jyutping: "syu1" },
  { text: "筆", jyutping: "bat1" },
  { text: "花", jyutping: "faa1" },
  { text: "樹", jyutping: "syu6" },
  { text: "貓", jyutping: "maau1" },
  { text: "狗", jyutping: "gau2" },
  { text: "魚", jyutping: "jyu4" },
  { text: "鳥", jyutping: "niu5" },
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
