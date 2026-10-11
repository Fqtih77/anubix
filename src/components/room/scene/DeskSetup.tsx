import { type CSSProperties, memo, type ReactNode } from "react";
import { IsoBox, IsoCylinder, IsoDisc, IsoFace, IsoPoly, IsoTop } from "@/components/iso/Iso";
import { type Box3, box, iso, material } from "@/lib/iso";
import { CHAIR, CHAIR_ROLL, DESK, MONITORS, PC_CASE, type RecordId, RECORDS, SCREENS, type ScreenFace } from "../layout";
import { C, M } from "./palette";
import styles from "./Scene.module.css";
import { LeftScreen, MainScreen, type MainScreenState, VerticalScreen, type VerticalScreenState } from "./Screens";

/* ---------- Masa, monitörler ve masa üstü ---------- */

interface DeskProps {
  mainScreen: MainScreenState;
  verticalScreen: VerticalScreenState;
  /** Bilgisayara takılı plak */
  loaded: RecordId | null;
  /** Masada duran plak kapağı (plak bilgisayardayken) */
  deskRecord: RecordId | null;
  hotId: string | null;
}

const MONITOR_MAT = { top: "#ebe9f2", left: C.bezel, right: "#d6d3e0" };

export const Desk = memo(function Desk({ mainScreen, verticalScreen, loaded, deskRecord, hotId }: DeskProps) {
  return (
    <g>
      <BackGlow />
      <IsoBox b={DESK.panelLeg} m={M.white} />
      <Drawers />
      <IsoBox b={DESK.top} m={M.white} edge="rgba(255,255,255,0.9)" />

      <DeskPlant />
      <Monitor b={MONITORS.left} screen={SCREENS.left} id="left" hot={false}>
        <LeftScreen />
      </Monitor>
      <Monitor b={MONITORS.main} screen={SCREENS.main} id="main" hot={hotId === "main-monitor"} lightBar>
        <MainScreen state={mainScreen} loaded={loaded} />
      </Monitor>
      <Monitor b={MONITORS.vertical} screen={SCREENS.vertical} id="vertical" hot={hotId === "secret-monitor"}>
        <VerticalScreen state={verticalScreen} />
      </Monitor>

      <Keyboard />
      <IsoBox b={DESK.mousePad} m={material("#cfc2fb", 0.3, 0.12)} />
      <IsoBox b={DESK.mouse} m={M.white} soft={2} />
      {deskRecord ? <DeskSleeve record={deskRecord} /> : null}
      <Mug />
    </g>
  );
});

/** Monitörlerin arkasında duvara vuran yumuşak lila ışık. */
function BackGlow() {
  return (
    <IsoFace plane="y" at={[2.2, 0.02, 9.2]} className={styles.backGlow}>
      <ellipse cx={460} cy={300} rx={480} ry={250} fill="url(#rm-backglow)" />
    </IsoFace>
  );
}

function Drawers() {
  const b = DESK.drawers;
  return (
    <g>
      <IsoBox b={b} m={M.white} />
      <IsoFace plane="y" at={[b.x, b.y + b.d, b.z + b.h]}>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={10} y={14 + i * 115} width={180} height={102} rx={6} fill="#f6f5fb" stroke="#e1deea" strokeWidth={2} />
            <rect x={78} y={30 + i * 115} width={44} height={10} rx={5} fill={C.peachDeep} />
          </g>
        ))}
      </IsoFace>
    </g>
  );
}

interface MonitorProps {
  b: Box3;
  screen: ScreenFace;
  id: string;
  hot: boolean;
  lightBar?: boolean;
  children: ReactNode;
}

function Monitor({ b, screen, id, hot, lightBar, children }: MonitorProps) {
  const cx = b.x + b.w / 2;
  const sw = screen.w * 100;
  const sh = screen.h * 100;
  return (
    <g className={styles.monitor} data-hot={hot} data-screen={id}>
      <IsoBox b={box(cx - 0.6, 0.25, DESK.topZ, 1.2, 0.85, 0.07)} m={M.metal} />
      <IsoBox b={box(cx - 0.13, 0.45, DESK.topZ, 0.26, 0.24, b.z - DESK.topZ + 0.7)} m={M.metal} />
      <IsoBox b={b} m={MONITOR_MAT} />
      <IsoFace plane="y" at={screen.at}>
        <defs>
          <clipPath id={`rm-clip-${id}`}>
            <rect width={sw} height={sh} rx={3} />
          </clipPath>
        </defs>
        <g clipPath={`url(#rm-clip-${id})`}>
          <rect width={sw} height={sh} fill={C.screenOff} />
          <g className={styles.screenOn}>{children}</g>
          <rect className={styles.screenGlare} width={sw} height={sh} fill="url(#rm-glare)" />
        </g>
        <rect className={styles.screenHot} width={sw} height={sh} rx={3} fill="none" strokeWidth={6} />
      </IsoFace>
      {lightBar ? (
        <g>
          <IsoPoly
            className={styles.lightCone}
            pts={[
              [cx - 0.7, b.y + 0.3, b.z + b.h + 0.05],
              [cx + 0.7, b.y + 0.3, b.z + b.h + 0.05],
              [cx + 1.5, 3.2, DESK.topZ],
              [cx - 1.5, 3.2, DESK.topZ],
            ]}
            fill="url(#rm-cone)"
          />
          <IsoBox b={box(cx - 0.75, b.y + 0.05, b.z + b.h, 1.5, 0.25, 0.12)} m={M.dark} />
        </g>
      ) : null}
    </g>
  );
}

