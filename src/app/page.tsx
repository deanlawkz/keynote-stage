"use client";

import { useEffect, useState } from "react";
import Stage from "@/components/stage/Stage";
import Hud from "@/components/ui/Hud";
import { useDeck } from "@/lib/store";
import { loadScenario } from "@/lib/scenario";
import { loadImage, setFontFamily } from "@/lib/painter";

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [softGpu, setSoftGpu] = useState(false);
  const ready = useDeck((s) => s.scenario !== null);

  // Windows/Chrome могут молча отключить видеокарту — тогда анимация превращается в слайд-шоу. Предупреждаем.
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") ?? c.getContext("webgl");
      if (!gl) return setSoftGpu(true);
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
      if (/swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(r)) setSoftGpu(true);
    } catch {
      /* не критично */
    }
  }, []);

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
      {softGpu && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 max-w-xl rounded-md bg-red-950/80 border border-red-400/40 px-4 py-3 text-[13px] leading-snug text-red-100 z-20">
          Браузер рисует без видеокарты — анимация будет рваной. Включите аппаратное ускорение:
          Chrome/Edge → Настройки → Система → «Использовать графическое ускорение», затем перезапустите браузер.
        </div>
      )}
      {error && (
        <div className="fixed inset-0 grid place-items-center text-white/70 text-sm tracking-wide">{error}</div>
      )}
    </main>
  );
}
