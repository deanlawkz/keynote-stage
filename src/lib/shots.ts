import * as THREE from "three";

/** Панель слайда в метрах (пропорция как у канваса 3840×1320) */
export const PANEL_W = 32;
export const PANEL_H = 11;
/** Расстояние между слайдами по маршруту */
export const STEP = 48;
/** Где камера останавливается перед слайдом */
export const VIEW_DIST = 15.5;
/** К слайдам с картинкой подлетаем ближе, чтобы скриншот читался */
export function viewDist(layout?: string) {
  return layout === "media" ? 12.5 : VIEW_DIST;
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

/** Раскладка карусели: высота картинки и зазор в метрах */
export const IMG_H = 7.2;
export const IMG_GAP = 1.6;
