"use client";

import { useEffect, useState } from "react";
import Stage from "@/components/stage/Stage";
import Hud from "@/components/ui/Hud";
import { useDeck } from "@/lib/store";
import { loadScenario } from "@/lib/scenario";
import { loadImage, setFontFamily } from "@/lib/painter";

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const ready = useDeck((s) => s.scenario !== null);

  useEffect(() => {
    const name = new URLSearchParams(window.location.search).get("s") || "demo";
    setFontFamily(getComputedStyle(document.body).fontFamily);
    (window as unknown as { __deck: typeof useDeck }).__deck = useDeck; // для отладки в консоли
    loadScenario(name)
      .then(async (sc) => {
        // прогрев картинок и шрифта, чтобы слайды не мигали
        await Promise.allSettled(sc.slides.filter((s) => s.image).map((s) => loadImage(s.image!)));
        await document.fonts.load(`700 100px ${getComputedStyle(document.body).fontFamily}`).catch(() => {});
        useDeck.getState().setScenario(sc);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main>
      <Stage />
      {ready && <Hud />}
      {error && (
        <div className="fixed inset-0 grid place-items-center text-white/70 text-sm tracking-wide">{error}</div>
      )}
    </main>
  );
}
