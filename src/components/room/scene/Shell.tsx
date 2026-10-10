import { type CSSProperties, memo } from "react";
import { IsoBox, IsoFace, IsoPoly } from "@/components/iso/Iso";
import { box, iso, type P3, poly3, seeded } from "@/lib/iso";
import { BED_CORNER, ROOM } from "../layout";
import { C } from "./palette";
import styles from "./Scene.module.css";

const { w: W, d: D, h: H, wall: T, floor: F } = ROOM;

/** Zemin, duvarlar, süpürgelik ve maket kaidesi. Hiç değişmediği için memo. */
export const Shell = memo(function Shell() {
  return (
    <g>
      {/* Maket kaidesi: alt pastel katman + ahşap kenar */}
      <IsoBox b={box(-T, -T, -F, W + T, D + T, F - 0.35)} m={{ top: C.floor, left: C.plinthL, right: C.plinthR }} />
      <IsoBox
        b={box(-T, -T, -0.35, W + T, D + T, 0.35)}
        m={{ top: C.floor, left: C.woodEdgeL, right: C.woodEdgeR }}
        edge="rgba(255,255,255,0.55)"
      />
      <Planks />
      <FloorAo />

      {/* Duvar iç yüzleri */}
      <IsoPoly
        pts={[
          [0, 0, H],
          [0, D, H],
          [0, D, 0],
          [0, 0, 0],
        ]}
        fill="url(#rm-wall-left)"
      />
      <IsoPoly
        pts={[
          [0, 0, H],
          [W, 0, H],
          [W, 0, 0],
          [0, 0, 0],
        ]}
        fill="url(#rm-wall-right)"
      />
      <CornerAo />

      {/* Duvar üstleri ve kesit uçları */}
      <IsoPoly
        pts={[
          [-T, -T, H],
          [0, -T, H],
          [0, D, H],
          [-T, D, H],
        ]}
        fill={C.wallTop}
      />
      <IsoPoly
        pts={[
          [-T, -T, H],
          [W, -T, H],
          [W, 0, H],
          [-T, 0, H],
        ]}
        fill={C.wallTop}
      />
      <IsoPoly
        pts={[
          [-T, D, H],
          [0, D, H],
          [0, D, 0],
          [-T, D, 0],
        ]}
        fill={C.wallCap}
      />
      <IsoPoly
        pts={[
          [W, -T, H],
          [W, 0, H],
          [W, 0, 0],
          [W, -T, 0],
        ]}
        fill="#d9cdc3"
      />

      {/* Süpürgelikler */}
      <IsoBox b={box(0, 0, 0, 0.12, D, 0.45)} m={{ top: "#ffffff", left: "#f4efea", right: "#ece4dd" }} />
      <IsoBox b={box(0, 0, 0, W, 0.12, 0.45)} m={{ top: "#ffffff", left: "#f7f2ed", right: "#ece4dd" }} />
    </g>
  );
});

/** Parke çizgileri ve rastgele ama sabit ek yerleri. */
function Planks() {
  const rand = seeded(7);
  const rows: string[] = [];
  const seams: string[] = [];
  const step = 1.25;
  for (let y = step; y < D; y += step) {
    const [x1, y1] = iso(0, y);
    const [x2, y2] = iso(W, y);
    rows.push(`M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`);
  }
  for (let y = 0; y < D; y += step) {
    let x = rand() * 4;
    while (x < W - 0.5) {
      const [a1, b1] = iso(x, y);
      const [a2, b2] = iso(x, Math.min(D, y + step));
      seams.push(`M${a1.toFixed(1)},${b1.toFixed(1)}L${a2.toFixed(1)},${b2.toFixed(1)}`);
      x += 3.5 + rand() * 3.5;
    }
  }
  return (
    <g>
      <path d={rows.join("")} stroke={C.floorLine} strokeWidth={1.3} />
      <path d={seams.join("")} stroke={C.floorSeam} strokeWidth={1.1} opacity={0.7} />
    </g>
  );
}

/** Duvar diplerinde hafif ortam gölgesi: oda daha derin görünür. */
function FloorAo() {
  return (
    <g opacity={0.9}>
      <IsoPoly
        pts={[
          [0, 0, 0],
          [W, 0, 0],
          [W, 1.4, 0],
          [0, 1.4, 0],
        ]}
        fill="url(#rm-ao-right)"
      />
      <IsoPoly
        pts={[
          [0, 0, 0],
          [1.4, 0, 0],
          [1.4, D, 0],
          [0, D, 0],
        ]}
        fill="url(#rm-ao-left)"
      />
    </g>
  );
}

