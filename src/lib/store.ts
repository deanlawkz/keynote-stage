import { create } from "zustand";
import type { Scenario } from "./scenario";

type State = {
  scenario: Scenario | null;
  index: number;
  /** карусель картинок на текущем слайде */
  carousel: number;
  zoom: number;
  setCarousel: (i: number) => void;
  setZoom: (z: number) => void;
  setScenario: (s: Scenario) => void;
  go: (i: number) => void;
  next: () => void;
  prev: () => void;
};

export const useDeck = create<State>((set, get) => ({
  scenario: null,
  index: 0,
  carousel: 0,
  zoom: 1,
  setCarousel: (carousel) => set({ carousel }),
  setZoom: (zoom) => set({ zoom: Math.max(0.6, Math.min(4, zoom)) }),
  setScenario: (scenario) => set({ scenario, index: 0 }),
  go: (i) => {
    const n = get().scenario?.slides.length ?? 0;
    const index = Math.max(0, Math.min(n - 1, i));
    if (index !== get().index) set({ index, carousel: 0, zoom: 1 });
  },
  next: () => get().go(get().index + 1),
  prev: () => get().go(get().index - 1),
}));
