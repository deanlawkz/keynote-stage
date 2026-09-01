"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { paintSlide, CW, CH } from "@/lib/painter";
import type { Scenario } from "@/lib/scenario";
import { useDeck } from "@/lib/store";
import { PANEL_W, PANEL_H, viewDist, slidePos, slideRot } from "@/lib/shots";

function makeTex() {
  const canvas = document.createElement("canvas");
  canvas.width = CW;
  canvas.height = CH;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 8;
  return { canvas, tex };
}

function Panel({ index, tex, hasImage, layout }: { index: number; tex: THREE.Texture; hasImage: boolean; layout: string }) {
  const VD = viewDist(layout);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const pos = useMemo(() => slidePos(index), [index]);
  const rot = useMemo(() => slideRot(index), [index]);
  useFrame(({ camera }) => {
    if (!mat.current) return;
    // расстояние вдоль маршрута: положительное — слайд впереди, отрицательное — уже пролетели
    const d = camera.position.z - pos.z;
    const active = useDeck.getState().index === index;
    let o: number;
    if (active) {
      // текущий слайд проявляется по мере подлёта; сзади (d<0) не показываем
      o = d < 0 ? 0 : 1 - THREE.MathUtils.smoothstep(d, VD + 8, VD + 45);
    } else {
      // остальные скрыты; предыдущий гаснет, когда камера проходит сквозь него или отлетает
      o = THREE.MathUtils.smoothstep(d, 0.5, 8) * (1 - THREE.MathUtils.smoothstep(d, 24, 42));
    }
    mat.current.opacity = o;
    // ближе — ярче, чтобы бликовало в bloom
    const glow = hasImage ? 0.92 : 1.06 + 0.16 * (1 - THREE.MathUtils.smoothstep(d, 15, 60));
    mat.current.color.setScalar(glow);
  });
  return (
    <mesh position={pos} rotation={rot}>
      <planeGeometry args={[PANEL_W, PANEL_H]} />
      <meshBasicMaterial ref={mat} map={tex} transparent toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Все слайды сценария висят в пространстве вдоль маршрута; рисуются заранее */
export default function Slides({ scenario, accent }: { scenario: Scenario; accent: string }) {
  const [texes, setTexes] = useState<THREE.Texture[]>([]);
  useEffect(() => {
    let alive = true;
    const items = scenario.slides.map(() => makeTex());
    (async () => {
      for (let i = 0; i < items.length; i++) {
        const s = scenario.slides[i];
        await paintSlide(items[i].canvas, s, s.accent ?? accent, true);
        items[i].tex.needsUpdate = true;
        if (alive) setTexes(items.slice(0, i + 1).map((x) => x.tex));
      }
    })();
    return () => {
      alive = false;
      items.forEach((x) => x.tex.dispose());
    };
  }, [scenario, accent]);
  return (
    <>
      {texes.map((t, i) => (
        <Panel key={i} index={i} tex={t} hasImage={!!scenario.slides[i].image} layout={scenario.slides[i].layout} />
      ))}
    </>
  );
}
