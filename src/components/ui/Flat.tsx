"use client";

import { useEffect, useRef } from "react";
import { useDeck } from "@/lib/store";
import { paintSlide, CW, CH } from "@/lib/painter";

/** Плоский 2D-режим: без WebGL, обычный кроссфейд. Включается сам, если 3D недоступно, или через ?flat=1 */
export default function Flat({ accent }: { accent: string }) {
  const a = useRef<HTMLCanvasElement>(null);
  const b = useRef<HTMLCanvasElement>(null);
  const front = useRef<"a" | "b">("a");
  const version = useRef(0);

  useEffect(() => {
    const paint = async () => {
      const { scenario, index } = useDeck.getState();
      if (!scenario || !a.current || !b.current) return;
      const my = ++version.current;
      const back = front.current === "a" ? b.current : a.current;
      const fr = front.current === "a" ? a.current : b.current;
      const slide = scenario.slides[index];
      await paintSlide(back, slide, slide.accent ?? accent, false, true);
      if (my !== version.current) return;
      back.style.opacity = "1";
      fr.style.opacity = "0";
      front.current = front.current === "a" ? "b" : "a";
    };
    paint();
    return useDeck.subscribe((s, p) => {
      if (s.index !== p.index || s.scenario !== p.scenario) paint();
    });
  }, [accent]);

  const cls = "absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ease-out";
  return (
    <div className="fixed inset-0 bg-black">
      <canvas ref={a} width={CW} height={CH} className={cls} style={{ opacity: 0 }} />
      <canvas ref={b} width={CW} height={CH} className={cls} style={{ opacity: 0 }} />
    </div>
  );
}
