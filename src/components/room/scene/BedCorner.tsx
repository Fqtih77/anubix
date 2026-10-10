import { memo } from "react";
import { IsoBox, IsoCylinder, IsoFace, IsoTop } from "@/components/iso/Iso";
import { box, convexHull, iso, isoP, type P3, poly3, roundedRect3, toPoints } from "@/lib/iso";
import { AVATAR_COLORS } from "../avatar/model";
import { BED_CORNER } from "../layout";
import { C, M } from "./palette";
import styles from "./Scene.module.css";

const B = BED_CORNER;

export const BedRug = memo(function BedRug() {
  const r = B.rug;
  return (
    <g>
      <polygon points={poly3(roundedRect3(r.x, r.y, r.w, r.d, r.r, 0.02))} fill="#fffaf2" stroke="#efe3d5" strokeWidth={4} />
      <Slippers />
    </g>
  );
});

function Slippers() {
  return (
    <g>
      {[
        [17.2, 12.0],
        [17.95, 12.35],
      ].map(([x, y]) => {
        const [sx, sy] = iso(x, y, 0.05);
        return (
          <g key={x} transform={`translate(${sx} ${sy})`}>
            <ellipse cx={0} cy={0} rx={13} ry={7} fill={C.peach} />
            <ellipse cx={4} cy={-1} rx={6} ry={4} fill="#ffe2d4" />
          </g>
        );
      })}
    </g>
  );
}

interface BedProps {
  sleeping: boolean;
  hot: boolean;
}

export const BedCorner = memo(function BedCorner({ sleeping, hot }: BedProps) {
  return (
    <g>
      <FloorPlant />
      <Nightstand />
      <g className={styles.bed} data-hot={hot}>
        <IsoBox b={B.headboard} m={M.lilacSoft} soft={4} />
        <IsoFace plane="y" at={[B.headboard.x, B.headboard.y + B.headboard.d, B.headboard.h]} k={B.headboard.w / 630} kv={B.headboard.h / 410}>
          {[105, 210, 315, 420, 525].map((x) => (
            <line key={x} x1={x} x2={x} y1={30} y2={380} stroke="#c6b8f4" strokeWidth={4} />
          ))}
        </IsoFace>
        {[
          [B.base.x + 0.2, B.base.y + B.base.d - 0.4],
          [B.base.x + B.base.w - 0.4, B.base.y + B.base.d - 0.4],
          [B.base.x + B.base.w - 0.4, B.base.y + 0.2],
        ].map(([x, y]) => (
          <IsoBox key={`${x}-${y}`} b={box(x, y, 0, 0.25, 0.25, 0.3)} m={M.woodDark} />
        ))}
        <IsoBox b={B.base} m={M.wood} edge="rgba(255,255,255,0.6)" />
        <IsoBox b={B.mattress} m={M.sheet} soft={4} />
        {B.pillows.map((p) => (
          <IsoBox key={p.x} b={p} m={M.pillow} soft={9} />
        ))}
        <Duvet sleeping={sleeping} />
        <Plush />
        {sleeping ? <Sleeper /> : null}
      </g>
    </g>
  );
});

/** Yorgan desenindeki puantiyeler (yerel tuval koordinatı). */
const DOTS = Array.from({ length: 9 * 6 }, (_, n) => [50 + (n % 6) * 105, 110 + Math.floor(n / 6) * 66] as const);

function Duvet({ sleeping }: { sleeping: boolean }) {
  const d = B.duvet;
  return (
    <g>
      <IsoBox b={d} m={M.duvet} soft={5} />
      <IsoTop at={[d.x, d.y, d.z + d.h]} k={d.w / 620} kv={d.d / 675}>
        {DOTS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={6} fill="#ffe0d2" />
        ))}
      </IsoTop>
      {/* Katlanmış üst kenar */}
      <IsoBox b={box(d.x, d.y, d.z + d.h, d.w, 0.8, 0.12)} m={{ top: "#fff3ec", left: "#ffe3d6", right: "#f6cdbb" }} soft={4} />
      {sleeping ? (
        <IsoBox b={box(15.9, 3.7, d.z + d.h, 2.5, 5.0, 0.7)} m={M.duvet} soft={14} className={styles.breathe} />
      ) : null}
    </g>
  );
}

/** Yatakta uyuyan avatar: yastığa gömülmüş kafa, yorganın altındaki gövde ve uçuşan z'ler. */
function Sleeper() {
  const head = box(16.15, 1.15, 2.4, 2.0, 1.85, 1.15);
  const top: P3 = [head.x, head.y, head.z + head.h];
  const [zx, zy] = iso(head.x + 1.6, head.y, head.z + head.h + 0.8);
  return (
    <g className={styles.sleeper}>
      <IsoBox b={head} m={{ top: AVATAR_COLORS.skin, left: "#ecb796", right: AVATAR_COLORS.hair }} soft={2} />
      <IsoTop at={top} k={head.w / 100} kv={head.d / 100}>
        <path d="M0,0 H100 V26 L88,20 L76,30 L64,21 L52,31 L40,21 L28,30 L16,20 L0,27 Z" fill={AVATAR_COLORS.hair} />
        <path d="M22,54 Q30,62 38,54" stroke="#2b2238" strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M62,54 Q70,62 78,54" stroke="#2b2238" strokeWidth={4} fill="none" strokeLinecap="round" />
        <ellipse cx={18} cy={70} rx={8} ry={5} fill="#f59fb4" opacity={0.7} />
        <ellipse cx={82} cy={70} rx={8} ry={5} fill="#f59fb4" opacity={0.7} />
      </IsoTop>
      {/* Yorganın üstünde duran kol */}
      <IsoBox b={box(17.75, 4.5, 3.1, 0.55, 1.5, 0.4)} m={{ top: "#a3e2c6", left: AVATAR_COLORS.hoodie, right: "#69b996" }} soft={2} />
      <IsoBox b={box(17.8, 6.0, 3.1, 0.45, 0.42, 0.36)} m={{ top: AVATAR_COLORS.skin, left: "#ecb796", right: "#dda283" }} soft={2} />
      <g transform={`translate(${zx} ${zy})`}>
        {[0, 1, 2].map((i) => (
          <text key={i} className={styles.zzz} x={i * 14} y={-i * 16} style={{ animationDelay: `${i * 0.7}s` }}>
            z
          </text>
        ))}
      </g>
    </g>
  );
}

