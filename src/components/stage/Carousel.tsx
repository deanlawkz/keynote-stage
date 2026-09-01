"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDeck } from "@/lib/store";
import { asset } from "@/lib/scenario";
import { imageCache } from "@/lib/imageCache";
import { IMG_H, IMG_GAP, mediaDist, slidePos, slideRot, slideOpacity } from "@/lib/shots";

type Img = { tex: THREE.Texture; w: number; h: number };

/** Позиции картинок в ряду (по центру слайда) */
export function layoutX(widths: number[]) {
  const total = widths.reduce((a, b) => a + b, 0) + IMG_GAP * (widths.length - 1);
  const xs: number[] = [];
  let x = -total / 2;
  for (const w of widths) {
    xs.push(x + w / 2);
    x += w + IMG_GAP;
  }
  return xs;
}

export function imageWidth(aspect: number) {
  return IMG_H * aspect;
}

/** Карусель картинок слайда: ряд 3D-панелей перед слайдом; активная — ярче */
export default function Carousel({ index, images }: { index: number; images: string[] }) {
  const [imgs, setImgs] = useState<Img[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const pos = useMemo(() => slidePos(index), [index]);
  const rot = useMemo(() => slideRot(index), [index]);

  useEffect(() => {
    let alive = true;
    const loader = new THREE.TextureLoader();
    Promise.all(
      images.map(
        (src) =>
          new Promise<Img>((res) => {
            loader.load(
              asset(src),
              (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.anisotropy = 8;
                const im = tex.image as HTMLImageElement;
                imageCache.set(src, im.width / im.height);
                res({ tex, w: im.width, h: im.height });
              },
              undefined,
              () => res({ tex: new THREE.Texture(), w: 16, h: 9 })
            );
          })
      )
    ).then((r) => alive && setImgs(r));
    return () => {
      alive = false;
    };
  }, [images]);

  const widths = imgs.map((i) => imageWidth(i.w / i.h));
  const xs = layoutX(widths);

  useFrame(({ camera }) => {
    const { index: cur, carousel } = useDeck.getState();
    const d = camera.position.z - pos.z;
    const VD = mediaDist(widths[carousel] ?? IMG_H * (16 / 9), (camera as THREE.PerspectiveCamera).aspect || 16 / 9);
    const o = slideOpacity(d, cur === index, VD);
    mats.current.forEach((m, k) => {
      if (!m) return;
      const dim = cur === index && k !== carousel ? 0.45 : 1;
      m.opacity = o * dim;
      m.color.setScalar(cur === index && k === carousel ? 0.95 : 0.75);
    });
  });

  return (
    <group position={pos} rotation={rot}>
      {imgs.map((im, k) => (
        <mesh key={k} position={[xs[k], -0.6, 0.4]}>
          <planeGeometry args={[widths[k], IMG_H]} />
          <meshBasicMaterial ref={(el) => (mats.current[k] = el)} map={im.tex} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
