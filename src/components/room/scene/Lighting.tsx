import { memo } from "react";
import { IsoBox, IsoFace } from "@/components/iso/Iso";
import { type Box3, box, faceCorners, iso, isoP, type P2, type P3, silhouette, toPoints } from "@/lib/iso";
import {
  BED_CORNER,
  LIGHT_SWITCH,
  PC_CASE,
  RECORD_IDS,
  type RecordId,
  RECORDS,
  ROOM,
  SCREENS,
  type ScreenFace,
} from "../layout";
import styles from "./Scene.module.css";
import type { MainScreenState, TvState } from "./Screens";
import { stringLightBulbs } from "./Shell";

/**
 * GECE MODU
 * ---------
 * Işık düğmesi kapatılınca oda iki katmanla geceye döner:
 *   1. NightShade: odanın silüetini lacivert bir renkle "çarpar" (multiply) ve karartır.
 *   2. NightGlow: lambalar, ampuller, ekranlar ve ay ışığı "screen" karışımıyla yeniden parlar.
 * İkisi de yalnızca opaklık değiştirerek geçiş yapar; renkler tek tek yeniden boyanmaz.
 */

const { w: W, d: D, h: H, wall: T, floor: F } = ROOM;
const ROOM_OUTLINE = silhouette([box(-T, -T, -F, W + T, D + T, H + F)]);

/* ---------- Işık düğmesi ---------- */

export const LightSwitch = memo(function LightSwitch({ on, hot }: { on: boolean; hot: boolean }) {
  const b = LIGHT_SWITCH;
  return (
    <g className={styles.lightSwitch} data-hot={hot} data-on={on}>
      <IsoBox b={b} m={{ top: "#ffffff", left: "#f7f4ef", right: "#e5dfd7" }} soft={1.5} />
      <IsoFace plane="y" at={[b.x, b.y + b.d, b.z + b.h]} k={b.w / 50} kv={b.h / 78}>
        <rect x={12} y={12} width={26} height={54} rx={5} fill="#e9e3da" />
        <rect className={styles.rocker} x={14} y={14} width={22} height={25} rx={4} />
        <circle className={styles.switchLed} cx={25} cy={72} r={2.6} />
      </IsoFace>
    </g>
  );
});

/* ---------- Karartma katmanı ---------- */

export const NightShade = memo(function NightShade() {
  return <polygon className={styles.nightShade} points={toPoints(ROOM_OUTLINE)} />;
});

/* ---------- Parıltı katmanı ---------- */

const BULBS = stringLightBulbs().map((p) => isoP(p));
const LAMP = isoP([BED_CORNER.lamp[0], BED_CORNER.lamp[1], BED_CORNER.lamp[2] + 0.75]);

const MAIN_GLOW: Record<MainScreenState, string> = {
  saver: "#8e7ff2",
  boot: "#6a5cff",
  cv: "#dfe7ff",
  projects: "#a08ff7",
};

function facePolygon(face: ScreenFace): P2[] {
  const { tl, tr, bl } = faceCorners(face.plane, face.at, face.w, face.h);
  const br: P2 = [tr[0] + bl[0] - tl[0], tr[1] + bl[1] - tl[1]];
  return [tl, tr, br, bl];
}

/** Bilgisayar kasasının cam yan paneli (+x yüzü) */
const PC_GLASS: ScreenFace = {
  plane: "x",
  at: [PC_CASE.x + PC_CASE.w, PC_CASE.y + PC_CASE.d - 0.12, PC_CASE.z + PC_CASE.h - 0.12],
  w: PC_CASE.d - 0.24,
  h: PC_CASE.h - 0.24,
};

/** Tablo lambasından tablonun yüzüne düşen ışık konisi */
function pictureLightCone(frame: Box3): P3[] {
  const yc = frame.y + frame.d / 2;
  const top = frame.z + frame.h + 0.18;
  return [
    [0.5, yc - 0.45, top],
    [0.5, yc + 0.45, top],
    [frame.x + frame.w, yc + 1.35, frame.z + 0.35],
    [frame.x + frame.w, yc - 1.35, frame.z + 0.35],
  ];
}

const WIN = BED_CORNER.window;

/** Ay ışığı pencereden yatağa doğru soğuk bir huzme olarak düşer. */
const MOON_SHAFT: P3[] = [
  [WIN.x + 0.6, 0, WIN.z + WIN.h - 0.4],
  [WIN.x + WIN.w - 1.2, 0, WIN.z + WIN.h - 0.4],
  [WIN.x + WIN.w - 1.5, 0, WIN.z],
  [19.2, 8.4, 2.6],
  [15.4, 8.4, 2.6],
  [WIN.x + 0.6, 0, WIN.z],
];

const STARS: [number, number, number][] = [
  [40, 60, 2.2],
  [96, 130, 1.6],
  [150, 52, 2],
  [205, 170, 1.4],
  [300, 210, 1.8],
  [60, 300, 1.5],
  [140, 360, 1.8],
  [215, 300, 1.4],
  [300, 330, 2],
  [330, 60, 1.5],
];

