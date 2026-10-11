import { type CSSProperties, memo } from "react";
import { IsoBox, IsoFace, IsoTop } from "@/components/iso/Iso";
import type { PanelFeatureId } from "@/data/panelFeatures";
import {
  type Box3,
  box,
  boundsOf,
  boxCorners,
  inflate,
  isoP,
  type Material,
  type P2,
  type P3,
  seeded,
  silhouette,
} from "@/lib/iso";
import styles from "./WorldMap.module.css";

/**
 * ANUBIX DÜNYASI HARİTASI
 * -----------------------
 * Odadakiyle aynı izometrik çizim araçlarıyla kurulmuş, havada süzülen voxel bir ada.
 * Bloklar "dünya oluşturuluyor" sırasında sırayla yerine oturur. Her yapı bir özelliğe
 * açılan düğmedir. Görseller özgündür; hiçbir oyunun dokusu kullanılmaz.
 */

const GW = 11;
const GD = 9;

/** Yükseklik haritası: 1 normal, 2 tepe, 0 su. Satırlar y, sütunlar x. */
const HEIGHTS = [
  "22111111122",
  "21111111112",
  "11111111111",
  "11111111111",
  "11111111001",
  "11111111001",
  "11111111011",
  "11111111111",
  "21111111112",
];

/** Toprak yol (çakıl) hücreleri */
const PATH = new Set(["2,4", "3,4", "4,4", "4,3", "5,3", "6,3", "6,4", "3,5", "2,5", "7,3", "4,2", "7,2", "2,3"]);

const M = {
  grass: { top: "#8fdb7a", left: "#62b85a", right: "#4f9f4b" } satisfies Material,
  path: { top: "#e2d3b2", left: "#c9b48d", right: "#b29c76" } satisfies Material,
  dirt: { top: "#c4956a", left: "#b98a5e", right: "#9c7350" } satisfies Material,
  stone: { top: "#b4b2c2", left: "#9a98a8", right: "#7f7d8f" } satisfies Material,
  stoneDark: { top: "#9997aa", left: "#83819a", right: "#6c6a82" } satisfies Material,
  water: { top: "#7ccaf4", left: "#5fb2e0", right: "#4b9ccc" } satisfies Material,
  wood: { top: "#d9a36b", left: "#c48a52", right: "#a87240" } satisfies Material,
  woodDark: { top: "#a8764a", left: "#8f6239", right: "#77502d" } satisfies Material,
  leaf: { top: "#7fd17a", left: "#5bb35d", right: "#479a4c" } satisfies Material,
  leafDark: { top: "#69c36a", left: "#4aa250", right: "#3a8641" } satisfies Material,
  paper: { top: "#fffaf0", left: "#f4ecdc", right: "#e5dbc6" } satisfies Material,
  gold: { top: "#ffe07a", left: "#f2c94c", right: "#d8ab2c" } satisfies Material,
  mint: { top: "#b9f0d6", left: "#8fdcbc", right: "#6fc4a0" } satisfies Material,
  white: { top: "#ffffff", left: "#eeeef6", right: "#d9d8e6" } satisfies Material,
  command: { top: "#f0a050", left: "#d9802f", right: "#b9661f" } satisfies Material,
};

interface Cell {
  x: number;
  y: number;
  h: number;
  kind: "grass" | "path" | "water";
}

const CELLS: Cell[] = HEIGHTS.flatMap((row, y) =>
  [...row].map((c, x) => {
    const h = Number(c);
    return {
      x,
      y,
      h: h === 0 ? 0.72 : h,
      kind: h === 0 ? "water" : PATH.has(`${x},${y}`) ? "path" : "grass",
    } satisfies Cell;
  }),
).sort((a, b) => a.x + a.y - (b.x + b.y) || a.h - b.h);

const heightAt = (x: number, y: number) => CELLS.find((c) => c.x === x && c.y === y)?.h ?? 1;

interface TreeSpot {
  x: number;
  y: number;
  z: number;
  big?: boolean;
}

/** Adanın köşelerindeki ağaçlar (öndeki köşe yapıları kapatmasın diye boş). */
const TREES_BACK: TreeSpot[] = [
  { x: 0.5, y: 0.5, z: 2 },
  { x: 10.5, y: 0.5, z: 2, big: true },
];
const TREES_FRONT: TreeSpot[] = [{ x: 0.5, y: 8.5, z: 2 }];

