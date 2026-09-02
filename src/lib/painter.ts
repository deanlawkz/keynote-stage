/** Рисует слайд в 2D-канвас (2560×1440) — это текстура LED-экрана */
import type { Slide } from "./scenario";
import { asset } from "./scenario";

export const CW = 3840;
export const CH = 1320;

const imgCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string) {
  const url = asset(src);
  let p = imgCache.get(url);
  if (!p) {
    p = new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => res(im);
      im.onerror = () => rej(new Error(`Не загрузилась картинка ${url}`));
      im.src = url;
    });
    imgCache.set(url, p);
  }
  return p;
}

let fontFamily = "Inter, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif";
export function setFontFamily(f: string) {
  fontFamily = f;
}
const font = (w: number, px: number) => `${w} ${px}px ${fontFamily}`;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > maxW && line) {
        out.push(line);
        line = w;
      } else line = t;
    }
    out.push(line);
  }
  return out;
}

function lines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  size: number,
  weight: number,
  color: string,
  lh = 1.18,
  align: CanvasTextAlign = "left"
) {
  ctx.font = font(weight, size);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  const ls = wrap(ctx, text, maxW);
  ls.forEach((l, i) => ctx.fillText(l, x, y + i * size * lh));
  return y + ls.length * size * lh;
}

function background(ctx: CanvasRenderingContext2D, accent: string) {
  const g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, "#06080e");
  g.addColorStop(1, "#02030a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
  // мягкое свечение акцента
  const r = ctx.createRadialGradient(CW * 0.15, CH * 0.1, 0, CW * 0.15, CH * 0.1, CW * 0.7);
  r.addColorStop(0, hexA(accent, 0.22));
  r.addColorStop(1, hexA(accent, 0));
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, CW, CH);
  const r2 = ctx.createRadialGradient(CW * 0.9, CH * 1.05, 0, CW * 0.9, CH * 1.05, CW * 0.6);
  r2.addColorStop(0, "rgba(255,255,255,0.05)");
  r2.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = r2;
  ctx.fillRect(0, 0, CW, CH);
}

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const WHITE = "#f4f6fb";
const MUTED = "#9aa5bb";
const PAD = 380; // запас по краям: панель шире кадра на узких экранах

/** Средний цвет картинки — им экран «светит» на зал */
export function averageColor(canvas: HTMLCanvasElement): [number, number, number] {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 8;
  const x = c.getContext("2d")!;
  x.drawImage(canvas, 0, 0, 8, 8);
  const d = x.getImageData(0, 0, 8, 8).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  return [r / n / 255, g / n / 255, b / n / 255];
}

