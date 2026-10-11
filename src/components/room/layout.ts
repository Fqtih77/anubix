/**
 * ODA YERLEŞİMİ — sahnedeki konumların tek kaynağı
 * ------------------------------------------------
 * Mobilya, avatar durakları, kamera çekimleri ve bölgeler burada tanımlanır.
 * Bir eşyanın yerini değiştirmek için ilgili kutunun sayılarını değiştirmen yeterli.
 *
 * Koordinat sistemi için `src/lib/iso.ts` dosyasının başındaki açıklamaya bak.
 * Kısaca: x sağ duvar boyunca, y sol duvar boyunca, z yukarı; 1 birim ≈ 20 cm.
 */

import { type Box3, box, boundsOf, boxCorners, isoP, type P2, type P3 } from "@/lib/iso";

/* ---------- Oda kabuğu ---------- */

export const ROOM = { w: 22, d: 18, h: 12, wall: 0.6, floor: 1.4 } as const;

/** SVG tuvalinin boyutu ve oda başlangıç noktasının (0,0,0) tuvaldeki yeri. */
export const SCENE = (() => {
  const shell = box(-ROOM.wall, -ROOM.wall, -ROOM.floor, ROOM.w + ROOM.wall, ROOM.d + ROOM.wall, ROOM.h + ROOM.floor);
  const b = boundsOf(boxCorners(shell).map(isoP));
  const margin = 80;
  return {
    width: Math.ceil(b.w + margin * 2),
    height: Math.ceil(b.h + margin * 2),
    originX: Math.round(-b.x + margin),
    originY: Math.round(-b.y + margin),
  };
})();

/** Oda koordinatını tuval pikseline çevirir (SVG kökü ve HTML katmanı için). */
export function toWorld(p: P3): P2 {
  const [x, y] = isoP(p);
  return [x + SCENE.originX, y + SCENE.originY];
}

/* ---------- Masa kurulumu (sağ duvar, y = 0) ---------- */

export const DESK = {
  top: box(2.4, 0, 3.6, 8.8, 3.6, 0.25),
  panelLeg: box(2.65, 0.3, 0, 0.25, 3.0, 3.6),
  drawers: box(9.0, 0.3, 0, 2.0, 3.0, 3.6),
  keyboard: box(6.15, 2.0, 3.85, 2.5, 0.85, 0.14),
  mousePad: box(8.95, 1.85, 3.85, 1.7, 1.35, 0.03),
  mouse: box(9.6, 2.35, 3.88, 0.38, 0.6, 0.17),
  /** Takılan projenin kutusu masada burada durur. */
  caseSpot: box(4.1, 2.25, 3.85, 1.3, 1.05, 0.12),
  mug: [5.45, 2.95, 3.85] as P3,
  plant: [3.05, 0.8, 3.85] as P3,
  topZ: 3.85,
};

/** Monitör gövdeleri. Ekranlar kameraya bakan +y yüzündedir. */
export const MONITORS = {
  left: box(2.75, 0.85, 5.0, 2.95, 0.3, 2.0),
  main: box(5.85, 0.85, 4.9, 3.25, 0.3, 2.15),
  vertical: box(9.3, 0.85, 4.75, 1.3, 0.3, 2.85),
};

export type ScreenId = "left" | "main" | "vertical" | "tv";

/** Bir ekranın düz yüzeyi: ekrandan bakınca sol-üst köşe, genişlik ve yükseklik (birim). */
export interface ScreenFace {
  plane: "x" | "y";
  at: P3;
  w: number;
  h: number;
}

const BEZEL = 0.09;

function monitorScreen(b: Box3): ScreenFace {
  return {
    plane: "y",
    at: [b.x + BEZEL, b.y + b.d, b.z + b.h - BEZEL],
    w: b.w - BEZEL * 2,
    h: b.h - BEZEL * 2,
  };
}

export const PC_CASE = box(0.55, 0.45, 0, 1.25, 2.45, 2.7);

/** Sandalyenin merkezi. Avatar kalkınca sandalye `CHAIR_ROLL` kadar geri kayar. */
export const CHAIR = { x: 7.35, y: 5.2, seatZ: 2.25 };
export const CHAIR_ROLL = { x: 0.35, y: 1.3 };

/* ---------- Plak duvarı (sol duvar, x = 0) ---------- */

export type RecordId = "cv" | "projects";

