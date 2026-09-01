"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { STEP } from "@/lib/shots";

const N = 700;

/** Световые штрихи вдоль маршрута: видны только пока камера летит — ощущение скорости */
export default function Streaks({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const prevZ = useRef<number | null>(null);
  const speed = useRef(0);

  const matrices = useMemo(() => {
    const len = (count + 1) * STEP;
    const o = new THREE.Object3D();
    const arr: THREE.Matrix4[] = [];
    for (let i = 0; i < N; i++) {
      const r = 14 + Math.random() * 50;
      const a = Math.random() * Math.PI * 2;
      o.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.6, -Math.random() * len + 40);
      o.scale.set(1, 1, 6 + Math.random() * 30);
      o.updateMatrix();
      arr.push(o.matrix.clone());
    }
    return arr;
  }, [count]);

  useFrame(({ camera }, dt) => {
    if (mesh.current && mesh.current.count !== N) {
      matrices.forEach((m, i) => mesh.current!.setMatrixAt(i, m));
      mesh.current.instanceMatrix.needsUpdate = true;
      mesh.current.count = N;
    }
    const z = camera.position.z;
    if (prevZ.current !== null && dt > 0) {
      const v = Math.abs(z - prevZ.current) / dt; // м/с
      speed.current = THREE.MathUtils.damp(speed.current, v, 4, dt);
    }
    prevZ.current = z;
    if (mat.current) mat.current.opacity = THREE.MathUtils.clamp((speed.current - 4) / 40, 0, 0.55);
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
      <boxGeometry args={[0.05, 0.05, 1]} />
      <meshBasicMaterial ref={mat} color="#9fb8ff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </instancedMesh>
  );
}
