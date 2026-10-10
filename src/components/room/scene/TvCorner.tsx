import { memo } from "react";
import { IsoBox, IsoCylinder, IsoDisc, IsoFace } from "@/components/iso/Iso";
import { box, iso, isoEllipseRadii, isoP, poly3, roundedRect3 } from "@/lib/iso";
import { SCREENS, TV_CORNER } from "../layout";
import { C, M } from "./palette";
import styles from "./Scene.module.css";
import { TvScreen, type TvState } from "./Screens";

/* ---------- Zemindeki halılar (mobilyalardan önce çizilir) ---------- */

export const Rugs = memo(function Rugs() {
  const r = TV_CORNER.rug;
  const outer = roundedRect3(r.x, r.y, r.w, r.d, r.r, 0.02);
  const inner = roundedRect3(r.x + 0.5, r.y + 0.5, r.w - 1, r.d - 1, r.r * 0.7, 0.02);
  return (
    <g>
      <polygon points={poly3(outer)} fill="#d8cdf8" />
      <polygon points={poly3(inner)} fill="#e6defc" stroke="#cbbdf4" strokeWidth={3} strokeDasharray="10 8" />
      {[0.32, 0.5, 0.68].map((t) => {
        const y = r.y + r.d * t;
        const [x1, y1] = iso(r.x + 1.2, y, 0.02);
        const [x2, y2] = iso(r.x + r.w - 1.2, y, 0.02);
        return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d2c5f6" strokeWidth={6} strokeLinecap="round" />;
      })}
    </g>
  );
});

/* ---------- Televizyon ünitesi (duvara monte) ---------- */

interface TvWallProps {
  tv: TvState;
  hot: boolean;
}

export const TvWall = memo(function TvWall({ tv, hot }: TvWallProps) {
  const b = TV_CORNER.tv;
  const s = SCREENS.tv;
  const sw = s.w * 100;
  const sh = s.h * 100;
  return (
    <g className={styles.tvUnit} data-hot={hot} data-tv={tv}>
      <IsoBox b={b} m={{ top: "#4a4560", left: "#3c3750", right: C.bezel }} />
      <IsoFace plane="x" at={s.at}>
        <defs>
          <clipPath id="rm-clip-tv">
            <rect width={sw} height={sh} rx={4} />
          </clipPath>
        </defs>
        <g clipPath="url(#rm-clip-tv)">
          <rect width={sw} height={sh} fill={C.screenOff} />
          <TvScreen state={tv} />
          <rect width={sw} height={sh} fill="url(#rm-glare)" />
        </g>
        <rect className={styles.screenHot} width={sw} height={sh} rx={4} fill="none" strokeWidth={8} />
      </IsoFace>
    </g>
  );
});

/* ---------- TV sehpası, konsol, orta sehpa, puf ---------- */

interface TvFurnitureProps {
  /** Kulaklık sehpada mı (avatar takınca kaybolur) */
  headphonesOnTable: boolean;
  controllerOnTable: boolean;
  /** Avatar pufa oturunca puf çöker */
  beanOccupied: boolean;
  tvOn: boolean;
  hotId: string | null;
}

export const TvFurniture = memo(function TvFurniture({
  headphonesOnTable,
  controllerOnTable,
  beanOccupied,
  tvOn,
  hotId,
}: TvFurnitureProps) {
  return (
    <g>
      <TvStand tvOn={tvOn} />
      <CoffeeTable headphones={headphonesOnTable} controller={controllerOnTable} />
      <BeanBag occupied={beanOccupied} hot={hotId === "bean-bag"} />
    </g>
  );
});

function TvStand({ tvOn }: { tvOn: boolean }) {
  const b = TV_CORNER.stand;
  const legs = [
    [b.x + 0.25, b.y + 0.3],
    [b.x + 0.25, b.y + b.d - 0.5],
    [b.x + b.w - 0.45, b.y + 0.3],
    [b.x + b.w - 0.45, b.y + b.d - 0.5],
  ];
  const cabinet = box(b.x, b.y, 0.35, b.w, b.d, b.h - 0.35);
  const c = TV_CORNER.console;
  return (
    <g>
      {legs.map(([x, y]) => (
        <IsoBox key={`${x}-${y}`} b={box(x, y, 0, 0.2, 0.2, 0.4)} m={M.woodDark} />
      ))}
      <IsoBox b={cabinet} m={M.wood} edge="rgba(255,255,255,0.6)" />
      {/* Kapaklar (+x yüzü) */}
      <IsoFace plane="x" at={[b.x + b.w, b.y + b.d, b.h]} k={b.d / 640} kv={(b.h - 0.35) / 155}>
        <rect x={14} y={14} width={292} height={127} rx={8} fill="#f6efe7" />
        <rect x={334} y={14} width={292} height={127} rx={8} fill="#f6efe7" />
        <rect x={290} y={60} width={8} height={36} rx={4} fill={C.woodEdgeR} />
        <rect x={342} y={60} width={8} height={36} rx={4} fill={C.woodEdgeR} />
      </IsoFace>
      {/* Özgün tasarım oyun konsolu: dik beyaz blok + ışık şeridi */}
      <IsoBox b={c} m={M.white} soft={2} />
      <IsoFace plane="x" at={[c.x + c.w, c.y + c.d, c.z + c.h]} k={c.d / 75} kv={c.h / 175}>
        <rect x={34} y={18} width={7} height={140} rx={3.5} className={styles.consoleLight} data-on={tvOn} />
      </IsoFace>
      <StandPlant />
    </g>
  );
}

