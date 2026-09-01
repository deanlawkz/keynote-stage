import * as THREE from "three";

/** Панель слайда в метрах (пропорция как у канваса 3840×1320) */
export const PANEL_W = 32;
export const PANEL_H = 11;
/** Раскладка карусели: высота картинки и зазор в метрах */
export const IMG_H = 7.2;
export const IMG_GAP = 1.6;
/** Расстояние между слайдами по маршруту */
export const STEP = 48;
/** Угол обзора камеры по вертикали, градусы */
export const FOV = 55;
/** Запас по краям кадра (1.08 = 8 %) */
const MARGIN = 1.1;

/** Расстояние, с которого прямоугольник w×h целиком помещается в кадр при данных пропорциях экрана */
export function fitDistance(w: number, h: number, aspect: number) {
  const t = Math.tan((FOV / 2) * (Math.PI / 180));
  return Math.max(((h / 2) * MARGIN) / t, ((w / 2) * MARGIN) / (t * aspect));
}

/** Дистанция до обычного слайда: панель целиком в кадре на любом экране (4:3, 16:9, 21:9, вертикальный) */
export function viewDist(layout: string | undefined, aspect: number) {
  // текст живёт внутри полей панели — вписываем чуть меньше самой панели
  return fitDistance(PANEL_W * 0.86, PANEL_H, aspect); // по высоте — вся панель, иначе на 32:9 срезает
}

/** Дистанция до активной картинки карусели: картинка + заголовок над ней */
export function mediaDist(imgW: number, aspect: number) {
  return fitDistance(imgW * 1.04, IMG_H + 3.2, aspect);
}

/** Положение i-го слайда: маршрут слегка вьётся, чтобы пролёт не был прямой трубой */
export function slidePos(i: number) {
  return new THREE.Vector3(Math.sin(i * 1.9) * 7, Math.cos(i * 1.3) * 3.5, -i * STEP);
}
/** Небольшой разворот панели — к маршруту камеры */
export function slideRot(i: number) {
  return new THREE.Euler(Math.cos(i * 1.3) * 0.04, -Math.sin(i * 1.9) * 0.12, 0);
}

/** Прозрачность слайда по расстоянию камеры d вдоль маршрута (активный проявляется при подлёте, остальные скрыты) */
export function slideOpacity(d: number, active: boolean, vd: number) {
  if (active) return d < 0 ? 0 : 1 - THREE.MathUtils.smoothstep(d, vd + 8, vd + 45);
  return THREE.MathUtils.smoothstep(d, 0.5, 8) * (1 - THREE.MathUtils.smoothstep(d, 24, 42));
}

