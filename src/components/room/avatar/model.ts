/**
 * VOXEL AVATAR MODELİ
 * -------------------
 * Avatar küçük kutulardan oluşan bir "oyuncak figür". Her poz, avatarın kendi yerel
 * eksenlerinde tanımlanır:
 *
 *   a → ileri (yüzünün baktığı yön)
 *   b → avatarın solu
 *   z → yukarı
 *
 * `buildAvatar()` pozu seçilen yöne döndürür ve çizim sırasına göre dizer.
 * Renkleri değiştirmek için `AVATAR_COLORS` yeterli.
 */

import type { Box3, P3 } from "@/lib/iso";

export type Facing = "+x" | "-x" | "+y" | "-y";

export type Pose =
  | "sit"
  | "type"
  | "mouse"
  | "wave"
  | "stretch"
  | "stand"
  | "walk"
  | "reach"
  | "carry"
  | "crouch"
  | "lounge"
  | "hidden";

/** Animasyon için kutunun bağlı olduğu uzuv. */
export type Limb = "legL" | "legR" | "armL" | "armR" | "body" | "head";

export type Part =
  | "skin"
  | "hair"
  | "hoodie"
  | "hoodieDark"
  | "pants"
  | "shoe"
  | "head"
  | "phones"
  | "phonesBand"
  | "case"
  | "controller";

export const AVATAR_COLORS: Record<Exclude<Part, "head" | "case">, string> = {
  skin: "#f3c5a4",
  hair: "#3d3246",
  hoodie: "#7fd0ad",
  hoodieDark: "#5db893",
  pants: "#4c5175",
  shoe: "#fbfaff",
  phones: "#a68cf3",
  phonesBand: "#f5f1ff",
  controller: "#f3effb",
};

export interface AvatarState {
  /** Oda koordinatı. Oturma pozlarında z = oturulan yüzeyin yüksekliği. */
  pos: P3;
  pose: Pose;
  facing: Facing;
  /** Kafa gövdeden farklı yöne bakabilir (ör. omzunun üstünden ziyaretçiye bakmak). */
  headFacing?: Facing;
  /** Son konum değişiminin süresi (ms). 0 → anında. */
  moveMs: number;
  headphones: boolean;
  /** Elindeki proje kutusunun id'si */
  holding: string | null;
}

interface LocalBox {
  a: [number, number];
  b: [number, number];
  z: [number, number];
  part: Part;
  limb: Limb;
}

const lb = (a: [number, number], b: [number, number], z: [number, number], part: Part, limb: Limb): LocalBox => ({
  a,
  b,
  z,
  part,
  limb,
});

/** Sol/sağ simetrik uzuv çifti üretir. */
function pair(
  a: [number, number],
  bOut: [number, number],
  z: [number, number],
  part: Part,
  limb: "leg" | "arm",
): LocalBox[] {
  return [
    lb(a, bOut, z, part, limb === "leg" ? "legL" : "armL"),
    lb(a, [-bOut[1], -bOut[0]], z, part, limb === "leg" ? "legR" : "armR"),
  ];
}

const HEAD_W = 1.15;

function head(a0: number, z0: number): LocalBox[] {
  return [
    lb([a0 - HEAD_W, a0 + HEAD_W], [-HEAD_W, HEAD_W], [z0, z0 + 2.15], "head", "head"),
    lb([a0 - 0.2, a0 + 0.25], [-0.15, 0.2], [z0 + 2.15, z0 + 2.5], "hair", "head"),
  ];
}

/* ---------- Pozlar ---------- */

function standing(): LocalBox[] {
  return [
    ...pair([-0.45, 0.62], [0.1, 0.92], [0, 0.42], "shoe", "leg"),
    ...pair([-0.4, 0.4], [0.12, 0.9], [0.42, 2.35], "pants", "leg"),
    lb([-0.65, 0.65], [-1, 1], [2.3, 4.4], "hoodie", "body"),
    lb([-0.92, -0.62], [-0.75, 0.75], [3.75, 4.45], "hoodieDark", "body"),
    ...pair([-0.31, 0.31], [1, 1.62], [2.85, 4.3], "hoodie", "arm"),
    ...pair([-0.27, 0.27], [1.04, 1.58], [2.42, 2.85], "skin", "arm"),
    ...head(0, 4.42),
  ];
}

