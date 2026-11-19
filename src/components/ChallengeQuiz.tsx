"use client";

import { useState } from "react";
import { collectionStats } from "@/lib/beyCollection";
import BeyCollection from "@/components/BeyCollection";

export default function ChallengeQuiz({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<"menu" | "beyCollection">("menu");
  const beyStats = collectionStats();

  if (view === "beyCollection") {
    return <BeyCollection onBack={() => setView("menu")} />;
  }

  return (
    <div className="min-h-screen p-4 bg-amber-50">
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-teal-600">🧠 常識問答</h2>
          <button onClick={onBack} className="text-gray-500 text-sm">← 主頁</button>
        </div>
        <p className="text-sm text-gray-500">完整挑戰模式可稍後從 Git 還原。而家可睇圖鑑同去挑戰塔。</p>
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
        <a
          href="https://csfclayton.github.io/beyblade-x-arena/"
          className="w-full border-2 border-cyan-500 bg-gradient-to-r from-cyan-50 to-indigo-50 text-cyan-800 font-semibold py-3 rounded-2xl flex items-center justify-center gap-2"
        >
          ⚔️ 挑戰塔對戰
        </a>
      </div>
    </div>
  );
}