function treeBoxes({ x, y, z, big }: TreeSpot): Box3[] {
  const s = big ? 1.25 : 1;
  return [
    box(x - 0.18, y - 0.18, z, 0.36, 0.36, 1.3 * s),
    box(x - 0.75 * s, y - 0.75 * s, z + 1.1 * s, 1.5 * s, 1.5 * s, 1.1 * s),
    box(x - 0.5 * s, y - 0.5 * s, z + 2.2 * s, 1.0 * s, 1.0 * s, 0.6 * s),
  ];
}

/* ---------- Yapılar ve tıklanabilir alanları ---------- */

interface Structure {
  id: PanelFeatureId;
  /** Tıklanabilir alanın kutuları */
  hit: Box3[];
}

const STRUCTURES: Structure[] = [
  { id: "calendar", hit: [box(1.0, 1.25, 1, 2.0, 0.4, 2.7)] },
  { id: "notes", hit: [box(4.1, 1.15, 1, 1.7, 1.0, 1.3)] },
  { id: "quests", hit: [box(7.0, 1.2, 1, 2.0, 0.4, 2.7)] },
  { id: "storage", hit: [box(2.05, 6.1, 1, 1.15, 0.95, 1.05)] },
  { id: "assistant", hit: [box(5.95, 5.0, 1, 1.15, 1.15, 2.9)] },
  { id: "projects", hit: [box(10.06, 8.06, 2, 0.88, 0.88, 1.5)] },
];

/** Komut bloğu adanın ön köşesindeki tepede durur. */
const COMMAND = box(10.08, 8.08, 2, 0.84, 0.84, 0.84);

/** Haritanın görünür sınırları (viewBox): adanın ve ağaçların gerçek sınırı + küçük pay. */
const VIEW = (() => {
  const content = [box(0, 0, -2.5, GW, GD, 4.5), ...[...TREES_BACK, ...TREES_FRONT].flatMap(treeBoxes)];
  const b = boundsOf(content.flatMap((bx) => boxCorners(bx).map(isoP)));
  const m = 14;
  return { x: b.x - m, y: b.y - m, w: b.w + m * 2, h: b.h + m * 2 };
})();

export const MAP_ASPECT = VIEW.w / VIEW.h;

