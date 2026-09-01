"use client";

import { EffectComposer, Bloom, ChromaticAberration, Vignette, ToneMapping, SMAA } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { useDeck } from "@/lib/store";

const CA = new THREE.Vector2(0.0004, 0.0004);

/** Постобработка. Режимы (store.postMode) нужны для замера FPS: smaa | msaa | bloom | msaa-bloom | none */
export default function Post() {
  const mode = useDeck((s) => s.postMode);
  if (mode === "none") return null;
  const msaa = mode.startsWith("msaa");
  const bloom = mode === "smaa" || mode.includes("bloom");
  return (
    <EffectComposer key={mode} multisampling={msaa ? 4 : 0}>
      {mode === "smaa" ? <SMAA /> : <></>}
      {bloom ? <Bloom intensity={0.45} luminanceThreshold={1.05} luminanceSmoothing={0.2} mipmapBlur radius={0.7} /> : <></>}
      <ChromaticAberration offset={CA} radialModulation modulationOffset={0.5} />
      <Vignette eskil={false} offset={0.15} darkness={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
