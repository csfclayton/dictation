"use client";

import { useState } from "react";
import QuizBankManager from "@/components/QuizBankManager";
import AdventureMap from "@/components/AdventureMap";
import BeyCollection from "@/components/BeyCollection";
import { collectionStats } from "@/lib/beyCollection";
import { getActiveQuizBank } from "@/lib/quizBankStore";

const APP_VERSION = "v2026.11.06i";

type View = "menu" | "bankManage" | "adventure" | "beyCollection";

export default function ChallengeQuiz({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("menu");

  if (view === "adventure")
    return <AdventureMap onBack={() => setView("menu")} />;
  if (view === "bankManage")
    return <QuizBankManager onBack={() => setView("menu")} />;
  if (view === "beyCollection")
    return <BeyCollection onBack={() => setView("menu")} />;

  const beyStats = collectionStats();

  return (
    <div className="min-h-screen p-4 bg-amber-50">
      <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">
        {APP_VERSION}
      </div>
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-teal-600">🧠 常識問答</h2>
          <button type="button" onClick={onBack} className="text-gray-500 text-sm">
            ← 主頁
          </button>
        </div>
        <p className="text-sm text-gray-500">
          題庫 {getActiveQuizBank().length} 題 · 版本修復中，挑戰模式稍後恢復
        </p>
        <button
          type="button"
          onClick={() => setView("beyCollection")}
          className="w-full border-2 border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          <span>🌀 陀螺徽章圖鑑</span>
          <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">
            {beyStats.unique}/{beyStats.total}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setView("bankManage")}
          className="w-full border-2 border-teal-400 text-teal-700 font-semibold py-3 rounded-2xl"
        >
          📝 題庫管理及設定
        </button>
        <button
          type="button"
          onClick={() => setView("adventure")}
          className="w-full border-2 border-amber-400 text-amber-700 font-semibold py-3 rounded-2xl"
        >
          🗺️ 冒險地圖
        </button>
        <p className="text-xs text-center text-gray-400">
          挑戰模式與龍虎榜正在修復，圖鑑可正常使用
        </p>
      </div>
    </div>
  );
}
