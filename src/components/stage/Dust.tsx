"use client";

import { useMemo } from "react";
import * as THREE from "three";

/** Неподвижная пыль в пространстве — статичные точки, ничего не мигает */
export default function Dust({ length }: { length: number }) {
  const geo = useMemo(() => {
    const n = 2500;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 140;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = -Math.random() * length + 40;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [length]);
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#8fa3d9" size={0.1} sizeAttenuation transparent opacity={0.4} depthWrite={false} />
    </points>
  );
}