function StandPlant() {
  const c = TV_CORNER.standPlant;
  const [x, y] = iso(c[0], c[1], c[2] + 0.7);
  return (
    <g>
      <IsoCylinder c={c} r={0.38} h={0.7} side={M.pot.right} top="#7d5c48" />
      <g transform={`translate(${x} ${y})`}>
        <g className={`${styles.sway} ${styles.ambient}`}>
          <ellipse cx={-10} cy={-12} rx={7} ry={15} fill={C.leaf} transform="rotate(-30 -10 -12)" />
          <ellipse cx={10} cy={-14} rx={7} ry={16} fill={C.leafDark} transform="rotate(28 10 -14)" />
          <ellipse cx={0} cy={-20} rx={6} ry={16} fill="#92d6a1" />
        </g>
      </g>
    </g>
  );
}

function CoffeeTable({ headphones, controller }: { headphones: boolean; controller: boolean }) {
  const t = TV_CORNER.table;
  const [cx, cy] = t.c;
  const legs = [-0.7, 0.7].flatMap((dx) => [-0.7, 0.7].map((dy) => [cx + dx, cy + dy] as const));
  return (
    <g>
      <IsoDisc c={[cx, cy, 0.01]} r={t.r * 0.95} fill="rgba(58,40,80,0.1)" />
      {legs.map(([x, y]) => (
        <IsoBox key={`${x}-${y}`} b={box(x - 0.1, y - 0.1, 0, 0.2, 0.2, t.topZ - 0.2)} m={M.woodDark} />
      ))}
      <IsoCylinder c={[cx, cy, t.topZ - 0.22]} r={t.r} h={0.22} side={C.woodEdgeR} top="#ecd0aa" />
      <IsoDisc c={[cx, cy, t.topZ + 0.001]} r={t.r * 0.8} fill="none" stroke="#e0bf96" strokeWidth={2} />
      {/* Atıştırmalık kasesi */}
      <IsoCylinder c={[cx - 0.55, cy + 0.6, t.topZ]} r={0.38} h={0.22} side="#f7b6c8" top="#ffe29a" />
      {headphones ? <TableHeadphones /> : null}
      {controller ? <TableController /> : null}
    </g>
  );
}

function TableHeadphones() {
  const [x, y] = isoP(TV_CORNER.headphones);
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={styles.pickup}>
        <path d="M-16,-2 C-16,-24 16,-24 16,-2" stroke="#f5f1ff" strokeWidth={5} fill="none" strokeLinecap="round" />
        <ellipse cx={-16} cy={0} rx={7} ry={9} fill="#a68cf3" />
        <ellipse cx={16} cy={0} rx={7} ry={9} fill="#8f74ea" />
      </g>
    </g>
  );
}

function TableController() {
  const [x, y] = isoP(TV_CORNER.controller);
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={styles.pickup}>
      <path d="M-18,-4 Q-20,-14 -8,-14 H8 Q20,-14 18,-4 Q16,6 8,2 H-8 Q-16,6 -18,-4 Z" fill="#f3effb" stroke="#d6d0e6" strokeWidth={1.5} />
      <circle cx={-8} cy={-7} r={2.6} fill="#8b7cf6" />
      <circle cx={8} cy={-8} r={2} fill="#f59f84" />
      <circle cx={12} cy={-5} r={2} fill="#7fd0ad" />
      </g>
    </g>
  );
}

/** Armut puf: organik bir şekil, oturulunca hafifçe çöker. */
function BeanBag({ occupied, hot }: { occupied: boolean; hot: boolean }) {
  const { c, r, h } = TV_CORNER.beanBag;
  const [x, y] = isoP(c);
  const { rx, ry } = isoEllipseRadii(r);
  const top = h * 32;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={4} rx={rx * 1.05} ry={ry * 1.05} fill="rgba(58,40,80,0.14)" />
      <g className={styles.beanBag} data-occupied={occupied} data-hot={hot}>
        <path
          d={`M${-rx},0 C${-rx * 1.05},${-top * 0.55} ${-rx * 0.55},${-top} 0,${-top} C${rx * 0.6},${-top} ${rx * 1.05},${-top * 0.5} ${rx},0 C${rx * 0.95},${ry * 0.9} ${-rx * 0.95},${ry * 0.9} ${-rx},0 Z`}
          fill="url(#rm-bean)"
        />
        <ellipse cx={-rx * 0.12} cy={-top * 0.62} rx={rx * 0.55} ry={ry * 0.55} fill="#9a8ae6" opacity={0.45} />
        <path
          d={`M${-rx * 0.7},${-top * 0.35} Q${-rx * 0.2},${-top * 0.15} ${rx * 0.5},${-top * 0.32}`}
          stroke="#ffffff"
          strokeOpacity={0.35}
          strokeWidth={3}
          fill="none"
        />
        <path
          d={`M${-rx * 0.55},${-top * 0.88} Q${-rx * 0.3},${-top * 1.0} ${-rx * 0.05},${-top * 0.95}`}
          stroke="#ffffff"
          strokeOpacity={0.5}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </g>
  );
}
