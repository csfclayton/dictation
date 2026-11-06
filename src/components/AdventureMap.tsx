"use client";

import { useEffect, useState } from "react";
import {
  ADVENTURE_ROUTES,
  type AdventureRouteId,
} from "@/data/adventureMap";
import {
  loadAdventureProgress,
  type AdventureProgress,
} from "@/lib/adventureProgress";

export default function AdventureMap({ onBack }: { onBack: () => void }) {
  const [progress, setProgress] = useState<AdventureProgress>({
    hongkong: 0,
    science: 0,
    clears: 0,
  });
  const [routeId, setRouteId] = useState<AdventureRouteId>("hongkong");
  const [focusIdx, setFocusIdx] = useState(0);

  useEffect(() => {
    const p = loadAdventureProgress();
    setProgress(p);
    setFocusIdx(p.hongkong);
  }, []);

  const route = ADVENTURE_ROUTES.find((r) => r.id === routeId)!;
  const unlocked = progress[routeId];

  const switchRoute = (id: AdventureRouteId) => {
    setRouteId(id);
    setFocusIdx(progress[id]);
  };

  const station = route.stations[focusIdx];
  const isLocked = focusIdx > unlocked;
  const isCurrent = focusIdx === unlocked;
  const isDone = focusIdx < unlocked;

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-3xl shadow-xl p-5 space-y-3 anim-fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-orange-600">🗺️ 冒險地圖</h2>
            <button type="button" onClick={onBack} className="text-sm text-gray-500">
              ← 返回
            </button>
          </div>
          <p className="text-xs text-gray-500">
            完成挑戰（分數 ≥ 40）並選中對應主題，就可以解鎖下一站小故事！
            已完成有效挑戰 <b className="text-orange-600">{progress.clears}</b> 次。
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ADVENTURE_ROUTES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => switchRoute(r.id)}
                className={`py-2.5 rounded-xl text-sm font-semibold border-2 ${
                  routeId === r.id
                    ? r.id === "hongkong"
                      ? "border-rose-400 bg-rose-50 text-rose-700"
                      : "border-sky-400 bg-sky-50 text-sky-700"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                {r.id === "hongkong" ? "🏙️" : "🔬"} {r.name}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400 text-center">
            進度：第 {unlocked + 1} / {route.stations.length} 站
            {unlocked >= route.stations.length - 1 ? " · 🎉 全通關！" : ""}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-5">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {route.stations.map((s, i) => {
              const locked = i > unlocked;
              const current = i === unlocked;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFocusIdx(i)}
                  className={`shrink-0 w-16 flex flex-col items-center gap-1 ${
                    focusIdx === i ? "opacity-100" : "opacity-80"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${
                      locked
                        ? "bg-gray-100 border-gray-200 grayscale"
                        : current
                          ? "bg-orange-100 border-orange-400 anim-soft-pulse"
                          : "bg-green-50 border-green-400"
                    }`}
                  >
                    {locked ? "🔒" : s.emoji}
                  </div>
                  <span className="text-[10px] text-center text-gray-600 leading-tight line-clamp-2">
                    {locked ? "未解鎖" : s.title.replace(/^[^：]*：/, "")}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                routeId === "hongkong" ? "bg-rose-400" : "bg-sky-400"
              }`}
              style={{
                width: `${(unlocked / (route.stations.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        <div
          className={`bg-white rounded-3xl shadow-xl p-6 space-y-3 anim-slide-up border-2 ${
            isLocked
              ? "border-gray-100"
              : isCurrent
                ? "border-orange-300"
                : "border-green-200"
          }`}
        >
          {isLocked ? (
            <>
              <div className="text-center text-4xl">🔒</div>
              <h3 className="text-lg font-bold text-center text-gray-400">尚未解鎖</h3>
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                喺挑戰模式揀主題
                <b className="text-gray-700"> {route.topics.join("／")} </b>
                ，攞至少 <b>40 分</b>，就可以揭開呢一站嘅故事！
              </p>
            </>
          ) : (
            <>
              <div className="text-center text-5xl">{station.emoji}</div>
              <h3 className="text-lg font-bold text-center text-gray-800">
                {station.title}
              </h3>
              <div className="text-center text-xs">
                {isDone && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    已探索
                  </span>
                )}
                {isCurrent && (
                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    目前位置
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-amber-50 rounded-2xl p-4">
                {station.story}
              </p>
              {isCurrent && unlocked < route.stations.length - 1 && (
                <p className="text-xs text-center text-orange-600">
                  再完成一場相關主題挑戰，前往下一站 →
                </p>
              )}
              {unlocked >= route.stations.length - 1 && focusIdx === unlocked && (
                <p className="text-sm text-center text-green-600 font-semibold">
                  🎉 你已經打通呢條路線！
                </p>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full bg-orange-500 text-white font-semibold py-3 rounded-2xl btn-press"
        >
          去挑戰，繼續探險！
        </button>
      </div>
    </div>
  );
}
