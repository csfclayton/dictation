"use client";

import { ALL_TOPICS } from "@/lib/quizHelpers";
import { Confetti, ScorePopup } from "@/components/GameEffects";
import type { QuizQuestion } from "@/data/quizTypes";
import type { BeyBadge } from "@/data/beyBadges";
import type { UnlockResult } from "@/lib/adventureProgress";
import type { LeaderboardEntry } from "@/lib/quizHelpers";
import { loadChallengeSettings } from "@/lib/challengeSettings";
import { deleteLeaderboardEntry } from "@/lib/quizHelpers";

export default function ChallengeRest(p: any) {
  const {
    view, setView, topics, setTopics, list, index, selected, setSelected,
    cScore, wrongs, answered, setAnswered, board, boardLoading, name, setName,
    timeLimit, timeLeft, bgOn, showConfetti, scorePopup, combo, unlocks, rewardBey,
    cloudOn, playClick, startChallenge, advance, clearTimer, stopBg, refreshBoard, APP_VERSION,
  } = p;

  if (view === "challengeSetup") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">
          {APP_VERSION}
        </div>
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-red-600">⚡ 挑戰模式</h2>
            <button onClick={() => setView("menu")} className="text-sm text-gray-500">← 返回</button>
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的名字" className="w-full border-2 rounded-xl px-4 py-3" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">選擇主題</span>
            <span className="space-x-3">
              <button type="button" onClick={() => { playClick(); setTopics([...ALL_TOPICS]); }} className="text-teal-600 underline">全選</button>
              <button type="button" onClick={() => { playClick(); setTopics([]); }} className="text-gray-500 underline">取消全選</button>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_TOPICS.map((topic: string) => (
              <button key={topic} type="button" onClick={() => setTopics((prev: string[]) => prev.includes(topic) ? prev.filter((x) => x !== topic) : [...prev, topic])} className={`px-3 py-1.5 rounded-full text-sm border-2 ${topics.includes(topic) ? "border-red-500 bg-red-50 text-red-800" : "border-gray-200 text-gray-500"}`}>
                {topic}
              </button>
            ))}
          </div>
          <p className="text-xs text-center text-gray-400">答對率達 80% 或以上可抽取陀螺徽章</p>
          <button type="button" onClick={startChallenge} className="w-full bg-red-500 text-white font-semibold py-4 rounded-2xl">開始挑戰（10題）</button>
        </div>
      </div>
    );
  }

  if (view === "challengePlay") {
    const q = list[index];
    if (!q) return null;
    const urgent = timeLeft <= 5;
    return (
      <div className={`min-h-screen p-4 transition-colors duration-300 ${urgent ? "bg-red-100" : "bg-amber-50"}`}>
        <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
        <ScorePopup points={scorePopup} show={scorePopup > 0} />
        <div key={index} className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4 relative">
          {bgOn && <div className="absolute top-3 right-3 text-xs text-teal-500">♪ 音樂中</div>}
          <div className="flex justify-between text-sm items-center pr-14">
            <span>{name}</span>
            <div className="flex items-center gap-2">
              {combo >= 2 && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">🔥 {combo} 連擊</span>}
              <span className="font-bold text-orange-600">{cScore.toFixed(1)} 分</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{index + 1}/{list.length}</span>
            <span className={`text-3xl font-bold tabular-nums ${urgent ? "text-red-600" : "text-teal-600"}`}>{timeLeft}s</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`h-2 rounded-full ${urgent ? "bg-red-500" : "bg-teal-500"}`} style={{ width: `${(timeLeft / timeLimit) * 100}%` }} />
          </div>
          <div className="text-xs text-teal-600">{q.topic}</div>
          <div className="text-xl font-semibold">{q.question}</div>
          <div className="space-y-2">
            {q.options.map((opt: string, i: number) => (
              <button key={i} type="button" disabled={answered} onClick={() => {
                if (answered) return;
                setAnswered(true);
                setSelected(i);
                clearTimer();
                playClick();
                const t = timeLeft;
                setTimeout(() => advance(i, t, list, index, cScore, wrongs), 300);
              }} className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${answered && i === q.answer ? "border-green-500 bg-green-50" : answered && i === selected ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { clearTimer(); stopBg(); setView("menu"); }} className="w-full text-gray-400 text-sm">退出</button>
        </div>
      </div>
    );
  }

  if (view === "challengeResult") {
    return (
      <div className="min-h-screen p-4 bg-amber-50 relative overflow-hidden">
        <div className="fixed bottom-2 right-2 z-50 text-[10px] text-gray-400/80 bg-white/70 backdrop-blur px-1.5 py-0.5 rounded pointer-events-none select-none">{APP_VERSION}</div>
        <Confetti show={showConfetti} />
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <div className="text-center text-5xl">🏆</div>
          <h2 className="text-2xl font-bold text-center text-orange-600">挑戰完成！</h2>
          <div className="text-center text-3xl font-bold text-teal-600">{cScore.toFixed(1)} 分</div>
          {rewardBey && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center space-y-2">
              <div className="text-sm font-bold text-indigo-700">{rewardBey.isNew ? "✨ 新徽章解鎖！" : "🌀 又獲得一枚！"}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={rewardBey.badge.image} alt={rewardBey.badge.name} className="w-24 h-24 object-contain mx-auto" />
              <div className="text-sm font-medium text-indigo-900">{rewardBey.badge.name}</div>
              <div className="flex flex-wrap gap-3 justify-center mt-1">
                <button type="button" onClick={() => setView("beyCollection")} className="text-xs text-indigo-600 underline">查看圖鑑</button>
                <a href="https://csfclayton.github.io/beyblade-x-arena/" className="text-xs font-bold text-cyan-700 underline">去挑戰塔對戰 →</a>
              </div>
            </div>
          )}
          {!rewardBey && wrongs.length > 2 && (
            <p className="text-xs text-center text-gray-400">答對率未達 80%，今次未抽到陀螺徽章</p>
          )}
          {unlocks.length > 0 && (
            <div className="text-sm text-center text-amber-700">地圖解鎖：{unlocks.map((u: any) => u.name || u.id).join("、")}</div>
          )}
          {wrongs.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-bold text-gray-600">錯題回顧</div>
              {wrongs.map((w: any, i: number) => (
                <div key={i} className="text-xs bg-red-50 rounded-xl p-3 border border-red-100">
                  <div className="font-medium">{w.question}</div>
                  <div className="text-green-700">✓ {w.correct}</div>
                  <div className="text-red-600">你選：{w.chosen}</div>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => { playClick(); setView("challengeSetup"); }} className="w-full bg-red-500 text-white font-semibold py-3 rounded-2xl">再挑戰一次</button>
          <button type="button" onClick={() => setView("menu")} className="w-full border-2 border-gray-200 font-semibold py-3 rounded-2xl">返回選單</button>
        </div>
      </div>
    );
  }

  if (view === "leaderboard") {
    return (
      <div className="min-h-screen p-4 bg-amber-50">
        <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-600">🏆 龍虎榜</h2>
            <button onClick={() => setView("menu")} className="text-sm text-gray-500">← 返回</button>
          </div>
          {boardLoading && <p className="text-sm text-gray-400">載入中...</p>}
          {!boardLoading && board.length === 0 && <p className="text-sm text-gray-400">暫無紀錄</p>}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {board.map((e: any, i: number) => (
              <div key={e.id || i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                <div className="text-lg font-bold text-orange-500 w-8">{i + 1}</div>
                <div className="flex-1">
                  <div className="font-semibold">{e.name}</div>
                  <div className="text-xs text-gray-400">{e.topics} · {e.date} {e.time}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-teal-600">{e.score}</div>
                  <div className="text-xs text-gray-400">錯{e.wrongCount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center space-y-4">
        <p className="text-lg">練習模式稍後恢復</p>
        <button type="button" onClick={() => setView("menu")} className="w-full bg-teal-500 text-white font-semibold py-3 rounded-2xl">返回選單</button>
      </div>
    </div>
  );
}
