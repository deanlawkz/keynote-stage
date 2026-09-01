"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";
import { useDeck } from "@/lib/store";
import { slidePos, VIEW_DIST } from "@/lib/shots";

/** Камера летит от слайда к слайду сквозь пространство, чуть дышит и реагирует на мышь */
export default function CameraRig() {
  const pos = useRef(new THREE.Vector3(0, 0, VIEW_DIST + 60));
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const tPos = useRef(new THREE.Vector3());
  const tLook = useRef(new THREE.Vector3());
  const t = useRef(0);

  useFrame(({ camera, pointer }, dt) => {
    const d = Math.min(dt, 0.05);
    t.current += d;
    const { index } = useDeck.getState();
    const p = slidePos(index);
    tPos.current.set(
      p.x + Math.sin(t.current * 0.15) * 0.25 + pointer.x * 1.5,
      p.y + Math.sin(t.current * 0.11) * 0.15 + pointer.y * 0.8,
      p.z + VIEW_DIST + Math.cos(t.current * 0.13) * 0.2
    );
    tLook.current.set(p.x + pointer.x * 0.8, p.y + pointer.y * 0.4, p.z);
    easing.damp3(pos.current, tPos.current, 1.1, d);
    easing.damp3(look.current, tLook.current, 0.9, d);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });
  return null;
}