export interface RecordFrame {
  id: RecordId;
  /** Tablonun altındaki etiket */
  label: string;
  /** Kısa açıklama (erişilebilir ad ve ipucu için) */
  hint: string;
  /** Plak etiketinin, kasanın ışığının ve ekranın rengi */
  color: string;
  /** Duvara asılı tablo (kutu) */
  frame: Box3;
  /** Avatarın plağı almak için durduğu yer */
  stand: P3;
}

/**
 * Duvardaki iki tablo; her birinde bir plak var. Plak bilgisayara takılınca
 * "cv" → özgeçmiş ekranı, "projects" → proje masaüstü açılır.
 */
export const RECORDS: Record<RecordId, RecordFrame> = {
  projects: {
    id: "projects",
    label: "PROJELER",
    hint: "Proje masaüstünü aç",
    color: "#8b7cf6",
    frame: box(0, 3.55, 5.0, 0.24, 2.8, 2.8),
    stand: [2.55, 4.95, 0],
  },
  cv: {
    id: "cv",
    label: "CV",
    hint: "Özgeçmişi aç",
    color: "#2563eb",
    frame: box(0, 6.75, 5.0, 0.24, 2.8, 2.8),
    stand: [2.55, 8.15, 0],
  },
};

export const RECORD_IDS: RecordId[] = ["projects", "cv"];

/** Tablonun ön yüzü (+x yüzü, sol duvara paralel) */
export function frameFace(b: Box3): ScreenFace {
  return { plane: "x", at: [b.x + b.w, b.y + b.d, b.z + b.h], w: b.d, h: b.h };
}

/** Yatağın yanındaki duvarda (sağ duvar) ışık düğmesi. */
export const LIGHT_SWITCH = box(13.25, 0, 4.25, 0.5, 0.08, 0.78);

/* ---------- Mola köşesi (sol duvar önü) ---------- */

export const TV_CORNER = {
  stand: box(0, 10.2, 0, 2.2, 6.4, 1.9),
  tv: box(0.1, 10.55, 3.9, 0.3, 5.7, 3.3),
  console: box(0.45, 14.75, 1.9, 1.15, 0.75, 1.75),
  standPlant: [1.1, 11.0, 1.9] as P3,
  table: { c: [6.1, 12.9, 0] as P3, r: 1.45, topZ: 1.5 },
  headphones: [5.55, 12.35, 1.5] as P3,
  controller: [6.75, 13.35, 1.5] as P3,
  beanBag: { c: [10.3, 13.2, 0] as P3, r: 1.75, h: 2.3 },
  rug: { x: 3.4, y: 10.0, w: 10.0, d: 6.9, r: 1.3 },
};

/* ---------- Yatak köşesi (sağ duvar, pencere) ---------- */

export const BED_CORNER = {
  nightstand: box(12.95, 0.3, 0, 1.8, 1.8, 2.3),
  lamp: [13.5, 0.85, 2.3] as P3,
  plant: [11.95, 1.15, 0] as P3,
  headboard: box(14.9, 0, 0, 6.3, 0.55, 4.1),
  base: box(15.0, 0.55, 0.25, 6.1, 9.7, 1.05),
  mattress: box(15.1, 0.6, 1.3, 5.9, 9.5, 0.85),
  pillows: [box(15.5, 0.85, 2.15, 2.45, 1.55, 0.55), box(18.25, 0.85, 2.15, 2.45, 1.55, 0.55)],
  duvet: box(14.95, 3.6, 1.4, 6.2, 6.75, 1.0),
  window: { x: 15.4, w: 5.2, z: 4.7, h: 5.5 },
  rug: { x: 15.3, y: 10.9, w: 5.4, d: 2.5, r: 0.9 },
};

/* ---------- Ekranlar ---------- */

export const SCREENS: Record<ScreenId, ScreenFace> = {
  left: monitorScreen(MONITORS.left),
  main: monitorScreen(MONITORS.main),
  vertical: monitorScreen(MONITORS.vertical),
  tv: {
    plane: "x",
    at: [TV_CORNER.tv.x + TV_CORNER.tv.w, TV_CORNER.tv.y + TV_CORNER.tv.d - 0.1, TV_CORNER.tv.z + TV_CORNER.tv.h - 0.1],
    w: TV_CORNER.tv.d - 0.2,
    h: TV_CORNER.tv.h - 0.2,
  },
};

