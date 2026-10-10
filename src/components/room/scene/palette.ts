import { material } from "@/lib/iso";

/**
 * Odanın renk paleti. Açık tema: kırık beyaz, açık ahşap, lila / şeftali / gök mavisi vurgular.
 * Bir rengi buradan değiştirmek, onu kullanan bütün mobilyaları değiştirir.
 */
export const C = {
  ink: "#2d2640",
  wallRight: "#fbf6f1",
  wallLeft: "#f1e9e5",
  wallTop: "#ffffff",
  wallCap: "#e6dbd2",
  floor: "#efd8ba",
  floorLine: "#dcbf9b",
  floorSeam: "#d5b48c",
  plinthL: "#cbbdf1",
  plinthR: "#b3a2e6",
  woodEdgeL: "#d7b087",
  woodEdgeR: "#c59a6f",
  lilac: "#b7a5f5",
  lilacDeep: "#8b7cf6",
  peach: "#ffc2a6",
  peachDeep: "#f59f84",
  mint: "#9fe0c4",
  mintDeep: "#5fbf98",
  sky: "#a9d4fb",
  butter: "#ffe29a",
  pink: "#f7b6c8",
  leaf: "#7cc98f",
  leafDark: "#4f9f6a",
  screenOff: "#262236",
  bezel: "#2a2639",
  bulb: "#ffe6a1",
  bulbOff: "#ece4da",
} as const;

export const M = {
  white: material("#f3f2f8", 0.6, 0.09),
  whiteWarm: material("#f7f2ec", 0.55, 0.08),
  wood: material("#e6c49b", 0.3, 0.12),
  woodDark: material("#cf9f70", 0.25, 0.14),
  lilac: material("#b9a8f6"),
  lilacSoft: material("#d8cdfa", 0.4, 0.1),
  peach: material("#ffc4a8", 0.3, 0.1),
  mint: material("#a3e2c6"),
  bezel: material("#3a3550", 0.15, 0.2),
  dark: material("#4a4560", 0.15, 0.18),
  metal: material("#dcdbe6", 0.4, 0.12),
  sheet: material("#fdfcff", 0.4, 0.07),
  duvet: material("#ffc9b4", 0.3, 0.09),
  pillow: material("#fffaf4", 0.3, 0.06),
  pot: material("#f6efe8", 0.4, 0.1),
  terracotta: material("#e9a487", 0.25, 0.12),
};