function seatedLegs(): LocalBox[] {
  return [
    ...pair([-0.45, 1.55], [0.12, 0.9], [0, 0.75], "pants", "leg"),
    ...pair([1.0, 1.75], [0.12, 0.9], [-1.8, 0.4], "pants", "leg"),
    ...pair([0.95, 2.05], [0.1, 0.92], [-2.2, -1.8], "shoe", "leg"),
  ];
}

function seatedBody(): LocalBox[] {
  return [
    lb([-0.75, 0.55], [-1, 1], [0.55, 2.65], "hoodie", "body"),
    lb([-1.02, -0.72], [-0.75, 0.75], [2.0, 2.7], "hoodieDark", "body"),
    ...head(-0.05, 2.68),
  ];
}

function typingArms(): LocalBox[] {
  return [
    ...pair([-0.25, 0.37], [1, 1.62], [1.45, 2.42], "hoodie", "arm"),
    ...pair([0.1, 1.75], [1, 1.62], [1.15, 1.7], "hoodie", "arm"),
    ...pair([1.75, 2.15], [1.05, 1.57], [1.17, 1.6], "skin", "arm"),
  ];
}

function sit(): LocalBox[] {
  return [...seatedLegs(), ...seatedBody(), ...typingArms()];
}

function mouse(): LocalBox[] {
  return [
    ...seatedLegs(),
    ...seatedBody(),
    // Sağ kol klavyede, sol kol fareye uzanır.
    lb([-0.25, 0.37], [-1.62, -1], [1.45, 2.42], "hoodie", "armR"),
    lb([0.1, 1.6], [-1.62, -1], [1.15, 1.7], "hoodie", "armR"),
    lb([1.6, 2.0], [-1.57, -1.05], [1.17, 1.6], "skin", "armR"),
    lb([-0.25, 0.37], [1, 1.62], [1.45, 2.42], "hoodie", "armL"),
    lb([0.2, 1.8], [1.35, 1.97], [1.15, 1.7], "hoodie", "armL"),
    lb([1.8, 2.2], [1.4, 1.92], [1.17, 1.6], "skin", "armL"),
  ];
}

function wave(): LocalBox[] {
  return [
    ...seatedLegs(),
    ...seatedBody(),
    lb([-0.25, 0.37], [-1.62, -1], [1.45, 2.42], "hoodie", "armR"),
    lb([0.1, 1.75], [-1.62, -1], [1.15, 1.7], "hoodie", "armR"),
    lb([1.75, 2.15], [-1.57, -1.05], [1.17, 1.6], "skin", "armR"),
    // Sol kol havada: ziyaretçiye el sallıyor.
    lb([-0.31, 0.31], [1, 1.62], [2.3, 3.75], "hoodie", "armL"),
    lb([-0.27, 0.27], [1.04, 1.58], [3.75, 4.2], "skin", "armL"),
  ];
}

function stretch(): LocalBox[] {
  return [
    ...seatedLegs(),
    ...seatedBody(),
    ...pair([-0.31, 0.31], [1, 1.62], [2.3, 4.0], "hoodie", "arm"),
    ...pair([-0.27, 0.27], [1.04, 1.58], [4.0, 4.45], "skin", "arm"),
  ];
}

function reach(): LocalBox[] {
  const base = standing().filter((b) => b.limb !== "armR");
  return [
    ...base,
    lb([0, 0.62], [-1.62, -1], [4.3, 5.95], "hoodie", "armR"),
    lb([0.04, 0.58], [-1.58, -1.04], [5.95, 6.4], "skin", "armR"),
  ];
}

function carry(withCase: boolean): LocalBox[] {
  const base = standing().filter((b) => b.limb !== "armL" && b.limb !== "armR");
  return [
    ...base,
    ...pair([-0.3, 0.32], [1, 1.62], [3.45, 4.3], "hoodie", "arm"),
    ...pair([0.3, 1.25], [1, 1.62], [3.2, 3.72], "hoodie", "arm"),
    ...pair([1.25, 1.6], [1.04, 1.58], [3.2, 3.66], "skin", "arm"),
    ...(withCase ? [lb([1.35, 1.65], [-0.93, 0.93], [2.75, 4.75], "case", "body")] : []),
  ];
}