const CITY_LIGHTS: [number, number][] = [
  [36, 470],
  [52, 486],
  [70, 452],
  [110, 498],
  [126, 474],
  [168, 488],
  [196, 460],
  [230, 492],
  [276, 470],
  [304, 482],
  [322, 456],
];

interface GlowProps {
  mainScreen: MainScreenState;
  tv: TvState;
  loaded: RecordId | null;
}

export const NightGlow = memo(function NightGlow({ mainScreen, tv, loaded }: GlowProps) {
  const pcColor = loaded ? RECORDS[loaded].color : "#9d8cff";
  const [deskX, deskY] = iso(7.2, 2.4, 3.9);
  const [tvX, tvY] = iso(3.6, 13.4, 0.05);
  const [pcX, pcY] = iso(2.4, 2.2, 0.05);
  return (
    <g className={styles.nightGlow}>
      <defs>
        <clipPath id="rm-room-clip">
          <polygon points={toPoints(ROOM_OUTLINE)} />
        </clipPath>
        <radialGradient id="rm-glow-warm">
          <stop offset="0" stopColor="#ffd58a" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffd58a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rm-glow-lamp">
          <stop offset="0" stopColor="#ffc56f" stopOpacity="0.75" />
          <stop offset="0.5" stopColor="#ffb75a" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ffb75a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rm-glow-cool">
          <stop offset="0" stopColor="#9aa8ff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#9aa8ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rm-glow-tv">
          <stop offset="0" stopColor="#5aa9ff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#5aa9ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rm-moon-shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9c9ff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#b9c9ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rm-picture-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe0a3" stopOpacity="0.6" />
          <stop offset="1" stopColor="#ffe0a3" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <g clipPath="url(#rm-room-clip)">
        <polygon points={toPoints(MOON_SHAFT.map(isoP))} fill="url(#rm-moon-shaft)" />

        {/* Pencere: ay, yıldızlar ve uzak şehir ışıkları (perdelerin arasında kalan camda) */}
        <IsoFace plane="y" at={[WIN.x, -T, WIN.z + WIN.h]}>
          <circle cx={322} cy={112} r={58} fill="url(#rm-glow-cool)" />
          <circle cx={322} cy={112} r={30} fill="#eef1ff" />
          <circle cx={312} cy={104} r={6} fill="#cdd5f5" />
          <circle cx={332} cy={124} r={4} fill="#cdd5f5" />
          {STARS.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} className={styles.star} cx={x} cy={y} r={r} fill="#ffffff" />
          ))}
          {CITY_LIGHTS.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={5} height={6} fill="#ffd27a" />
          ))}
        </IsoFace>

        {/* Tablo lambaları */}
        {RECORD_IDS.map((id) => (
          <polygon
            key={id}
            points={toPoints(pictureLightCone(RECORDS[id].frame).map(isoP))}
            fill="url(#rm-picture-light)"
          />
        ))}

        {/* Ekranlar ve masaya vuran ışıkları */}
        <ellipse cx={deskX} cy={deskY} rx={170} ry={78} fill="url(#rm-glow-cool)" />
        <polygon points={toPoints(facePolygon(SCREENS.left))} fill="#6f74c9" opacity={0.42} />
        <polygon points={toPoints(facePolygon(SCREENS.main))} fill={MAIN_GLOW[mainScreen]} opacity={0.6} />
        <polygon points={toPoints(facePolygon(SCREENS.vertical))} fill="#36406a" opacity={0.4} />

        {/* Televizyon */}
        {tv !== "off" ? (
          <g>
            <ellipse cx={tvX} cy={tvY} rx={190} ry={90} fill="url(#rm-glow-tv)" />
            <polygon points={toPoints(facePolygon(SCREENS.tv))} fill="#4f9fe0" opacity={0.5} />
          </g>
        ) : null}

        {/* Bilgisayar kasasının fanları */}
        <ellipse cx={pcX} cy={pcY} rx={70} ry={34} fill={pcColor} opacity={0.22} />
        <polygon points={toPoints(facePolygon(PC_GLASS))} fill={pcColor} opacity={0.42} />

        {/* Komodindeki mantar lamba */}
        <circle cx={LAMP[0]} cy={LAMP[1]} r={170} fill="url(#rm-glow-lamp)" />
        <ellipse cx={LAMP[0]} cy={LAMP[1] - 8} rx={24} ry={12} fill="#fff1cf" opacity={0.8} />

        {/* Işık zinciri */}
        {BULBS.map(([x, y]) => (
          <g key={`${x.toFixed(1)}-${y.toFixed(1)}`}>
            <circle cx={x} cy={y} r={20} fill="url(#rm-glow-warm)" opacity={0.75} />
            <circle cx={x} cy={y} r={3.4} fill="#fff4d2" />
          </g>
        ))}

        {/* Işık düğmesinin karanlıkta bulunsun diye yanan küçük ışığı */}
        <SwitchLedGlow />
      </g>
    </g>
  );
});

function SwitchLedGlow() {
  const b = LIGHT_SWITCH;
  const [x, y] = isoP([b.x + b.w / 2, b.y + b.d, b.z + 0.08]);
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill="#7dffb2" opacity={0.35} />
      <circle cx={x} cy={y} r={2.4} fill="#c9ffe0" />
    </g>
  );
}
