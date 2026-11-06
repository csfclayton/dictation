"use client";

import { useEffect, useState } from "react";
import {
  collectionStats,
  resolveOwned,
  type OwnedBey,
} from "@/lib/beyCollection";
import type { BeyBadge } from "@/data/beyBadges";

export default function BeyCollection({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<{ badge: BeyBadge; owned: OwnedBey | null }[]>(
    []
  );
  const [stats, setStats] = useState({
    unique: 0,
    total: 0,
    copies: 0,
    percent: 0,
  });
  const [filter, setFilter] = useState<"all" | "owned" | "missing">("all");

  const refresh = () => {
    setRows(resolveOwned());
    setStats(collectionStats());
  };

  useEffect(() => {
    refresh();
  }, []);

  const shown = rows.filter((r) => {
    if (filter === "owned") return !!r.owned;
    if (filter === "missing") return !r.owned;
    return true;
  });

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-slate-900 to-indigo-950 text-white">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white/10 backdrop-blur rounded-3xl p-5 space-y-3 border border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-yellow-300">🌀 陀螺徽章圖鑑</h2>
            <button type="button" onClick={onBack} className="text-sm text-white/60">
              ← 返回
            </button>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            每完成一次挑戰就會隨機獲得一枚陀螺徽章。收集越多越齊全！
          </p>
          <div className="flex gap-3 text-center">
            <div className="flex-1 bg-black/30 rounded-2xl py-2">
              <div className="text-2xl font-bold text-yellow-300">
                {stats.unique}/{stats.total}
              </div>
              <div className="text-[10px] text-white/50">種類</div>
            </div>
            <div className="flex-1 bg-black/30 rounded-2xl py-2">
              <div className="text-2xl font-bold text-cyan-300">{stats.percent}%</div>
              <div className="text-[10px] text-white/50">完成度</div>
            </div>
            <div className="flex-1 bg-black/30 rounded-2xl py-2">
              <div className="text-2xl font-bold text-pink-300">{stats.copies}</div>
              <div className="text-[10px] text-white/50">總枚數</div>
            </div>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <div className="flex gap-2 text-xs">
            {(
              [
                ["all", "全部"],
                ["owned", "已擁有"],
                ["missing", "未獲得"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`flex-1 py-2 rounded-xl border ${
                  filter === k
                    ? "bg-yellow-400 text-slate-900 border-yellow-300 font-bold"
                    : "border-white/20 text-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {shown.map(({ badge, owned }) => (
            <div
              key={badge.id}
              className={`rounded-2xl p-2 border text-center ${
                owned
                  ? "bg-white/15 border-yellow-400/40"
                  : "bg-black/20 border-white/5 opacity-50 grayscale"
              }`}
            >
              <div className="aspect-square rounded-xl bg-black/40 flex items-center justify-center overflow-hidden mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={badge.image}
                  alt={badge.name}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    if (el.parentElement) el.parentElement.innerHTML = '<span class="text-3xl">🌀</span>';
                  }}
                />
              </div>
              <div className="text-[10px] leading-tight text-white/90 line-clamp-2 min-h-[2.2em]">
                {owned ? badge.name : "？？？"}
              </div>
              {owned && owned.count > 1 && (
                <div className="text-[10px] text-yellow-300 font-bold">×{owned.count}</div>
              )}
            </div>
          ))}
        </div>

        <p className="text-[10px] text-white/40 text-center leading-relaxed">
          徽章圖片來源：
          <a
            href="https://beyblade.phstudy.org/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            beyblade.phstudy.org
          </a>
          （僅供學習收集展示）
        </p>
      </div>
    </div>
  );
}
