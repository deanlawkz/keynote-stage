import { create } from "zustand";
import type { Scenario } from "./scenario";

type State = {
  scenario: Scenario | null;
  index: number;
  setScenario: (s: Scenario) => void;
  go: (i: number) => void;
  next: () => void;
  prev: () => void;
};

export const useDeck = create<State>((set, get) => ({
  scenario: null,
  index: 0,
  setScenario: (scenario) => set({ scenario, index: 0 }),
  go: (i) => {
    const n = get().scenario?.slides.length ?? 0;
    set({ index: Math.max(0, Math.min(n - 1, i)) });
  },
  next: () => get().go(get().index + 1),
  prev: () => get().go(get().index - 1),
}));
