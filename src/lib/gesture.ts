/**
 * Распознавание свайпа по потоку wheel-событий трекпада: ровно один шаг на жест.
 * Жест = толчок: дельты растут и за 300 мс набирают порог. Инерционный хвост после толчка — дельты убывают,
 * он не считается. Новый толчок поверх хвоста виден как рост дельты (ускорение) или смена направления.
 */
export function createSwipeDetector(opts = { fire: 60, windowMs: 300, silenceMs: 150 }) {
  let armed = true;
  let acc = 0;
  let startT = 0;
  let last = 0;
  let ema = 0; // сглаженная величина дельты — чтобы дрожание хвоста не выглядело ускорением
  let decreasing = false;
  let firedDir = 0;
  const arm = (now: number) => {
    armed = true;
    acc = 0;
    startT = now;
    decreasing = false;
  };
  return {
    /** Принимает горизонтальную дельту и время (мс); возвращает -1 / 0 / 1 */
    feed(dx: number, now: number): -1 | 0 | 1 {
      const abs = Math.abs(dx);
      if (now - last > opts.silenceMs) arm(now); // тишина — точно новый жест
      last = now;
      if (!armed) {
        if (abs < ema) decreasing = true;
        const accelerating = decreasing && abs > ema * 1.8 && abs > 10;
        const reversed = firedDir !== 0 && Math.sign(dx) === -firedDir && abs > 8;
        if (accelerating || reversed) arm(now);
      }
      ema = ema * 0.6 + abs * 0.4;
      if (!armed) return 0;
      if (now - startT > opts.windowMs) {
        // порог не набрался за окно — это не толчок; окно сдвигаем
        acc = 0;
        startT = now;
      }
      acc += dx;
      if (Math.abs(acc) > opts.fire) {
        armed = false;
        decreasing = false;
        firedDir = acc > 0 ? 1 : -1;
        acc = 0;
        return firedDir as 1 | -1;
      }
      return 0;
    },
  };
}
