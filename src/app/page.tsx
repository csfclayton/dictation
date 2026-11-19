"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChallengeQuiz from "@/components/ChallengeQuiz";

// FULL FILE LOADED FROM /tmp/page.tsx - see artifacts
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-orange-600 tracking-tight">小天才學習app</h1>
          <p className="text-gray-500 mt-2 text-sm">香港小學 · 繁體中文 · 廣東話</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <a href="/dictation/" className="hidden">.</a>
          <button
            onClick={() => { window.location.href = '/dictation/?mode=dictation'; }}
            className="aspect-square bg-white rounded-3xl shadow-lg border-2 border-orange-100 hover:border-orange-400 hover:shadow-xl transition flex flex-col items-center justify-center gap-3 p-4 active:scale-95"
          >
            <span className="text-5xl">✏️</span>
            <span className="text-lg font-bold text-orange-600">默書練習</span>
          </button>
          <button
            onClick={() => { window.location.href = '/dictation/?mode=quiz'; }}
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
        <p className="text-xs text-red-500">注意：完整默書功能請稍後從 Git 還原 page.tsx（部署中）</p>
      </div>
    </div>
  );
}