/** Bir yapının tıklama çokgeni, harita kutusuna göre yüzde olarak. */
function hitArea(boxes: Box3[]) {
  const poly = inflate(silhouette(boxes), 6);
  const r = boundsOf(poly);
  const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(3)}%`;
  return {
    style: {
      left: pct(r.x - VIEW.x, VIEW.w),
      top: pct(r.y - VIEW.y, VIEW.h),
      width: pct(r.w, VIEW.w),
      height: pct(r.h, VIEW.h),
    },
    clip: `polygon(${poly.map(([x, y]: P2) => `${pct(x - r.x, r.w)} ${pct(y - r.y, r.h)}`).join(", ")})`,
  };
}

interface Props {
  /** "building": dünya oluşuyor (bloklar iner), "ready": hazır, "instant": animasyonsuz */
  phase: "building" | "ready" | "instant";
  labels: Record<PanelFeatureId, string>;
  hot: PanelFeatureId | null;
  onOpen: (id: PanelFeatureId) => void;
  onHot: (id: PanelFeatureId | null) => void;
}

function WorldMapImpl({ phase, labels, hot, onOpen, onHot }: Props) {
  const animate = phase !== "instant";
  return (
    <div
      className={styles.map}
      data-phase={phase}
      style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}`, "--aspect": VIEW.w / VIEW.h } as CSSProperties}
    >
      <svg
        className={styles.svg}
        viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="wm-fire">
            <stop offset="0" stopColor="#ffd36b" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffd36b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <StaticUnderside animate={animate} />
        {CELLS.map((c) => (
          <StaticBlock key={`${c.x}-${c.y}`} cell={c} animate={animate} />
        ))}
        <g className={animate ? styles.structures : undefined}>
          {TREES_BACK.map((t) => (
            <Tree key={`${t.x}-${t.y}`} spot={t} />
          ))}
          <CalendarBoard hot={hot === "calendar"} />
          <Lectern hot={hot === "notes"} />
          <QuestBoard hot={hot === "quests"} />
          <Campfire />
          <Flowers />
          <Chest hot={hot === "storage"} />
          <Bix hot={hot === "assistant"} />
          {TREES_FRONT.map((t) => (
            <Tree key={`${t.x}-${t.y}`} spot={t} />
          ))}
          <CommandBlock hot={hot === "projects"} />
        </g>
      </svg>

      {STRUCTURES.map((s) => {
        const area = hitArea(s.hit);
        return (
          <div key={s.id} className={styles.spot} style={area.style}>
            <button
              type="button"
              className={styles.hit}
              style={{ clipPath: area.clip }}
              aria-label={`${labels[s.id]}: aç`}
              onClick={() => onOpen(s.id)}
              onPointerEnter={() => onHot(s.id)}
              onPointerLeave={() => onHot(null)}
              onFocus={() => onHot(s.id)}
              onBlur={() => onHot(null)}
            />
            <span className={styles.label} aria-hidden="true">
              {labels[s.id]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const WorldMap = memo(WorldMapImpl);

/** Sıcak nokta değişince 99 arazi bloğunu yeniden oluşturma. */
const StaticUnderside = memo(Underside);
const StaticBlock = memo(Block);

/* ---------- Ada ---------- */

function Underside({ animate }: { animate: boolean }) {
  return (
    <g className={animate ? styles.underside : undefined}>
      <IsoBox b={box(2.2, 1.8, -2.45, 6.6, 5.2, 0.6)} m={M.stoneDark} />
      <IsoBox b={box(0.8, 0.7, -1.9, 9.4, 7.6, 0.75)} m={M.stone} />
      <IsoBox b={box(0, 0, -1.2, GW, GD, 1.2)} m={M.dirt} />
    </g>
  );
}

function Block({ cell, animate }: { cell: Cell; animate: boolean }) {
  const { x, y, h, kind } = cell;
  const cap = kind === "water" ? h : 0.24;
  const delay = (x + y) * 45 + ((x * 7 + y * 13) % 5) * 30;
  const top = kind === "path" ? M.path : kind === "water" ? M.water : M.grass;
  return (
    <g
      className={animate ? styles.block : undefined}
      style={animate ? ({ "--d": `${delay}ms` } as CSSProperties) : undefined}
    >
      {kind !== "water" ? <IsoBox b={box(x, y, 0, 1, 1, h - cap)} m={M.dirt} /> : null}
      <IsoBox b={box(x, y, h - cap, 1, 1, cap)} m={top} />
      {kind === "grass" ? <GrassSpecks x={x} y={y} z={h} /> : null}
      {kind === "water" ? (
        <IsoTop at={[x, y, h + 0.001]}>
          <rect className={styles.shimmer} x={18} y={30} width={34} height={8} fill="#ffffff" opacity={0.5} />
        </IsoTop>
      ) : null}
    </g>
  );
}

function GrassSpecks({ x, y, z }: { x: number; y: number; z: number }) {
  const rand = seeded(x * 31 + y * 17);
  if (rand() > 0.55) return null;
  // Aynı noktaya düşen benekleri ele (anahtarlar benzersiz kalsın).
  const specks = [
    ...new Map([0, 1, 2].map(() => {
      const u = Math.floor(rand() * 8) * 12;
      const v = Math.floor(rand() * 8) * 12;
      return [`${u}-${v}`, [u, v] as const] as const;
    })).values(),
  ];
  return (
    <IsoTop at={[x, y, z + 0.001]}>
      {specks.map(([u, v]) => (
        <rect key={`${u}-${v}`} x={u} y={v} width={12} height={12} fill="#a6e88f" />
      ))}
    </IsoTop>
  );
}

function Flowers() {
  const spots: [number, number, string][] = [
    [1.4, 4.4, "#f7b6c8"],
    [3.6, 7.5, "#ffe29a"],
    [6.5, 7.6, "#b9a8f6"],
    [9.6, 2.5, "#f7b6c8"],
    [0.6, 6.4, "#ffe29a"],
    [7.6, 7.3, "#f59f84"],
  ];
  return (
    <g>
      {spots.map(([x, y, c]) => (
        <g key={`${x}-${y}`}>
          <IsoBox b={box(x, y, heightAt(Math.floor(x), Math.floor(y)), 0.08, 0.08, 0.3)} m={M.leafDark} />
          <IsoBox b={box(x - 0.08, y - 0.08, heightAt(Math.floor(x), Math.floor(y)) + 0.3, 0.24, 0.24, 0.18)} m={{ top: c, left: c, right: c }} />
        </g>
      ))}
    </g>
  );
}

function Tree({ spot }: { spot: TreeSpot }) {
  const [trunk, canopy, crown] = treeBoxes(spot);
  return (
    <g className={styles.tree}>
      <IsoBox b={trunk} m={M.woodDark} />
      <IsoBox b={canopy} m={M.leafDark} />
      <IsoBox b={crown} m={M.leaf} />
    </g>
  );
}

function CalendarBoard({ hot }: { hot: boolean }) {
  const board = box(1.05, 1.35, 1.55, 1.9, 0.16, 1.5);
  return (
    <g className={styles.structure} data-hot={hot}>
      <IsoBox b={box(1.15, 1.4, 1, 0.16, 0.16, 2.2)} m={M.woodDark} />
      <IsoBox b={box(2.7, 1.4, 1, 0.16, 0.16, 2.2)} m={M.woodDark} />
      <IsoBox b={board} m={M.wood} />
      <IsoFace plane="y" at={[board.x, board.y + board.d, board.z + board.h]} k={board.w / 190} kv={board.h / 150}>
        <rect x={10} y={10} width={170} height={130} fill="#fffaf0" />
        <rect x={10} y={10} width={170} height={26} fill="#62b6ee" />
        {Array.from({ length: 28 }, (_, i) => i).map((i) => (
          <rect
            key={i}
            x={18 + (i % 7) * 23}
            y={44 + Math.floor(i / 7) * 23}
            width={18}
            height={18}
            fill={i === 11 ? "#f59f84" : "#e6eef8"}
          />
        ))}
      </IsoFace>
    </g>
  );
}

function Lectern({ hot }: { hot: boolean }) {
  const desk = box(4.2, 1.25, 1, 1.5, 0.8, 0.75);
  return (
    <g className={styles.structure} data-hot={hot}>
      <IsoBox b={desk} m={M.wood} />
      <IsoBox b={box(4.35, 1.35, 1.75, 0.6, 0.55, 0.08)} m={M.paper} />
      <IsoBox b={box(4.98, 1.35, 1.75, 0.6, 0.55, 0.08)} m={M.paper} />
      <IsoBox b={box(4.93, 1.35, 1.75, 0.06, 0.55, 0.1)} m={{ top: "#8b7cf6", left: "#7a68e6", right: "#6a58d6" }} />
      <IsoBox b={box(5.45, 1.75, 1.75, 0.12, 0.12, 0.35)} m={M.white} />
      <IsoBox className={styles.flame} b={box(5.47, 1.77, 2.1, 0.08, 0.08, 0.14)} m={M.gold} />
    </g>
  );
}

function QuestBoard({ hot }: { hot: boolean }) {
  const board = box(7.05, 1.3, 1.6, 1.9, 0.15, 1.3);
  return (
    <g className={styles.structure} data-hot={hot}>
      <IsoBox b={box(7.15, 1.35, 1, 0.16, 0.16, 2.3)} m={M.woodDark} />
      <IsoBox b={box(8.7, 1.35, 1, 0.16, 0.16, 2.3)} m={M.woodDark} />
      <IsoBox b={board} m={M.woodDark} />
      <IsoFace plane="y" at={[board.x, board.y + board.d, board.z + board.h]} k={board.w / 190} kv={board.h / 130}>
        <rect x={8} y={8} width={174} height={114} fill="#c48a52" />
        <g transform="rotate(-4 50 50)">
          <rect x={18} y={18} width={52} height={60} fill="#fffaf0" />
          <rect x={26} y={30} width={36} height={5} fill="#d6c8b0" />
          <rect x={26} y={42} width={28} height={5} fill="#d6c8b0" />
        </g>
        <g transform="rotate(5 120 60)">
          <rect x={86} y={22} width={46} height={52} fill="#fff1a8" />
          <rect x={94} y={34} width={30} height={5} fill="#e0c96d" />
        </g>
        <rect x={140} y={40} width={34} height={44} fill="#d4f3e6" transform="rotate(-6 157 62)" />
        <circle cx={44} cy={20} r={5} fill="#f59f84" />
        <circle cx={109} cy={24} r={5} fill="#8b7cf6" />
      </IsoFace>
    </g>
  );
}

function Chest({ hot }: { hot: boolean }) {
  return (
    <g className={styles.structure} data-hot={hot}>
      <IsoBox b={box(2.15, 6.2, 1, 0.95, 0.75, 0.6)} m={M.wood} />
      <g className={styles.lid}>
        <IsoBox b={box(2.12, 6.17, 1.6, 1.01, 0.81, 0.26)} m={M.woodDark} />
        <IsoBox b={box(2.55, 6.97, 1.42, 0.18, 0.04, 0.3)} m={M.gold} />
      </g>
    </g>
  );
}

/** Bix'in yanındaki kamp ateşi (Bix'in arkasında kalmasın diye solunda). */
function Campfire() {
  const [x, y] = isoP([4.9, 6.7, 1.3]);
  return (
    <g>
      <circle className={styles.fireGlow} cx={x} cy={y} r={46} fill="url(#wm-fire)" />
      <IsoBox b={box(4.5, 6.58, 1, 0.8, 0.22, 0.2)} m={M.woodDark} />
      <IsoBox b={box(4.78, 6.3, 1.05, 0.22, 0.8, 0.2)} m={M.woodDark} />
      <g transform={`translate(${x} ${y})`}>
        <path className={styles.fire} d="M0,6 C-12,0 -8,-14 -2,-22 C0,-14 6,-14 4,-26 C14,-16 14,-2 0,6 Z" fill="#ffb347" />
        <path className={styles.fire} d="M0,6 C-6,2 -4,-8 0,-12 C2,-6 6,-6 4,-14 C10,-6 8,2 0,6 Z" fill="#ffe07a" />
      </g>
    </g>
  );
}

/** Komut bloğu: projeleri koda dokunmadan eklediğim yer. Yanlarında yanıp sönen bir komut satırı var. */
function CommandBlock({ hot }: { hot: boolean }) {
  const b = COMMAND;
  const [px, py] = isoP([b.x + b.w / 2, b.y + b.d / 2, b.z + b.h + 0.5]);
  return (
    <g className={`${styles.structure} ${styles.command}`} data-hot={hot}>
      <IsoBox b={b} m={M.command} />
      <IsoTop at={[b.x, b.y, b.z + b.h + 0.001]} k={b.w / 100} kv={b.d / 100}>
        <rect x={12} y={12} width={76} height={76} fill="#e08a3c" />
        <rect x={30} y={30} width={40} height={40} fill="#b9661f" />
        <rect x={42} y={42} width={16} height={16} fill="#ffe07a" />
      </IsoTop>
      <CommandFace plane="y" at={[b.x, b.y + b.d, b.z + b.h]} k={b.w / 100} kv={b.h / 100} />
      <CommandFace plane="x" at={[b.x + b.w, b.y + b.d, b.z + b.h]} k={b.d / 100} kv={b.h / 100} />
      {/* Üstünde süzülen "+": yeni proje ekleme yeri olduğunu anlatır */}
      <g transform={`translate(${px} ${py})`}>
        <g className={styles.commandPlus}>
          <rect x={-3} y={-10} width={6} height={20} fill="#ffe07a" />
          <rect x={-10} y={-3} width={20} height={6} fill="#ffe07a" />
          <rect x={-3} y={-3} width={6} height={6} fill="#fff6c9" />
        </g>
      </g>
    </g>
  );
}

function CommandFace({ plane, at, k, kv }: { plane: "x" | "y"; at: P3; k: number; kv: number }) {
  return (
    <IsoFace plane={plane} at={at} k={k} kv={kv}>
      <rect x={8} y={8} width={84} height={84} fill="#ffffff" opacity={0.12} />
      <rect x={16} y={18} width={68} height={56} fill="#2a2639" />
      <g className={styles.commandScreen}>
        <path d="M24 30h6v6h-6zM30 36h6v6h-6zM24 42h6v6h-6z" fill="#7ef0c8" />
        <rect x={40} y={52} width={10} height={6} fill="#7ef0c8" />
        <rect className={styles.commandCursor} x={54} y={52} width={14} height={6} fill="#ffe07a" />
      </g>
      <rect x={16} y={80} width={68} height={6} fill="#9c5418" />
    </IsoFace>
  );
}

/** Bix: yerel asistan için özgün voxel karakter (ekran yüzlü küçük bir robot-filiz). */
function Bix({ hot }: { hot: boolean }) {
  const head = box(6.05, 5.05, 2.45, 1.0, 1.0, 0.85);
  return (
    <g className={styles.structure} data-hot={hot}>
      <g className={styles.bix}>
        <IsoBox b={box(6.2, 5.2, 1, 0.3, 0.3, 0.55)} m={M.stone} />
        <IsoBox b={box(6.6, 5.2, 1, 0.3, 0.3, 0.55)} m={M.stone} />
        <IsoBox b={box(6.12, 5.12, 1.55, 0.86, 0.86, 0.9)} m={M.mint} />
        <IsoBox b={head} m={M.white} />
        <IsoFace plane="y" at={[head.x, head.y + head.d, head.z + head.h]} k={head.w / 100} kv={head.h / 85}>
          <rect x={10} y={12} width={80} height={56} rx={6} fill="#2a2639" />
          <g className={styles.bixEyes}>
            <rect x={28} y={30} width={12} height={16} fill="#7ef0c8" />
            <rect x={60} y={30} width={12} height={16} fill="#7ef0c8" />
          </g>
        </IsoFace>
        <IsoBox b={box(6.5, 5.5, 3.3, 0.08, 0.08, 0.4)} m={M.leafDark} />
        <IsoBox b={box(6.54, 5.36, 3.62, 0.35, 0.3, 0.12)} m={M.leaf} />
      </g>
    </g>
  );
}
