"use client";

export function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const colors = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#a855f7", "#ec4899"];
  return (
    <>
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[i % colors.length],
            animationDuration: `${1.5 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 0.5}s`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </>
  );
}

export function ScorePopup({ points, show }: { points: number; show: boolean }) {
  if (!show || points <= 0) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="anim-score-float text-4xl font-black text-orange-500 drop-shadow-lg">
        +{points.toFixed(1)}
      </div>
    </div>
  );
}