function crouch(withCase: boolean): LocalBox[] {
  return [
    ...pair([-0.5, 0.6], [0.1, 0.92], [0, 0.42], "shoe", "leg"),
    ...pair([-0.4, 0.45], [0.12, 0.9], [0.42, 1.55], "pants", "leg"),
    lb([-0.5, 0.8], [-1, 1], [1.5, 3.6], "hoodie", "body"),
    lb([-0.77, -0.47], [-0.75, 0.75], [2.95, 3.65], "hoodieDark", "body"),
    ...pair([0.25, 1.45], [1, 1.62], [1.95, 2.48], "hoodie", "arm"),
    ...pair([1.45, 1.85], [1.04, 1.58], [1.98, 2.42], "skin", "arm"),
    ...(withCase ? [lb([1.75, 2.0], [-0.62, 0.62], [1.62, 2.9], "case", "body")] : []),
    ...head(0.35, 3.62),
  ];
}

function lounge(): LocalBox[] {
  return [
    ...pair([-0.3, 1.5], [0.12, 0.9], [0, 0.75], "pants", "leg"),
    ...pair([1.3, 2.6], [0.12, 0.9], [-0.6, 0.15], "pants", "leg"),
    ...pair([2.5, 3.2], [0.1, 0.92], [-0.95, -0.35], "shoe", "leg"),
    lb([-1.0, 0.25], [-1, 1], [0.45, 2.5], "hoodie", "body"),
    lb([-1.27, -0.97], [-0.75, 0.75], [1.9, 2.55], "hoodieDark", "body"),
    ...pair([-0.55, 0.05], [1, 1.62], [1.25, 2.2], "hoodie", "arm"),
    ...pair([0.0, 0.95], [1, 1.62], [1.0, 1.5], "hoodie", "arm"),
    ...pair([0.95, 1.3], [1.04, 1.58], [1.02, 1.45], "skin", "arm"),
    lb([1.05, 1.45], [-0.78, 0.78], [1.05, 1.35], "controller", "body"),
    ...head(-0.3, 2.52),
  ];
}

function poseBoxes(pose: Pose, holding: boolean): LocalBox[] {
  switch (pose) {
    case "sit":
    case "type":
      return sit();
    case "mouse":
      return mouse();
    case "wave":
      return wave();
    case "stretch":
      return stretch();
    case "reach":
      return reach();
    case "carry":
      return carry(holding);
    case "crouch":
      return crouch(holding);
    case "lounge":
      return lounge();
    case "stand":
    case "walk":
      return holding ? carry(true) : standing();
    case "hidden":
      return [];
  }
}

/** Kulaklık: kafa kutusuna göre konumlanır. */
function headphones(headBox: LocalBox): LocalBox[] {
  const [a0, a1] = headBox.a;
  const [z0, z1] = headBox.z;
  const am = (a0 + a1) / 2;
  const zm = (z0 + z1) / 2;
  return [
    lb([am - 0.22, am + 0.22], [-HEAD_W - 0.12, HEAD_W + 0.12], [z1 - 0.02, z1 + 0.22], "phonesBand", "head"),
    lb([am - 0.55, am + 0.5], [HEAD_W - 0.02, HEAD_W + 0.32], [zm - 0.62, zm + 0.42], "phones", "head"),
    lb([am - 0.55, am + 0.5], [-HEAD_W - 0.32, -HEAD_W + 0.02], [zm - 0.62, zm + 0.42], "phones", "head"),
  ];
}

/* ---------- Yön çevirme ---------- */

const FORWARD: Record<Facing, [number, number]> = {
  "+x": [1, 0],
  "-x": [-1, 0],
  "+y": [0, 1],
  "-y": [0, -1],
};

