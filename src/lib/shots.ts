import * as THREE from "three";

/** Панель слайда в метрах (пропорция как у канваса 3840×1320) */
export const PANEL_W = 32;
export const PANEL_H = 11;
/** Расстояние между слайдами по маршруту */
export const STEP = 48;
/** Где камера останавливается перед слайдом */
export const VIEW_DIST = 19;

/** Положение i-го слайда: маршрут слегка вьётся, чтобы пролёт не был прямой трубой */
export function slidePos(i: number) {
  return new THREE.Vector3(Math.sin(i * 1.9) * 7, Math.cos(i * 1.3) * 3.5, -i * STEP);
}
/** Небольшой разворот панели — к маршруту камеры */
export function slideRot(i: number) {
  return new THREE.Euler(Math.cos(i * 1.3) * 0.04, -Math.sin(i * 1.9) * 0.12, 0);
}