function Plush() {
  const b = box(19.55, 2.75, 2.35, 0.95, 0.85, 0.85);
  const [ex, ey] = iso(b.x + 0.35, b.y + b.d, b.z + 0.55);
  return (
    <g>
      <IsoBox b={b} m={M.mint} soft={6} />
      <circle cx={ex} cy={ey} r={2} fill={C.ink} />
      <circle cx={ex + 12} cy={ey - 6} r={2} fill={C.ink} />
      <ellipse cx={ex + 5} cy={ey + 6} rx={4} ry={2} fill="#f59fb4" opacity={0.7} />
    </g>
  );
}

function Nightstand() {
  const n = B.nightstand;
  const [lx, ly] = isoP([B.lamp[0], B.lamp[1], B.lamp[2] + 0.75]);
  return (
    <g>
      <IsoBox b={n} m={M.wood} edge="rgba(255,255,255,0.6)" />
      <IsoFace plane="y" at={[n.x, n.y + n.d, n.h]} k={n.w / 180} kv={n.h / 230}>
        <rect x={14} y={20} width={152} height={80} rx={8} fill="#f6efe7" />
        <rect x={74} y={52} width={32} height={9} rx={4.5} fill={C.woodEdgeR} />
      </IsoFace>
      {/* Mantar lamba ve yatmış küçük bir kitap */}
      <circle className={styles.lampGlow} cx={lx} cy={ly} r={70} fill="url(#rm-lamp-glow)" />
      <IsoCylinder c={B.lamp} r={0.16} h={0.55} side="#fff6e8" top="#fff6e8" />
      <path
        className={styles.lampShade}
        d={`M${lx - 26},${ly + 4} Q${lx - 24},${ly - 26} ${lx},${ly - 27} Q${lx + 24},${ly - 26} ${lx + 26},${ly + 4} Q${lx},${ly + 12} ${lx - 26},${ly + 4} Z`}
      />
      <IsoBox b={box(13.95, 1.2, n.h, 0.65, 0.75, 0.16)} m={M.peach} soft={1.5} />
    </g>
  );
}

function FloorPlant() {
  const c = B.plant;
  const [x, y] = iso(c[0], c[1], c[2] + 1.3);
  const leaves = [
    { cx: -26, cy: -40, rx: 15, ry: 30, r: -40, f: C.leafDark },
    { cx: 22, cy: -46, rx: 15, ry: 32, r: 38, f: C.leaf },
    { cx: -8, cy: -66, rx: 14, ry: 30, r: -12, f: "#92d6a1" },
    { cx: 14, cy: -70, rx: 13, ry: 28, r: 20, f: C.leafDark },
    { cx: -30, cy: -10, rx: 12, ry: 24, r: -70, f: C.leaf },
    { cx: 30, cy: -14, rx: 12, ry: 24, r: 68, f: "#92d6a1" },
  ];
  return (
    <g>
      <IsoCylinder c={c} r={0.55} h={1.3} side="url(#rm-pot)" top="#7b5a46" />
      <g transform={`translate(${x} ${y})`}>
        <g className={`${styles.plantSway} ${styles.ambient}`}>
          <path d="M0,0 L-8,-50 M0,0 L10,-56 M0,0 L-2,-70" stroke={C.leafDark} strokeWidth={2.5} />
          {leaves.map((l) => (
            <ellipse
              key={`${l.cx}-${l.cy}`}
              cx={l.cx}
              cy={l.cy}
              rx={l.rx}
              ry={l.ry}
              fill={l.f}
              transform={`rotate(${l.r} ${l.cx} ${l.cy})`}
            />
          ))}
        </g>
      </g>
    </g>
  );
}

/* ---------- Pencereden giren ışık ---------- */

const W = B.window;
const SHAFT_TOP: P3[] = [
  [W.x, 0, W.z + W.h],
  [W.x + W.w, 0, W.z + W.h],
  [W.x + W.w, 0, W.z],
  [W.x, 0, W.z],
];
/** Işığın yatağın üstünde bittiği hayali düzlem (yalnızca huzmenin şeklini belirler). */
const SHAFT_END: P3[] = [
  [15.2, 2.6, 2.55],
  [20.3, 2.6, 2.55],
  [19.0, 8.9, 2.55],
  [15.2, 8.9, 2.55],
];

export const LightShaft = memo(function LightShaft() {
  const hull = convexHull([...SHAFT_TOP, ...SHAFT_END].map(isoP));
  return (
    <g className={`${styles.lightShaft} ${styles.ambient}`}>
      <polygon points={toPoints(hull)} fill="url(#rm-shaft)" />
    </g>
  );
});
