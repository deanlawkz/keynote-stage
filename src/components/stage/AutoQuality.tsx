"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useDeck } from "@/lib/store";

/**
 * Слабый компьютер в зале: если кадров < 40/с, ступенчато снижаем качество — сначала разрешение и SMAA,
 * потом всю постобработку. Только вниз, без дёрганья туда-сюда. Первые 3 с не считаем (компиляция шейдеров).
 */
export default function AutoQuality() {
  const setDpr = useThree((s) => s.setDpr);
  const frames = useRef(0);
  const acc = useRef(0);
  const age = useRef(0);
  const level = useRef(0);

  useFrame((_, dt) => {
    age.current += dt;
    if (age.current < 3 || document.hidden) return;
    frames.current++;
    acc.current += dt;
    if (acc.current < 1.5) return;
    const fps = frames.current / acc.current;
    frames.current = 0;
    acc.current = 0;
    if (fps >= 40 || level.current >= 2) return;
    level.current++;
    if (level.current === 1) {
      setDpr(1);
      useDeck.getState().setPostMode("bloom");
      console.info(`Keynote Stage: ${fps.toFixed(0)} fps — снижаю разрешение и отключаю сглаживание`);
    } else {
      useDeck.getState().setPostMode("none");
      console.info(`Keynote Stage: ${fps.toFixed(0)} fps — отключаю постобработку`);
    }
  });
  return null;
}
