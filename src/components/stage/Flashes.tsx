"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDeck } from "@/lib/store";
import { STEP, slidePos } from "@/lib/shots";

function flareTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.08, "rgba(255,255,255,0.9)");
  g.addColorStop(0.3, "rgba(255,255,255,0.18)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const N = 45;

/** Вспышки света в пустоте: медленно пульсирующие источники + взрыв света при смене слайда */
export default function Flashes({ count, accent }: { count: number; accent: string }) {
  const tex = useMemo(flareTexture, []);
  const seeds = useMemo(() => {
    const len = (count + 1) * STEP;
    return Array.from({ length: N }, (_, i) => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 70, -Math.random() * len + 30),
      phase: Math.random() * Math.PI * 2,
      speed: 0.04 + Math.random() * 0.12,
      size: 1.2 + Math.random() * 4,
      warm: Math.random() < 0.35,
      i,
    }));
  }, [count]);
  const sprites = useRef<(THREE.Sprite | null)[]>([]);
  const burst = useRef({ t: 10, pos: new THREE.Vector3() });
  const burstRef = useRef<THREE.Sprite>(null);
  const accentCol = useMemo(() => new THREE.Color(accent), [accent]);
  const warmCol = useMemo(() => new THREE.Color("#ffd9a8"), []);
  const coolCol = useMemo(() => new THREE.Color("#cfe0ff"), []);

  useEffect(
    () =>
      useDeck.subscribe((s, p) => {
        if (s.index !== p.index) {
          burst.current.t = 0;
          burst.current.pos.copy(slidePos(s.index)).add(new THREE.Vector3((Math.random() - 0.5) * 30, 8 + Math.random() * 6, -12));
        }
      }),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      const sp = sprites.current[i];
      if (!sp) return;
      // медленное дыхание света, без резких пиков
      const k = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const m = sp.material as THREE.SpriteMaterial;
      m.opacity = 0.02 + k * 0.08;
      const sc = s.size * (1.5 + k);
      sp.scale.set(sc, sc, 1);
    });
    // взрыв света при смене слайда
    burst.current.t += dt;
    const b = burstRef.current;
    if (b) {
      const e = Math.exp(-burst.current.t * 2.2);
      const m = b.material as THREE.SpriteMaterial;
      m.opacity = Math.min(1, e * 0.18);
      const sc = 20 + (1 - e) * 70;
      b.scale.set(sc, sc, 1);
      b.position.copy(burst.current.pos);
    }
  });

  return (
    <group>
      {seeds.map((s, i) => (
        <sprite key={i} position={s.pos} ref={(el) => (sprites.current[i] = el)}>
          <spriteMaterial map={tex} color={s.warm ? warmCol : coolCol} transparent opacity={0.02} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
      <sprite ref={burstRef} scale={[0, 0, 1]}>
        <spriteMaterial map={tex} color={accentCol} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}
