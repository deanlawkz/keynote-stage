"use client";

import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import Dust from "./Dust";
import * as THREE from "three";
import { useDeck } from "@/lib/store";
import { STEP } from "@/lib/shots";
import Slides from "./Slides";
import Flashes from "./Flashes";
import Streaks from "./Streaks";
import CameraRig from "./CameraRig";
import Post from "./Post";

export const DEFAULT_ACCENT = "#5aa9ff";

/** Пустое пространство: слайды висят вдоль маршрута, камера пролетает сквозь них */
export default function Stage() {
  const scenario = useDeck((s) => s.scenario);
  const accent = scenario?.accent ?? DEFAULT_ACCENT;
  const n = scenario?.slides.length ?? 1;
  const len = (n + 1) * STEP;
  return (
    <div className="fixed inset-0 bg-black">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 55, near: 0.1, far: 900, position: [0, 0, 80] }}
        gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
      >
        <color attach="background" args={["#000005"]} />
        <fogExp2 attach="fog" args={["#000005", 0.0045]} />
        <CameraRig />
        <Stars radius={400} depth={200} count={3000} factor={4} saturation={0.1} fade speed={0} />
        <Dust length={len} />
        <Flashes count={n} accent={accent} />
        <Streaks count={n} />
        {scenario && <Slides scenario={scenario} accent={accent} />}
        <Post />
      </Canvas>
    </div>
  );
}