/* ---------- Avatar durakları ---------- */

export const SPOTS = {
  /** Sandalyede otururken (z = oturak yüksekliği) */
  seat: [CHAIR.x, CHAIR.y - 0.35, CHAIR.seatZ] as P3,
  /** Sandalyeden kalkınca durduğu yer */
  stand: [CHAIR.x, 4.55, 0] as P3,
  deskLeft: [2.55, 4.55, 0] as P3,
  pc: [1.18, 4.7, 0] as P3,
  deskRight: [9.45, 4.55, 0] as P3,
  aisleRight: [9.45, 9.0, 0] as P3,
  beanAisle: [12.85, 9.0, 0] as P3,
  beanSide: [12.85, 13.25, 0] as P3,
  beanSeat: [10.5, 13.25, 0.95] as P3,
  bedAisle: [13.3, 9.0, 0] as P3,
  bedFront: [13.3, 11.6, 0] as P3,
  bedFoot: [17.9, 11.6, 0] as P3,
};

/* ---------- Kamera çekimleri ---------- */

export type ShotId =
  | "overview"
  | "intro"
  | "desk"
  | "records"
  | "tv"
  | "bed"
  | "recordAction"
  | "mainMonitor"
  | "verticalMonitor"
  | "tvAction"
  | "bedAction";

/**
 * Kadraj: ya bir 3B kutu ya da kadraja mutlaka girmesi gereken 3B noktalar.
 * Noktalar daha esnektir: ör. odanın en sol ve en sağ ucunu verip ön köşedeki boş zemini dışarıda bırakır.
 */
export type Frame = Box3 | readonly P3[];

export interface Shot {
  /** Geniş ekranlarda (masaüstü) kadraj */
  wide: Frame;
  /** Telefon gibi dar ekranlarda kadraj */
  tight: Frame;
  /** Kadrajın etrafında bırakılacak pay (1 = hiç) */
  pad?: number;
  /**
   * Masaüstünde kadrajı en fazla bu kat büyüt (bölgeye daha yakından bakmak için).
   * Büyütünce kadrajın üstü/altı biraz kırpılabilir; ekranı aşacak kadar büyütülmez.
   */
  zoom?: number;
  /**
   * Masaüstünde oda en az ekran genişliğini doldursun mu? Varsayılan: evet.
   * Bütün oda ve monitör yakın planları için kapalı.
   */
  fill?: boolean;
}

const WHOLE = box(-ROOM.wall, -ROOM.wall, -ROOM.floor, ROOM.w + ROOM.wall, ROOM.d + ROOM.wall, ROOM.h + ROOM.floor);

/** Maketin kaidesi hariç oda: "Tüm oda" görünümünde oda biraz daha büyük dursun diye. */
const ROOM_ONLY: P3[] = [
  [-ROOM.wall, -ROOM.wall, ROOM.h],
  [-ROOM.wall, ROOM.d, ROOM.h],
  [ROOM.w, -ROOM.wall, ROOM.h],
  [-ROOM.wall, ROOM.d, -0.4],
  [ROOM.w, -ROOM.wall, -0.4],
  [ROOM.w, ROOM.d, -0.5],
];

