"use client";

import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette, ToneMapping, SMAA } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";

const CA = new THREE.Vector2(0.0004, 0.0004);

export default function Post() {
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom intensity={0.45} luminanceThreshold={1.05} luminanceSmoothing={0.2} mipmapBlur radius={0.7} />
      <ChromaticAberration offset={CA} radialModulation modulationOffset={0.5} />
      <Noise opacity={0.015} premultiply blendFunction={BlendFunction.SOFT_LIGHT} />
      <Vignette eskil={false} offset={0.15} darkness={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
