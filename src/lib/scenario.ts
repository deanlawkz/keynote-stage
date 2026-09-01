/** Формат сценария презентации: JSON в public/scenarios/<name>.json */

export type Shot = "wide" | "medium" | "close" | "left" | "right" | "low";
export type Env = "stage" | "space";

export type Stat = { value: string; label: string };

export type Slide = {
  layout: "title" | "section" | "bullets" | "stat" | "media" | "quote";
  kicker?: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  stats?: Stat[];
  image?: string;
  /** несколько картинок — карусель: свайп листает, колёсико/щипок — зум */
  images?: string[];
  caption?: string;
  quote?: string;
  author?: string;
  /** ракурс камеры для этого слайда */
  shot?: Shot;
  /** цвет акцента, переопределяет сценарий */
  accent?: string;
};

export type Scenario = {
  title: string;
  env?: Env;
  accent?: string;
  slides: Slide[];
};

/** Список картинок слайда (одна или карусель) */
export function slideImages(s: Slide): string[] {
  return s.images?.length ? s.images : s.image ? [s.image] : [];
}

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Абсолютный URL к файлу из public/ с учётом basePath */
export function asset(p: string) {
  if (/^https?:\/\//.test(p)) return p;
  return `${BASE}${p.startsWith("/") ? p : `/${p}`}`;
}

export async function loadScenario(name: string): Promise<Scenario> {
  // сначала вшитые в сборку (работают без сети), потом — файл (для правок без пересборки)
  const { SCENARIOS } = await import("@/generated/scenarios");
  let sc: Scenario | undefined = SCENARIOS[name];
  try {
    const res = await fetch(asset(`/scenarios/${name}.json`), { cache: "no-store" });
    if (res.ok) sc = (await res.json()) as Scenario;
  } catch {
    /* офлайн — используем вшитый */
  }
  if (!sc) throw new Error(`Сценарий «${name}» не найден`);
  if (!Array.isArray(sc.slides) || sc.slides.length === 0) throw new Error("В сценарии нет слайдов");
  return sc;
}

/** Ракурс по умолчанию, если в слайде не задан: чередуем, чтобы камера жила */
export function defaultShot(i: number, layout: Slide["layout"]): Shot {
  if (layout === "title") return "wide";
  if (layout === "media") return "close";
  if (layout === "stat") return "medium";
  const cycle: Shot[] = ["medium", "left", "close", "right", "low"];
  return cycle[i % cycle.length];
}
