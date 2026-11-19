"use client";

import { useEffect, useState } from "react";
import {
  collectionStats,
  resolveOwned,
  type OwnedBey,
  syncCollectionToBattleApp,
  loadBeyCollection,
} from "@/lib/beyCollection";
import type { BeyBadge } from "@/data/beyBadges";

function buildImageCandidates(badge: BeyBadge): string[] {
  const id = badge.id;
  let base = id;
  while (/[RM]$/.test(base)) base = base.slice(0, -1);
  const list = [
    badge.image,
    `https://beyblade.phstudy.org/images/thumb/site/Blade/${base}.webp`,
    `https://beyblade.phstudy.org/images/thumb/site/Blade/${id}.webp`,
  ];
  return Array.from(new Set(list.filter(Boolean)));
}

function BeyImage({ badge }: { badge: BeyBadge }) {
  const candidates = buildImageCandidates(badge);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = candidates[idx] || "";

  if (failed || !src) {
    return (
      <span className="text-3xl select-none" title={badge.name}>
        🌀
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={badge.name}
      className="w-full h-full object-contain p-1"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (idx + 1 < candidates.length) setIdx(idx + 1);
        else setFailed(true);
      }}
    />
  );
}

function LockedSlot() {
  return (
    <div className="aspect-square rounded-lg bg-black/70 flex items-center justify-center overflow-hidden mb-1.5 border border-white/5">
      <span className="text-3xl opacity-40 select-none" aria-hidden>
        ❓
      </span>
    </div>
  );
}

export default function BeyCollection({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<{ badge: BeyBadge; owned: OwnedBey | null; level?: number }[]>([]);
  const [stats, setStats] = useState({ unique: 0, total: 0, copies: 0, percent: 0, maxDrawLevel: 1 });
  const [filter, setFilter] = useState<"all" | "owned" | "missing">("all");

  const refresh = () => {
    setRows(resolveOwned());
    setStats(collectionStats() as any);
  };

  useEffect(() => {
    try { syncCollectionToBattleApp(loadBeyCollection()); } catch {}
  }, []);
  useEffect(() => { refresh(); }, []);

  const shown = rows.filter((r) => {
    if (filter === "owned") return !!r.owned;
    if (filter === "missing") return !r.owned;
    return true;
  });

  return (
    <div className="min-h-screen p-4 bg-[#0b1220] text-white">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-[#121a2b] rounded-2xl p-4 space-y-3 border border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-cyan-300">🌀 陀螺徽章圖鑑</h2>
            <button type="button" onClick={onBack} className="text-sm text-white/60">← 返回</button>
          </div>
          <p className="text-xs text-white/55 leading-relaxed">
            挑戰答對率達 80% 可抽陀螺。由 Lv.1 起抽；該級收集滿 80% 先開下一級。圖鑑由低至高排列。
          </p>
          <div className="flex gap-3 text-center">
            <div className="flex-1 bg-black/40 rounded-xl py-2">
              <div className="text-xl font-bold text-yellow-300">{stats.unique}/{stats.total}</div>
              <div className="text-[10px] text-white/45">種類</div>
            </div>
            <div className="flex-1 bg-black/40 rounded-xl py-2">
              <div className="text-xl font-bold text-cyan-300">{stats.percent}%</div>
              <div className="text-[10px] text-white/45">完成度</div>
            </div>
            <div className="flex-1 bg-black/40 rounded-xl py-2">
              <div className="text-xl font-bold text-pink-300">Lv.{(stats as any).maxDrawLevel || 1}</div>
              <div className="text-[10px] text-white/45">可抽等級</div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all" style={{ width: `${stats.percent}%` }} />
          </div>
          <div className="flex gap-2 text-xs">
            {([["all", "全部"], ["owned", "已擁有"], ["missing", "未獲得"]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setFilter(k)} className={`flex-1 py-2 rounded-lg border ${filter === k ? "bg-cyan-500 text-slate-900 border-cyan-300 font-bold" : "border-white/15 text-white/70"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {shown.map(({ badge, owned, level }) => (
            <div key={badge.id} className={`rounded-xl p-2 border text-center ${owned ? "bg-[#1a2438] border-cyan-500/40" : "bg-black/40 border-white/5 opacity-60"}`}>
              {owned ? (
                <div className="aspect-square rounded-lg bg-black/50 flex items-center justify-center overflow-hidden mb-1.5">
                  <BeyImage badge={badge} />
                </div>
              ) : (
                <LockedSlot />
              )}
              <div className="text-[10px] leading-tight text-white/90 line-clamp-2 min-h-[2.2em]">
                {owned ? `Lv.${level ?? "?"} ${badge.name}` : "？？？"}
              </div>
              {owned && owned.count > 1 && (
                <div className="text-[10px] text-yellow-300 font-bold">×{owned.count}</div>
              )}
            </div>
          ))}
        </div>

        <p className="text-[10px] text-white/35 text-center leading-relaxed pb-4">
          <a href="https://csfclayton.github.io/beyblade-x-arena/" target="_blank" rel="noopener noreferrer" className="underline text-cyan-500/70">去挑戰塔對戰 →</a>
          · 共 {stats.total} 枚 · 由低至高排列
        </p>
      </div>
    </div>
  );
}
