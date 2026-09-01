/** Экспорт презентации в видео: автопрогон всех сцен с записью канваса. Файл .webm откроется в любом браузере/VLC */
import { useDeck } from "./store";

export async function recordPresentation(holdSec = 5, onProgress?: (i: number, n: number) => void) {
  const canvas = document.querySelector("canvas");
  const { scenario } = useDeck.getState();
  if (!canvas || !scenario) throw new Error("Нечего записывать");
  const stream = canvas.captureStream(60);
  const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 24_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((res) => (rec.onstop = () => res(new Blob(chunks, { type: "video/webm" }))));

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  useDeck.getState().go(0);
  await wait(1500);
  rec.start(1000);
  const n = scenario.slides.length;
  for (let i = 0; i < n; i++) {
    useDeck.getState().go(i);
    onProgress?.(i, n);
    await wait(holdSec * 1000 + (i ? 3500 : 0)); // время на пролёт + показ
  }
  await wait(1000);
  rec.stop();
  const blob = await done;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${scenario.title || "presentation"}.webm`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}
