"use client";

import { useEffect, useState } from "react";
import Stage from "@/components/stage/Stage";
import Hud from "@/components/ui/Hud";
import Flat from "@/components/ui/Flat";
import { DEFAULT_ACCENT } from "@/components/stage/Stage";
import { useDeck } from "@/lib/store";
import { loadScenario } from "@/lib/scenario";
import { loadImage, setFontFamily } from "@/lib/painter";
import { recordPresentation } from "@/lib/recorder";

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [softGpu, setSoftGpu] = useState(false);
  const [flat, setFlat] = useState(false);
  const [blank, setBlank] = useState(false);
  const [rec, setRec] = useState<string | null>(null);
  const accent = useDeck((s) => s.scenario?.accent) ?? DEFAULT_ACCENT;
  const ready = useDeck((s) => s.scenario !== null);

  // Windows/Chrome могут молча отключить видеокарту — тогда анимация превращается в слайд-шоу. Предупреждаем.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("flat") === "1") return setFlat(true);
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2");
      if (!gl) return setFlat(true); // WebGL запрещён или нет драйвера — плоский режим
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : "";
      if (/swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(r)) setSoftGpu(true);
    } catch {
      /* не критично */
    }
  }, []);

  // экран не должен гаснуть во время доклада; сайт кэшируется для работы без сети
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const grab = () => nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => {});
    grab();
    const onVis = () => document.visibilityState === "visible" && grab();
    document.addEventListener("visibilitychange", onVis);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sw.js`).catch(() => {});
    }
    // «B» или «.» — чёрный экран (как на пультах и в PowerPoint)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "b" || e.key === "B" || e.key === "." || e.key === "ю") setBlank((v) => !v);
      // Shift+R — записать всю презентацию в видеофайл (страховка от чужих компьютеров)
      if (e.key === "R" && e.shiftKey) {
        const hold = Number(new URLSearchParams(window.location.search).get("hold") || 5);
        setRec("Запись…");
        recordPresentation(hold, (i, n) => setRec(`Запись: сцена ${i + 1} из ${n}`))
          .then(() => setRec(null))
          .catch((err: Error) => setRec(`Ошибка записи: ${err.message}`));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("keydown", onKey);
      lock?.release().catch(() => {});
    };
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
      {flat ? <Flat accent={accent} /> : <Stage />}
      {ready && <Hud />}
      {blank && <div className="fixed inset-0 bg-black z-30" />}
      {rec && <div className="fixed top-4 right-4 rounded bg-red-600/80 px-3 py-1.5 text-[12px] text-white z-20 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white animate-pulse" />{rec}</div>}
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