function Keyboard() {
  const b = DESK.keyboard;
  const keys: ReactNode[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      const accent = (row === 0 && col === 0) || (row === 3 && col > 3 && col < 8);
      if (row === 3 && col > 4 && col < 8) continue;
      keys.push(
        <rect
          key={`${row}-${col}`}
          x={8 + col * 19.5}
          y={8 + row * 18}
          width={row === 3 && col === 4 ? 72 : 16}
          height={14}
          rx={3}
          fill={accent ? C.lilac : "#ecebf3"}
        />,
      );
    }
  }
  return (
    <g>
      <IsoBox b={b} m={M.white} soft={1.5} />
      <IsoTop at={[b.x, b.y, b.z + b.h]} k={b.w / 250} kv={b.d / 85}>
        {keys}
      </IsoTop>
    </g>
  );
}

function Mug() {
  const [x, y, z] = DESK.mug;
  const [sx, sy] = iso(x, y, z + 0.55);
  return (
    <g>
      <IsoCylinder c={DESK.mug} r={0.3} h={0.55} side="url(#rm-mug)" top="#a2665a" />
      <path
        d={`M${sx + 10},${sy + 4} q9,2 7,9 q-2,5 -8,4`}
        fill="none"
        stroke={C.peachDeep}
        strokeWidth={3}
        transform="translate(0 2)"
      />
      <g transform={`translate(${sx} ${sy - 4})`}>
        <g className={`${styles.steam} ${styles.ambient}`}>
          <path d="M-3,0 q-5,-8 0,-14 q5,-6 0,-14" stroke="#ffffff" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <path d="M4,-2 q-4,-7 0,-12 q4,-5 0,-11" stroke="#ffffff" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
}

function DeskPlant() {
  const c = DESK.plant;
  const [x, y] = iso(c[0], c[1], c[2] + 0.55);
  return (
    <g>
      <IsoCylinder c={c} r={0.3} h={0.55} side={M.pot.right} top="#8a6650" />
      <g transform={`translate(${x} ${y})`}>
        <ellipse cx={-5} cy={-6} rx={6} ry={8} fill={C.leaf} />
        <ellipse cx={5} cy={-7} rx={6} ry={9} fill={C.leafDark} />
        <ellipse cx={0} cy={-11} rx={5} ry={8} fill="#92d6a1" />
      </g>
    </g>
  );
}

/** Plak bilgisayardayken boş kapağı masada yatar: "şu an çalan plak". */
function DeskSleeve({ record }: { record: RecordId }) {
  const b = DESK.caseSpot;
  const { color, label } = RECORDS[record];
  return (
    <g className={styles.deskCase}>
      <IsoBox b={b} m={material(color, 0.35, 0.18)} soft={1} />
      <IsoTop at={[b.x, b.y, b.z + b.h]} k={b.w / 100} kv={b.d / 100}>
        <rect x={8} y={8} width={84} height={84} rx={6} fill="#ffffff" opacity={0.22} />
        <circle cx={50} cy={50} r={30} fill="none" stroke="#ffffff" strokeOpacity={0.6} strokeWidth={3} />
        <text x={50} y={58} textAnchor="middle" className={styles.sleeveText}>
          {label === "CV" ? "CV" : "A"}
        </text>
      </IsoTop>
    </g>
  );
}

/* ---------- Bilgisayar kasası ---------- */

export const PcCase = memo(function PcCase({ loaded }: { loaded: RecordId | null }) {
  const b = PC_CASE;
  const glow = loaded ? RECORDS[loaded].color : "#9d8cff";
  return (
    <g className={styles.pc} data-loaded={loaded !== null} style={{ "--pc-glow": glow } as CSSProperties}>
      <IsoBox b={b} m={M.white} edge="rgba(255,255,255,0.9)" />
      {/* Ön panel (+y): disk yuvası ve güç ışığı */}
      <IsoFace plane="y" at={[b.x, b.y + b.d, b.z + b.h]} k={b.w / 125} kv={b.h / 270}>
        <rect x={14} y={22} width={97} height={10} rx={4} fill="#2f2b40" />
        <rect className={styles.pcSlot} x={18} y={25} width={89} height={4} rx={2} />
        <circle className={styles.pcLed} cx={62} cy={58} r={6} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={24} y={96 + i * 22} width={77} height={6} rx={3} fill="#e6e4ee" />
        ))}
      </IsoFace>
      {/* Cam yan panel (+x): fanlar */}
      <IsoFace plane="x" at={[b.x + b.w, b.y + b.d, b.z + b.h]} k={b.d / 245} kv={b.h / 270}>
        <rect x={12} y={12} width={221} height={246} rx={10} fill="#25213a" />
        <rect x={12} y={12} width={221} height={246} rx={10} fill="url(#rm-pc-inner)" />
        {[
          [70, 70],
          [70, 190],
          [175, 130],
        ].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={42} className={styles.fanRing} />
            <g className={`${styles.fan} ${styles.ambient}`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse
                  key={a}
                  cx={cx}
                  cy={cy - 20}
                  rx={9}
                  ry={18}
                  fill="#ffffff"
                  opacity={0.18}
                  transform={`rotate(${a} ${cx} ${cy})`}
                />
              ))}
              <circle cx={cx} cy={cy} r={7} fill="#ffffff" opacity={0.4} />
            </g>
          </g>
        ))}
        <rect x={12} y={12} width={221} height={246} rx={10} fill="url(#rm-glare)" />
      </IsoFace>
      <Figurine />
    </g>
  );
});

