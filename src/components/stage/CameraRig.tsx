"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";
import { useDeck } from "@/lib/store";
import { slidePos, VIEW_DIST, viewDist, IMG_H, IMG_GAP } from "@/lib/shots";
import { slideImages } from "@/lib/scenario";
import { imageCache } from "@/lib/imageCache";

/** Камера летит от слайда к слайду сквозь пространство, чуть дышит и реагирует на мышь */
export default function CameraRig() {
  const pos = useRef(new THREE.Vector3(0, 0, VIEW_DIST + 60));
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const tPos = useRef(new THREE.Vector3());
  const tLook = useRef(new THREE.Vector3());
  const t = useRef(0);

  useFrame(({ camera, pointer }, dt) => {
    const d = Math.min(dt, 0.1);
    t.current += d;
    const { index, scenario, carousel, zoom } = useDeck.getState();
    const p = slidePos(index).clone();
    const slide = scenario?.slides[index];
    let dist = viewDist(slide?.layout);
    // карусель: центр на активной картинке, зум — подлёт ближе
    const imgs = slide ? slideImages(slide) : [];
    if (imgs.length) {
      const widths = imgs.map((src) => IMG_H * (imageCache.get(src) ?? 16 / 9));
      const total = widths.reduce((a, b) => a + b, 0) + IMG_GAP * (widths.length - 1);
      let x = -total / 2;
      for (let k = 0; k < carousel && k < widths.length; k++) x += widths[k] + IMG_GAP;
      x += (widths[carousel] ?? 0) / 2;
      p.x += x;
      p.y -= 0.6;
      dist = dist / zoom;
    }
    tPos.current.set(
      p.x + Math.sin(t.current * 0.15) * 0.25 + pointer.x * 1.5,
      p.y + Math.sin(t.current * 0.11) * 0.15 + pointer.y * 0.8,
      p.z + dist + Math.cos(t.current * 0.13) * 0.2
    );
    tLook.current.set(p.x + pointer.x * 0.8, p.y + pointer.y * 0.4, p.z);
    easing.damp3(pos.current, tPos.current, 1.1, d);
    easing.damp3(look.current, tLook.current, 0.9, d);
    // прилетели — можно листать карусель
    useDeck.getState().setFlying(pos.current.distanceTo(tPos.current) > 1.2);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });
  return null;
}