function CornerAo() {
  return (
    <IsoPoly
      pts={[
        [0, 0, H],
        [0, 1.6, H],
        [0, 1.6, 0],
        [0, 0, 0],
      ]}
      fill="url(#rm-ao-corner)"
    />
  );
}

/* ---------- Pencere, perdeler, gökyüzü ---------- */

const WIN = BED_CORNER.window;

export const Window = memo(function Window() {
  const x0 = WIN.x;
  const x1 = WIN.x + WIN.w;
  const z0 = WIN.z;
  const z1 = WIN.z + WIN.h;
  return (
    <g>
      {/* Gökyüzü: duvarın dış yüzünde */}
      <IsoFace plane="y" at={[x0, -T, z1]}>
        <defs>
          <clipPath id="rm-win-clip">
            <rect width={WIN.w * 100} height={WIN.h * 100} />
          </clipPath>
        </defs>
        <g clipPath="url(#rm-win-clip)">
          <rect width={WIN.w * 100} height={WIN.h * 100} fill="url(#rm-sky)" />
          <circle className={styles.sun} cx={WIN.w * 70} cy={150} r={44} fill="#fff4cf" />
          <g className={`${styles.clouds} ${styles.ambient}`}>
            <Cloud x={40} y={120} s={1} />
            <Cloud x={300} y={70} s={0.7} />
            <Cloud x={620} y={150} s={0.9} />
            <Cloud x={880} y={90} s={0.8} />
          </g>
          {/* Uzak tepeler */}
          <path
            d={`M0,${WIN.h * 100} L0,430 Q90,380 170,420 T340,410 Q420,370 520,420 L520,${WIN.h * 100} Z`}
            fill="#bfe3c9"
          />
          <path
            d={`M0,${WIN.h * 100} L0,480 Q120,440 230,475 T520,470 L520,${WIN.h * 100} Z`}
            fill="#a5d6b4"
          />
        </g>
      </IsoFace>

      {/* Duvar kalınlığı (pencere yan kesiti) */}
      <IsoPoly
        pts={[
          [x0, -T, z1],
          [x0, 0, z1],
          [x0, 0, z0],
          [x0, -T, z0],
        ]}
        fill="#efe5dc"
      />
      <IsoPoly
        pts={[
          [x0, -T, z0],
          [x1, -T, z0],
          [x1, 0, z0],
          [x0, 0, z0],
        ]}
        fill="#f7f0ea"
      />

      {/* Kasa ve kayıtlar */}
      <IsoFace plane="y" at={[x0, -0.25, z1]}>
        <rect
          x={5}
          y={5}
          width={WIN.w * 100 - 10}
          height={WIN.h * 100 - 10}
          fill="none"
          stroke="#ffffff"
          strokeWidth={14}
        />
        <rect x={WIN.w * 50 - 6} y={0} width={12} height={WIN.h * 100} fill="#ffffff" />
        <rect x={0} y={WIN.h * 42} width={WIN.w * 100} height={11} fill="#ffffff" />
        <rect
          x={8}
          y={8}
          width={WIN.w * 100 - 16}
          height={WIN.h * 100 - 16}
          fill="none"
          stroke="#e3dbe9"
          strokeWidth={2}
        />
      </IsoFace>

      {/* Denizlik */}
      <IsoBox
        b={box(x0 - 0.25, 0, z0 - 0.22, WIN.w + 0.5, 0.55, 0.22)}
        m={{ top: "#ffffff", left: "#f1ebe6", right: "#e4dad2" }}
      />
      <WindowSillPlant />
    </g>
  );
});

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#ffffff" opacity={0.92}>
      <ellipse cx={0} cy={0} rx={56} ry={24} />
      <ellipse cx={-30} cy={6} rx={34} ry={20} />
      <ellipse cx={34} cy={4} rx={38} ry={22} />
      <ellipse cx={6} cy={-16} rx={30} ry={22} />
    </g>
  );
}