export const SHOTS: Record<ShotId, Shot> = {
  /** İlk açılış ve "Tüm oda": odanın tamamı, kenarlarda boşluk bırakmadan biraz yakın. */
  overview: { wide: ROOM_ONLY, tight: WHOLE, pad: 1, zoom: 1.12, fill: false },
  intro: { wide: WHOLE, tight: WHOLE, pad: 1.3, fill: false },
  /** Masa: monitörler, avatar ve bilgisayar kasası yakından ("Tüm oda"dan sonra ilk durak). */
  desk: {
    wide: [
      [3.4, 0.4, 7.8],
      [10.8, 0.4, 7.8],
      [0.5, 3.2, 0],
      [11, 6.6, 0],
      [4.5, 7.2, 0],
    ],
    tight: box(1.6, -0.3, 0.5, 10.4, 7.6, 9.5),
    zoom: 1.55,
  },
  /** Plak duvarı: iki tablo ve önlerindeki zemin, tablolar okunacak kadar yakın. */
  records: {
    wide: [
      [0, 10, 8.6],
      [0, 2.9, 8.8],
      [0, 10, 2.4],
      [3.2, 2.9, 0],
      [3.2, 10, 0],
    ],
    tight: box(-0.6, 2.4, 0, 8.6, 8.4, 10.6),
    zoom: 1.65,
  },
  /** Mola köşesi: televizyon, sehpa ve puf. Geniş ekranda duvarın üstü biraz kırpılabilir. */
  tv: {
    wide: [
      [0, 16.4, 7.6],
      [0, 10.3, 7.6],
      [0, 16.6, 0],
      [12.1, 11.4, 2.3],
      [10.3, 14.95, 0],
    ],
    tight: box(-0.6, 9.4, 0, 13.4, 8.2, 8.5),
    pad: 1.04,
    zoom: 1.55,
  },
  /** Yatak köşesi: yatak, komodin, ışık düğmesi ve (gece manzarası görünsün diye) pencerenin tamamı. */
  bed: {
    wide: [
      [15.2, 0, 10.4],
      [21.5, 0, 10.4],
      [12.5, 0.6, 2.4],
      [15, 10.3, 0.5],
      [21.1, 10.3, 1.4],
    ],
    tight: box(11.6, -0.6, 0, 11, 13.8, 10.6),
    pad: 1.03,
    zoom: 1.5,
  },
  recordAction: {
    wide: [
      [0, 10, 1.5],
      [9.2, 0.5, 4.5],
      [0, 3.6, 10.2],
      [8.6, 7.6, 0],
    ],
    tight: box(-0.6, 0.2, 0, 9.6, 9.6, 10.5),
    zoom: 1.25,
  },
  mainMonitor: {
    wide: box(5.8, 0.9, 4.85, 3.35, 0.3, 2.25),
    tight: box(5.8, 0.9, 4.85, 3.35, 0.3, 2.25),
    pad: 1.12,
    fill: false,
  },
  verticalMonitor: {
    wide: box(9.25, 0.9, 4.7, 1.4, 0.3, 2.95),
    tight: box(9.25, 0.9, 4.7, 1.4, 0.3, 2.95),
    pad: 1.12,
    fill: false,
  },
  tvAction: {
    wide: [
      [0, 17, 6.5],
      [13.4, 10.6, 0.5],
      [0, 10.6, 9.5],
      [12.8, 15.8, 0],
    ],
    tight: box(-0.6, 9.8, 0, 13.6, 7.6, 8),
    zoom: 1.3,
  },
  bedAction: {
    wide: [
      [12.3, 0.8, 2.4],
      [22, 0, 10.4],
      [14.4, 0, 11],
      [17.2, 13, 0],
      [22, 10.6, 0],
    ],
    tight: box(12.4, -0.6, 0, 10.2, 13.6, 10.5),
    zoom: 1.3,
  },
};

/* ---------- Bölgeler (kaydırma turu, mobil gezinme) ---------- */

export type RegionId = "room" | "desk" | "records" | "tv" | "bed";

export interface Region {
  id: RegionId;
  /** Gezinme düğmesindeki kısa ad */
  label: string;
  title: string;
  text: string;
  shot: ShotId;
}

/** Kaydırma turunun sırası: sayfa açılınca bütün oda, aşağı kaydırdıkça bölgeler. */
export const REGIONS: Region[] = [
  {
    id: "room",
    label: "Tüm oda",
    title: "Odanın tamamı",
    text: "Kaydırarak masaya, plak duvarına, mola köşesine ve yatağa geç.",
    shot: "overview",
  },
  {
    id: "desk",
    label: "Masa",
    title: "Çalışma masası",
    text: "Kodun yazıldığı yer. Ekranlara yakından bak; biri sıradan bir ekran değil.",
    shot: "desk",
  },
  {
    id: "records",
    label: "Plaklar",
    title: "Plak duvarı",
    text: "İki tablo, iki plak: CV ve projeler. Birine tıkla; avatar alıp bilgisayara taksın.",
    shot: "records",
  },
  {
    id: "tv",
    label: "Mola",
    title: "Mola köşesi",
    text: "Pufa ya da televizyona tıkla, biraz mola verelim.",
    shot: "tv",
  },
  {
    id: "bed",
    label: "Yatak",
    title: "Dinlenme köşesi",
    text: "Yatağa tıkla; kısa bir şekerleme molası. Işık düğmesi de burada.",
    shot: "bed",
  },
];
