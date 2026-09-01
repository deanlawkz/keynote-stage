"use client";

import { useEffect, useState } from "react";
import { useDeck } from "@/lib/store";

/** Управление: ←/→, пробел, PgUp/PgDn, клик; F — полный экран. Справа — линия с чекпойнтами сцен */
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
      if ((e.target as HTMLElement).closest("[data-nav]")) return;
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

  const slides = scenario?.slides ?? [];
  const label = (i: number) => slides[i].title ?? slides[i].quote ?? `Сцена ${i + 1}`;

  return (
    <>
      {/* вертикальная линия с чекпойнтами */}
      <nav data-nav className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col items-center select-none">
        <div className="relative w-px bg-white/15" style={{ height: `${Math.max(1, n - 1) * 34}px` }}>
          <div className="absolute left-0 top-0 w-px bg-white/70 transition-[height] duration-700 ease-out" style={{ height: `${n > 1 ? (index / (n - 1)) * 100 : 0}%` }} />
          {slides.map((_, i) => (
            <button
              key={i}
              data-nav
              onClick={() => useDeck.getState().go(i)}
              title={label(i)}
              aria-label={label(i)}
              className="group absolute -left-[7px] flex items-center"
              style={{ top: `${n > 1 ? (i / (n - 1)) * 100 : 0}%`, transform: "translateY(-50%)" }}
            >
              <span
                className={`block rounded-full border transition-all duration-500 ${
                  i === index ? "w-[15px] h-[15px] bg-white border-white shadow-[0_0_14px_rgba(255,255,255,0.8)]" : i < index ? "w-[9px] h-[9px] bg-white/70 border-white/70 mx-[3px]" : "w-[9px] h-[9px] bg-transparent border-white/35 mx-[3px]"
                }`}
              />
              <span className="pointer-events-none absolute right-7 whitespace-nowrap text-[11px] tracking-[0.15em] uppercase text-white/0 group-hover:text-white/70 transition-colors">
                {label(i)}
              </span>
            </button>
          ))}
        </div>
      </nav>
      <div className="fixed right-8 bottom-4 text-[11px] tracking-[0.2em] text-white/40 tabular-nums select-none">
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
