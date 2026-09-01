"use client";

import { useEffect, useState } from "react";
import { useDeck } from "@/lib/store";

/** Управление: ←/→, пробел, PgUp/PgDn, клик; F — полный экран. Тонкая полоса прогресса снизу */
export default function Hud() {
  const index = useDeck((s) => s.index);
  const scenario = useDeck((s) => s.scenario);
  const [hint, setHint] = useState(true);
  const n = scenario?.slides.length ?? 0;

  useEffect(() => {
    const { next, prev, go } = useDeck.getState();
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", " ", "PageDown", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
      else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); prev(); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(n - 1);
      else if (e.key.toLowerCase() === "f") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
      setHint(false);
    };
    const onClick = (e: MouseEvent) => {
      if (e.clientX < window.innerWidth * 0.2) prev();
      else next();
      setHint(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    const t = setTimeout(() => setHint(false), 6000);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
      clearTimeout(t);
    };
  }, [n]);

  return (
    <>
      <div className="fixed left-0 right-0 bottom-0 h-[2px] bg-white/10">
        <div className="h-full bg-white/70 transition-[width] duration-700 ease-out" style={{ width: n ? `${((index + 1) / n) * 100}%` : 0 }} />
      </div>
      <div className="fixed right-6 bottom-4 text-[11px] tracking-[0.2em] text-white/40 tabular-nums select-none">
        {n ? `${String(index + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}` : ""}
      </div>
      <div
        className="fixed left-6 bottom-4 text-[11px] tracking-[0.2em] text-white/40 select-none transition-opacity duration-1000"
        style={{ opacity: hint ? 1 : 0 }}
      >
        ← → ЛИСТАТЬ · F ПОЛНЫЙ ЭКРАН
      </div>
    </>
  );
}