function WindowSillPlant() {
  const [cx, cy] = iso(16.3, 0.28, WIN.z);
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <path d="M-9,0 L-7,-14 L7,-14 L9,0 Z" fill="#f3b3a0" />
      <ellipse cx={0} cy={-14} rx={7.5} ry={2.6} fill="#e4927e" />
      <g className={`${styles.sway} ${styles.ambient}`}>
        <ellipse cx={-6} cy={-24} rx={5} ry={10} fill={C.leaf} transform="rotate(-28 -6 -24)" />
        <ellipse cx={5} cy={-27} rx={5} ry={11} fill={C.leafDark} transform="rotate(22 5 -27)" />
        <ellipse cx={0} cy={-31} rx={4} ry={10} fill={C.leaf} />
      </g>
    </g>
  );
}

/** Perdeler pencere düzleminin önünde, yavaşça salınır. */
export const Curtains = memo(function Curtains() {
  const left = WIN.x - 0.6;
  const right = WIN.x + WIN.w - 0.7;
  const top = WIN.z + WIN.h + 0.75;
  return (
    <g>
      <IsoBox b={box(WIN.x - 0.9, 0.2, top, WIN.w + 1.8, 0.12, 0.12)} m={{ top: "#d9c3a5", left: "#c6a984", right: "#b79a76" }} />
      {[left, right].map((x, i) => (
        <IsoFace key={x} plane="y" at={[x, 0.32, top]}>
          <g className={`${styles.curtain} ${styles.ambient}`} style={{ animationDelay: `${i * -2.4}s` }}>
            <CurtainShape />
          </g>
        </IsoFace>
      ))}
    </g>
  );
});

function CurtainShape() {
  const w = 130;
  const h = 760;
  return (
    <g>
      <path d={`M0,0 H${w} V${h - 20} Q${w * 0.75},${h} ${w / 2},${h - 14} Q${w * 0.25},${h + 6} 0,${h - 18} Z`} fill="#ffd2be" />
      {[22, 54, 86, 112].map((x, i) => (
        <rect key={x} x={x} y={0} width={i % 2 ? 9 : 12} height={h - 24} fill={i % 2 ? "#ffe2d4" : "#f6b9a3"} opacity={0.75} />
      ))}
      {[16, 48, 80, 112].map((x) => (
        <circle key={x} cx={x} cy={8} r={6} fill="#e4c6a6" />
      ))}
    </g>
  );
}

/* ---------- Işık zinciri ---------- */

interface Strand {
  from: P3;
  to: P3;
  swags: number;
}

const STRANDS: Strand[] = [
  { from: [0.15, 0.7, H - 0.5], to: [0.15, D - 0.6, H - 0.5], swags: 4 },
  { from: [0.7, 0.15, H - 0.5], to: [W - 0.6, 0.15, H - 0.5], swags: 5 },
];

function strandPoints(s: Strand) {
  const wire: P3[] = [];
  const bulbs: P3[] = [];
  for (let k = 0; k < s.swags; k++) {
    for (let i = 0; i <= 12; i++) {
      const t = (k + i / 12) / s.swags;
      const local = i / 12;
      const sag = 0.85 * 4 * local * (1 - local);
      const p: P3 = [
        s.from[0] + (s.to[0] - s.from[0]) * t,
        s.from[1] + (s.to[1] - s.from[1]) * t,
        s.from[2] - sag,
      ];
      wire.push(p);
      if (i % 3 === 1) bulbs.push([p[0], p[1], p[2] - 0.18]);
    }
  }
  return { wire, bulbs };
}

export const StringLights = memo(function StringLights() {
  let index = 0;
  return (
    <g>
      {STRANDS.map((s) => {
        const { wire, bulbs } = strandPoints(s);
        return (
          <g key={`${s.from.join()}`}>
            <polyline points={poly3(wire)} fill="none" stroke="#9c8f86" strokeWidth={1.2} opacity={0.7} />
            {bulbs.map((p) => {
              const [x, y] = iso(p[0], p[1], p[2]);
              const i = index++;
              return (
                <g key={`${p[0]}-${p[1]}`} transform={`translate(${x} ${y})`} style={{ "--i": i } as CSSProperties}>
                  <circle className={styles.bulbGlow} r={11} fill="url(#rm-bulb-glow)" />
                  <circle className={`${styles.bulb} ${i % 5 === 2 ? styles.twinkle : ""}`} r={4.2} />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
});
