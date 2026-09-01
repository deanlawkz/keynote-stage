"use client";

import { useEffect, useState } from "react";
import { useDeck } from "@/lib/store";
import { slideImages } from "@/lib/scenario";

/** Управление: ←/→, пробел, PgUp/PgDn, клик; F — полный экран. Справа — линия с чекпойнтами сцен */
let dragged = false;

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
      if (dragged) { dragged = false; return; }
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

  // свайп и зум для карусели картинок: трекпад/колёсико, щипок, тач, перетаскивание мышью
  useEffect(() => {
    const st = useDeck.getState;
    const count = () => {
      const s = st().scenario?.slides[st().index];
      return s ? slideImages(s).length : 0;
    };
    const step = (dir: number) => {
      const n = count();
      if (!n) return;
      st().setCarousel(Math.max(0, Math.min(n - 1, st().carousel + dir)));
    };
    // один шаг на жест: после срабатывания ждём, пока поток событий прекратится (инерция трекпада)
    let acc = 0;
    let armed = true;
    let idle: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      if (!count()) return;
      e.preventDefault();
      if (e.ctrlKey || Math.abs(e.deltaY) > Math.abs(e.deltaX) * 2.5) {
        // щипок (ctrl+wheel) или явно вертикальное колёсико — зум
        st().setZoom(st().zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025)));
        return;
      }
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => {
        acc = 0;
        armed = true;
      }, 250);
      if (!armed) return;
      acc += e.deltaX;
      if (Math.abs(acc) > 25) {
        step(acc > 0 ? 1 : -1);
        acc = 0;
        armed = false;
      }
    };
    // тач: один палец — свайп, два — щипок
    let tx = 0, tdist = 0, tzoom = 1;
    const onTS = (e: TouchEvent) => {
      if (!count()) return;
      if (e.touches.length === 1) tx = e.touches[0].clientX;
      if (e.touches.length === 2) {
        tdist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        tzoom = st().zoom;
      }
    };
    const onTM = (e: TouchEvent) => {
      if (!count()) return;
      e.preventDefault();
      if (e.touches.length === 2 && tdist) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        st().setZoom((tzoom * d) / tdist);
      }
    };
    const onTE = (e: TouchEvent) => {
      if (!count() || e.changedTouches.length !== 1 || tdist) { tdist = 0; return; }
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    };
    // мышь: перетаскивание
    let mx: number | null = null;
    const onMD = (e: MouseEvent) => { if (count()) mx = e.clientX; };
    const onMU = (e: MouseEvent) => {
      if (mx === null) return;
      const dx = e.clientX - mx;
      mx = null;
      if (Math.abs(dx) > 60) { step(dx < 0 ? 1 : -1); dragged = true; }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchmove", onTM, { passive: false });
    window.addEventListener("touchend", onTE);
    window.addEventListener("mousedown", onMD);
    window.addEventListener("mouseup", onMU);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchmove", onTM);
      window.removeEventListener("touchend", onTE);
      window.removeEventListener("mousedown", onMD);
      window.removeEventListener("mouseup", onMU);
    };
  }, []);

  const carousel = useDeck((s) => s.carousel);
  const imgCount = scenario ? slideImages(scenario.slides[index]).length : 0;

  const slides = scenario?.slides ?? [];

  return (
    <>
      {/* вертикальная линия с точками-сценами и бегущим индикатором */}
      <nav data-nav className="fixed right-6 top-1/2 -translate-y-1/2 select-none z-10">
        <div className="relative w-px bg-white/25" style={{ height: `${Math.max(1, n - 1) * 36}px` }}>
          {slides.map((_, i) => (
            <button
              key={i}
              data-nav
              onClick={() => useDeck.getState().go(i)}
              aria-label={`Сцена ${i + 1}`}
              className="absolute -left-[3px] w-[7px] h-[7px] -translate-y-1/2 rounded-full bg-white/45 hover:bg-white transition-colors"
              style={{ top: `${n > 1 ? (i / (n - 1)) * 100 : 0}%` }}
            />
          ))}
          {/* индикатор текущей сцены — плавно едет по линии */}
          <div
            className="absolute -left-[6px] w-[13px] h-[13px] -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-[top] duration-700 ease-out pointer-events-none"
            style={{ top: `${n > 1 ? (index / (n - 1)) * 100 : 0}%` }}
          />
        </div>
      </nav>
      {imgCount > 1 && (
        <div data-nav className="fixed left-1/2 -translate-x-1/2 bottom-5 flex gap-2 items-center select-none">
          {Array.from({ length: imgCount }, (_, k) => (
            <button
              key={k}
              data-nav
              onClick={() => useDeck.getState().setCarousel(k)}
              className={`h-[6px] rounded-full transition-all duration-500 ${k === carousel ? "w-6 bg-white/85" : "w-[6px] bg-white/30"}`}
            />
          ))}
        </div>
      )}
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
