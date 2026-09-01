"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { paintSlide, CW, CH } from "@/lib/painter";
import type { Scenario } from "@/lib/scenario";
import { useDeck } from "@/lib/store";
import { PANEL_W, PANEL_H, viewDist, slidePos, slideRot, slideOpacity } from "@/lib/shots";
import { slideImages } from "@/lib/scenario";
import Carousel from "./Carousel";

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
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const pos = useMemo(() => slidePos(index), [index]);
  const rot = useMemo(() => slideRot(index), [index]);
  useFrame(({ camera }) => {
    if (!mat.current) return;
    // расстояние вдоль маршрута: положительное — слайд впереди, отрицательное — уже пролетели
    const d = camera.position.z - pos.z;
    const VD = viewDist(layout, (camera as THREE.PerspectiveCamera).aspect || 16 / 9);
    const o = slideOpacity(d, useDeck.getState().index === index, VD);
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
        <group key={i}>
          <Panel index={i} tex={t} hasImage={false} layout={scenario.slides[i].layout} />
          {slideImages(scenario.slides[i]).length > 0 && <Carousel index={i} images={slideImages(scenario.slides[i])} />}
        </group>
      ))}
    </>
  );
}
