/**
 * İzometrik çizim yardımcıları
 * ----------------------------
 * Sahnedeki her şey "oda birimi" ile tanımlanır (1 birim ≈ 20 cm).
 *
 *   x → sağ duvar boyunca ilerler (ekranda sağ-aşağı)
 *   y → sol duvar boyunca ilerler (ekranda sol-aşağı)
 *   z → yukarı
 *
 * `iso()` bir 3B noktayı SVG'deki 2B konuma çevirir. Kamera sabit olduğu için
 * bir kutunun her zaman yalnızca üç yüzü görünür: üst, +y ("sol") ve +x ("sağ").
 */

export type P2 = readonly [x: number, y: number];
export type P3 = readonly [x: number, y: number, z: number];

/** Eksen hizalı 3B kutu: (x, y, z) en küçük köşe, w/d/h boyutlar. */
export interface Box3 {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

/** 1 oda biriminin dikey karşılığı (piksel). */
export const UNIT = 32;
/** x/y eksenlerinin yatay ve dikey izdüşüm katsayıları. */
export const ISO_X = Math.cos(Math.PI / 6) * UNIT;
export const ISO_Y = 0.5 * UNIT;

export function iso(x: number, y: number, z = 0): P2 {
  return [(x - y) * ISO_X, (x + y) * ISO_Y - z * UNIT];
}

export function isoP(p: P3): P2 {
  return iso(p[0], p[1], p[2]);
}

const round = (n: number) => Math.round(n * 100) / 100;

export function toPoints(points: readonly P2[]): string {
  return points.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
}

/** 3B noktalardan SVG `points` metni üretir. */
export function poly3(points: readonly P3[]): string {
  return toPoints(points.map(isoP));
}

export function box(x: number, y: number, z: number, w: number, d: number, h: number): Box3 {
  return { x, y, z, w, d, h };
}

/** Bir kutuyu (dx, dy, dz) kadar kaydırır. */
export function shift(b: Box3, dx: number, dy: number, dz = 0): Box3 {
  return { ...b, x: b.x + dx, y: b.y + dy, z: b.z + dz };
}

export function boxCorners(b: Box3): P3[] {
  const x2 = b.x + b.w;
  const y2 = b.y + b.d;
  const z2 = b.z + b.h;
  return [
    [b.x, b.y, b.z],
    [x2, b.y, b.z],
    [x2, y2, b.z],
    [b.x, y2, b.z],
    [b.x, b.y, z2],
    [x2, b.y, z2],
    [x2, y2, z2],
    [b.x, y2, z2],
  ];
}

/** Kutunun görünen üç yüzünün polygon noktaları. */
export function boxFaces(b: Box3) {
  const x2 = b.x + b.w;
  const y2 = b.y + b.d;
  const z2 = b.z + b.h;
  return {
    top: poly3([
      [b.x, b.y, z2],
      [x2, b.y, z2],
      [x2, y2, z2],
      [b.x, y2, z2],
    ]),
    /** +y yüzü: ekranda sol-alt taraf */
    left: poly3([
      [b.x, y2, z2],
      [x2, y2, z2],
      [x2, y2, b.z],
      [b.x, y2, b.z],
    ]),
    /** +x yüzü: ekranda sağ-alt taraf */
    right: poly3([
      [x2, b.y, z2],
      [x2, y2, z2],
      [x2, y2, b.z],
      [x2, b.y, b.z],
    ]),
  };
}

/**
 * Yatay bir yuvarlak (ör. puf tabanı) izometrik görünümde eksen hizalı elipse dönüşür.
 * Yarıçap r oda birimidir.
 */
export function isoEllipseRadii(r: number) {
  return { rx: Math.SQRT2 * r * ISO_X, ry: Math.SQRT2 * r * ISO_Y };
}

/**
 * Duvara paralel bir yüzeye düz 2B içerik yerleştirmek için SVG matrisi.
 * `plane: "y"` → sağ duvara paralel, kameraya bakan yüz (+y yüzü). Yerel u ekseni +x yönündedir.
 * `plane: "x"` → sol duvara paralel yüz (+x yüzü). Yerel u ekseni ekranda soldan sağa, yani -y yönündedir.
 * Her iki durumda yerel v ekseni aşağı (−z) iner. `k`: bir yerel pikselin oda birimi karşılığı
 * (`kv` verilirse dikey eksen için ayrı ölçek).
 */
export function faceMatrix(plane: "x" | "y", topLeft: P3, k: number, kv = k): string {
  const [ox, oy] = isoP(topLeft);
  const a = ISO_X * k;
  const b = (plane === "y" ? ISO_Y : -ISO_Y) * k;
  const d = UNIT * kv;
  return `matrix(${round4(a)} ${round4(b)} 0 ${round4(d)} ${round(ox)} ${round(oy)})`;
}

/** Yatay bir üst yüzeye (zemin, masa, yastık) 2B içerik yerleştirir: u → +x, v → +y. */
export function topMatrix(topLeft: P3, k: number, kv = k): string {
  const [ox, oy] = isoP(topLeft);
  return `matrix(${round4(ISO_X * k)} ${round4(ISO_Y * k)} ${round4(-ISO_X * kv)} ${round4(ISO_Y * kv)} ${round(ox)} ${round(oy)})`;
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;

/** Duvara paralel bir dikdörtgenin köşeleri (ekran koordinatı). */
export function faceCorners(plane: "x" | "y", topLeft: P3, width: number, height: number) {
  const [x, y, z] = topLeft;
  const tr: P3 = plane === "y" ? [x + width, y, z] : [x, y - width, z];
  const bl: P3 = [x, y, z - height];
  return { tl: isoP(topLeft), tr: isoP(tr), bl: isoP(bl) };
}

/** Noktaların dış bükey zarfı (Andrew'un monoton zincir algoritması). */
export function convexHull(points: readonly P2[]): P2[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (sorted.length < 3) return sorted;
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P2[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: P2[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/** Kutuların ekrandaki siluet çokgeni. */
export function silhouette(boxes: readonly Box3[]): P2[] {
  return convexHull(boxes.flatMap((b) => boxCorners(b).map(isoP)));
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function boundsOf(points: readonly P2[]): Rect {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Bir çokgeni merkezinden dışarı doğru `pad` piksel büyütür (dokunma alanı için). */
export function inflate(points: readonly P2[], pad: number): P2[] {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return [x + (dx / len) * pad, y + (dy / len) * pad] as const;
  });
}

/** Oda düzleminde (z sabit) yuvarlatılmış dikdörtgen: halı, paspas vb. için. */
export function roundedRect3(x: number, y: number, w: number, d: number, r: number, z = 0): P3[] {
  const pts: P3[] = [];
  const corners: [number, number, number][] = [
    [x + w - r, y + r, -90],
    [x + w - r, y + d - r, 0],
    [x + r, y + d - r, 90],
    [x + r, y + r, 180],
  ];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= 6; i++) {
      const a = ((start + i * 15) * Math.PI) / 180;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]);
    }
  }
  return pts;
}

/* ---------- Renk yardımcıları ---------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = Number.parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** İki rengi t oranında karıştırır (0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Bir kutunun üç yüzü için renkler. */
export interface Material {
  top: string;
  left: string;
  right: string;
}

const LIGHT = "#ffffff";
const SHADOW = "#3a3150";

/**
 * Tek bir ana renkten gölgelendirilmiş malzeme üretir.
 * Üst yüz en açık, +x ("sağ") yüz en koyu olur; ışık soldan geliyormuş gibi.
 */
export function material(base: string, light = 0.28, dark = 0.13): Material {
  return { top: mix(base, LIGHT, light), left: base, right: mix(base, SHADOW, dark) };
}

/** Deterministik sözde rastgele sayı üreteci (sunucu ve tarayıcı aynı çizimi üretsin diye). */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => t * t * (3 - 2 * t);