/** Kasanın üstünde duran küçük, özgün voxel figür. */
function Figurine() {
  const top = PC_CASE.z + PC_CASE.h;
  const body = box(0.85, 1.25, top, 0.62, 0.62, 0.5);
  const head = box(0.8, 1.2, top + 0.5, 0.72, 0.72, 0.6);
  const [ex, ey] = iso(0.8 + 0.72, 1.2 + 0.36, top + 0.82);
  return (
    <g className={`${styles.figurine} ${styles.ambient}`}>
      <IsoBox b={body} m={material("#c9b8ff")} soft={1} />
      <IsoBox b={head} m={material("#ddd1ff", 0.3, 0.12)} soft={1} />
      <circle cx={ex - 1} cy={ey - 5} r={1.7} fill={C.ink} />
      <circle cx={ex + 6} cy={ey - 9} r={1.7} fill={C.ink} />
    </g>
  );
}

/* ---------- Sandalye ---------- */

/**
 * Sandalye iki parçadır: oturak ve sırtlık. Avatar otururken sırtlık avatarın önünde,
 * ayaktayken arkasında çizilir. Bu yüzden her parça iki katmanda bulunur ve yalnızca
 * biri görünür (`hidden`). İkisi de aynı kayma animasyonunu yapar.
 */
interface ChairPartProps {
  part: "base" | "backrest";
  rolled: boolean;
  hidden: boolean;
}

const [ROLL_X, ROLL_Y] = iso(CHAIR_ROLL.x, CHAIR_ROLL.y);

export const ChairPart = memo(function ChairPart({ part, rolled, hidden }: ChairPartProps) {
  const style: CSSProperties = {
    transform: rolled ? `translate(${ROLL_X}px, ${ROLL_Y}px)` : "translate(0px, 0px)",
    visibility: hidden ? "hidden" : "visible",
  };
  return (
    <g className={styles.chair} style={style}>
      {part === "base" ? <ChairBase /> : <ChairBack />}
    </g>
  );
});

const { x: CX, y: CY } = CHAIR;

function ChairBase() {
  const seatMat = { top: "#d9cefb", left: M.white.left, right: M.white.right };
  return (
    <g>
      <IsoDisc c={[CX, CY, 0]} r={1.25} fill="rgba(58,40,80,0.12)" />
      <IsoBox b={box(CX - 1.15, CY - 0.12, 0.22, 2.3, 0.24, 0.16)} m={M.metal} />
      <IsoBox b={box(CX - 0.12, CY - 1.15, 0.22, 0.24, 2.3, 0.16)} m={M.metal} />
      {[
        [CX - 1.1, CY],
        [CX + 1.1, CY],
        [CX, CY - 1.1],
        [CX, CY + 1.1],
      ].map(([x, y]) => (
        <IsoDisc key={`${x}-${y}`} c={[x, y, 0.08]} r={0.17} fill="#5b566f" />
      ))}
      <IsoBox b={box(CX - 0.12, CY - 0.12, 0.38, 0.24, 0.24, 1.5)} m={M.metal} />
      <IsoBox b={box(CX - 1.1, CY - 1.05, 1.85, 2.2, 2.1, 0.4)} m={seatMat} soft={4} />
      <IsoBox b={box(CX - 0.15, CY + 0.85, 1.9, 0.3, 0.3, 0.6)} m={M.metal} />
    </g>
  );
}

function ChairBack() {
  const back = box(CX - 1.0, CY + 0.85, 2.45, 2.0, 0.28, 2.95);
  return (
    <g>
      <IsoBox b={back} m={{ top: "#ffffff", left: "rgba(214,204,246,0.5)", right: "#e3e0ec" }} soft={3} />
      <IsoFace plane="y" at={[back.x, back.y + back.d, back.z + back.h]} k={back.w / 200} kv={back.h / 295}>
        <rect x={6} y={6} width={188} height={283} rx={26} fill="none" stroke="#ffffff" strokeWidth={12} />
        {[60, 110, 160, 210].map((y) => (
          <line key={y} x1={18} x2={182} y1={y} y2={y} stroke="#ffffff" strokeOpacity={0.45} strokeWidth={3} />
        ))}
      </IsoFace>
    </g>
  );
}