/** Yerel (a, b) → dünya (x, y). Sol vektör = ileri vektörün 90° döndürülmüşü. */
function toWorldAxes(facing: Facing, a: number, b: number): [number, number] {
  const [fx, fy] = FORWARD[facing];
  const lx = -fy;
  const ly = fx;
  return [a * fx + b * lx, a * fy + b * ly];
}

export interface AvatarBox {
  box: Box3;
  part: Part;
  limb: Limb;
  /** Kafa kutusu için: görünen yüzlerde ne çizileceği */
  faces?: { x: HeadFace; y: HeadFace };
}

/** Kafanın görünen yüzündeki desen. `backAt` yan yüzde ensenin hangi kenarda kaldığını söyler. */
export type HeadFace = { kind: "front" } | { kind: "back" } | { kind: "side"; backAt: "start" | "end" };

function headFaces(f: Facing): { x: HeadFace; y: HeadFace } {
  switch (f) {
    case "+x":
      return { x: { kind: "front" }, y: { kind: "side", backAt: "start" } };
    case "-x":
      return { x: { kind: "back" }, y: { kind: "side", backAt: "end" } };
    case "+y":
      return { x: { kind: "side", backAt: "end" }, y: { kind: "front" } };
    case "-y":
      return { x: { kind: "side", backAt: "start" }, y: { kind: "back" } };
  }
}

/**
 * Pozu dünya eksenine çevirir ve ressam algoritmasına göre sıralar
 * (önce uzaktakiler, sonra yakındakiler).
 */
export function buildAvatar(state: Pick<AvatarState, "pose" | "facing" | "headFacing" | "headphones" | "holding">) {
  const local = poseBoxes(state.pose, state.holding !== null);
  const headBox = local.find((b) => b.part === "head");
  const all = state.headphones && headBox ? [...local, ...headphones(headBox)] : local;
  const headFacing = state.headFacing ?? state.facing;

  const boxes: AvatarBox[] = all.map((l) => {
    // Kafa ve kulaklık kafanın yönüne, geri kalan her şey gövdenin yönüne döner.
    const facing = l.limb === "head" ? headFacing : state.facing;
    let pivotA = 0;
    if (l.limb === "head" && headBox && headFacing !== state.facing) {
      // Kafa kendi merkezi etrafında dönsün diye gövde yönündeki merkezini koru.
      pivotA = (headBox.a[0] + headBox.a[1]) / 2;
    }
    const [cx, cy] = toWorldAxes(state.facing, pivotA, 0);
    const p1 = toWorldAxes(facing, l.a[0] - pivotA, l.b[0]);
    const p2 = toWorldAxes(facing, l.a[1] - pivotA, l.b[1]);
    const x0 = Math.min(p1[0], p2[0]) + cx;
    const x1 = Math.max(p1[0], p2[0]) + cx;
    const y0 = Math.min(p1[1], p2[1]) + cy;
    const y1 = Math.max(p1[1], p2[1]) + cy;
    return {
      box: { x: x0, y: y0, z: l.z[0], w: x1 - x0, d: y1 - y0, h: l.z[1] - l.z[0] },
      part: l.part,
      limb: l.limb,
      faces: l.part === "head" ? headFaces(headFacing) : undefined,
    };
  });

  return boxes.sort((p, q) => {
    const dp = p.box.x + p.box.w / 2 + p.box.y + p.box.d / 2;
    const dq = q.box.x + q.box.w / 2 + q.box.y + q.box.d / 2;
    if (Math.abs(dp - dq) > 0.35) return dp - dq;
    return p.box.z - q.box.z;
  });
}

/** Yürürken uzuvların sallanacağı yön (ekran pikseli / birim). */
export function forwardVector(facing: Facing): [number, number] {
  const [fx, fy] = FORWARD[facing];
  const ISO_X = Math.cos(Math.PI / 6) * 32;
  const ISO_Y = 16;
  return [(fx - fy) * ISO_X, (fx + fy) * ISO_Y];
}

/** Bir yolun bir parçası için yüz yönü: baskın eksen. */
export function facingFor(from: P3, to: P3): Facing {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "+x" : "-x";
  return dy >= 0 ? "+y" : "-y";
}