export async function paintSlide(canvas: HTMLCanvasElement, slide: Slide, accent: string, transparent = false, withImages = false) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = CW;
  canvas.height = CH;
  await document.fonts.ready;
  ctx.clearRect(0, 0, CW, CH);
  if (!transparent) background(ctx, accent);

  const s = slide;
  if (s.layout === "title") {
    let y = CH * 0.42;
    if (s.kicker) {
      ctx.font = font(500, 54);
      ctx.fillStyle = accent;
      ctx.textAlign = "center";
      ctx.letterSpacing = "12px";
      ctx.fillText(s.kicker.toUpperCase(), CW / 2, y - 200);
      ctx.letterSpacing = "0px";
    }
    y = lines(ctx, s.title ?? "", CW / 2, y, CW - PAD * 2, 250, 700, WHITE, 1.08, "center");
    if (s.subtitle) lines(ctx, s.subtitle, CW / 2, y + 50, CW - PAD * 2, 78, 400, MUTED, 1.25, "center");
    ctx.fillStyle = accent;
    ctx.fillRect(CW / 2 - 70, CH * 0.42 - 300, 140, 6);
  }

  if (s.layout === "section") {
    if (s.kicker) {
      ctx.font = font(600, 56);
      ctx.fillStyle = accent;
      ctx.textAlign = "left";
      ctx.fillText(s.kicker, PAD, CH * 0.38);
    }
    const y = lines(ctx, s.title ?? "", PAD, CH * 0.38 + 190, CW - PAD * 2, 190, 700, WHITE, 1.05);
    if (s.subtitle) lines(ctx, s.subtitle, PAD, y + 50, CW - PAD * 2, 60, 400, MUTED);
  }

  if (s.layout === "bullets") {
    let y = 300;
    if (s.kicker) {
      ctx.font = font(500, 40);
      ctx.fillStyle = accent;
      ctx.textAlign = "left";
      ctx.letterSpacing = "8px";
      ctx.fillText(s.kicker.toUpperCase(), PAD, y - 120);
      ctx.letterSpacing = "0px";
    }
    y = lines(ctx, s.title ?? "", PAD, y, CW - PAD * 2, 128, 700, WHITE, 1.1);
    y += 90;
    for (const b of s.bullets ?? []) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(PAD + 18, y - 24, 12, 0, Math.PI * 2);
      ctx.fill();
      y = lines(ctx, b, PAD + 80, y, CW - PAD * 2 - 80, 76, 400, "#dfe4ee", 1.3) + 34;
    }
  }

  if (s.layout === "stat") {
    let y = 300;
    if (s.title) y = lines(ctx, s.title, PAD, y, CW - PAD * 2, 100, 700, WHITE, 1.1) + 60;
    const stats = s.stats ?? [];
    const n = Math.max(1, stats.length);
    const colW = (CW - PAD * 2) / n;
    const baseY = Math.max(y + 300, CH * 0.62);
    stats.forEach((st, i) => {
      const cx = PAD + colW * i + colW / 2;
      // размер цифры подбирается под ширину колонки — «≈5,5 млн» не наезжает на соседа
      let fs = n > 3 ? 190 : 250;
      ctx.font = font(700, fs);
      while (fs > 80 && ctx.measureText(st.value).width > colW - 70) {
        fs -= 8;
        ctx.font = font(700, fs);
      }
      ctx.fillStyle = accent;
      ctx.textAlign = "center";
      ctx.fillText(st.value, cx, baseY);
      lines(ctx, st.label, cx, baseY + 110, colW - 60, 50, 400, MUTED, 1.25, "center");
      if (i > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.fillRect(PAD + colW * i, baseY - 320, 2, 480);
      }
    });
  }

  if (s.layout === "media") {
    // в 3D картинки — отдельные панели (карусель); в плоском режиме рисуем их здесь в ряд
    const M = 120;
    let y = M;
    if (s.title) y = lines(ctx, s.title, M, y + 56, CW - M * 2, 60, 600, WHITE, 1.1) + 24;
    if (s.caption) lines(ctx, s.caption, CW / 2, CH - 48, CW - PAD * 2, 40, 400, MUTED, 1.2, "center");
    const srcs = s.images?.length ? s.images : s.image ? [s.image] : [];
    if (withImages && srcs.length) {
      const boxY = y;
      const boxH = CH - boxY - (s.caption ? 130 : M * 0.5);
      const boxW = CW - M * 2;
      const gap = 60;
      const ims = await Promise.all(srcs.map((src) => loadImage(src).catch(() => null)));
      const ok = ims.filter((im): im is HTMLImageElement => !!im);
      // общий масштаб: все картинки одной высоты, ряд помещается по ширине
      let h = boxH;
      let total = () => ok.reduce((a, im) => a + (im.width / im.height) * h, 0) + gap * (ok.length - 1);
      if (total() > boxW) h *= boxW / total();
      let x = CW / 2 - total() / 2;
      for (const im of ok) {
        const w = (im.width / im.height) * h;
        const yy = boxY + (boxH - h) / 2;
        ctx.save();
        roundRect(ctx, x, yy, w, h, 24);
        ctx.clip();
        ctx.drawImage(im, x, yy, w, h);
        ctx.restore();
        x += w + gap;
      }
    }
  }

  if (s.layout === "quote") {
    ctx.font = font(700, 420);
    ctx.fillStyle = hexA(accent, 0.35);
    ctx.textAlign = "left";
    ctx.fillText("“", PAD - 40, 520);
    const y = lines(ctx, s.quote ?? "", PAD + 60, 560, CW - PAD * 2 - 60, 92, 500, WHITE, 1.25);
    if (s.author) lines(ctx, `— ${s.author}`, PAD + 60, y + 70, CW - PAD * 2, 54, 400, accent);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
