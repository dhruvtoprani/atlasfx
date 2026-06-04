"use client";

import { create } from "zustand";

type AtlasState = {
  regionFilter: string;
  setRegionFilter: (region: string) => void;
};

export const useAtlasStore = create<AtlasState>((set) => ({
  regionFilter: "All",
  setRegionFilter: (regionFilter) => set({ regionFilter }),
}));
