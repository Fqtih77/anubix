import type { ReactNode } from "react";
import type { Project } from "@/data/projects";
import { SCREENS } from "../layout";
import styles from "./Scene.module.css";

/**
 * Ekran içerikleri. Her biri kendi düz 2B tuvaline çizilir (1 birim = 100 px);
 * `IsoFace` onları monitörün izometrik yüzüne yerleştirir.
 */

export type MainScreenState = "saver" | "boot" | "project";
export type VerticalScreenState = "saver" | "cursor" | "login";
export type TvState = "off" | "boot" | "chill";

const size = (id: keyof typeof SCREENS) => ({ w: SCREENS[id].w * 100, h: SCREENS[id].h * 100 });

/* ---------- Sol monitör: yavaş kayan kod ---------- */

const CODE_COLORS = ["#b9a8f6", "#9fe0c4", "#ffc2a6", "#a9d4fb", "#f7b6c8", "#ffe29a"];

function CodeLines({ offset }: { offset: number }) {
  const lines: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const seed = (i * 7 + offset * 3) % 11;
    const indent = (i % 4) * 12;
    lines.push(
      <g key={i} transform={`translate(0 ${i * 13})`}>
        <rect x={40 + indent} y={0} width={20 + seed * 9} height={6} rx={3} fill={CODE_COLORS[i % 6]} opacity={0.85} />
        <rect x={68 + indent + seed * 9} y={0} width={14 + ((seed * 5) % 40)} height={6} rx={3} fill="#e7e3f5" opacity={0.35} />
      </g>,
    );
  }
  return <g>{lines}</g>;
}

export function LeftScreen() {
  const { w, h } = size("left");
  return (
    <g>
      <rect width={w} height={h} fill="#1d1a2c" />
      <rect width={26} height={h} fill="#16141f" />
      <g className={`${styles.codeScroll} ${styles.ambient}`}>
        <g transform="translate(0 14)">
          <CodeLines offset={0} />
        </g>
        <g transform="translate(0 196)">
          <CodeLines offset={1} />
        </g>
      </g>
      <rect width={w} height={12} fill="#26223a" />
      <circle cx={10} cy={6} r={3} fill="#f59f84" />
      <circle cx={20} cy={6} r={3} fill="#ffe29a" />
      <circle cx={30} cy={6} r={3} fill="#7fd0ad" />
    </g>
  );
}

/* ---------- Ana monitör ---------- */

export function MainScreen({ state, project }: { state: MainScreenState; project: Project | null }) {
  const { w, h } = size("main");
  if (state === "boot" && project) {
    return (
      <g>
        <rect width={w} height={h} fill="#17142a" />
        <text x={w / 2} y={h / 2 - 18} textAnchor="middle" className={styles.screenTitleSm} fill="#ffffff">
          {project.title.toUpperCase()}
        </text>
        <rect x={w * 0.2} y={h / 2} width={w * 0.6} height={10} rx={5} fill="#2e2946" />
        <rect className={styles.bootBar} x={w * 0.2} y={h / 2} width={w * 0.6} height={10} rx={5} fill={project.accent} />
        <text x={w / 2} y={h / 2 + 36} textAnchor="middle" className={styles.screenSmall} fill="#bdb6d6">
          YÜKLENİYOR…
        </text>
      </g>
    );
  }
  if (state === "project" && project) {
    const placeholder = project.status === "placeholder";
    return (
      <g>
        <rect width={w} height={h} fill={project.accent} />
        <rect width={w} height={h} fill="url(#rm-screen-sheen)" />
        <text x={18} y={30} className={styles.screenSmall} fill="#ffffffcc">
          {placeholder ? "ÖRNEK PROJE" : "PROJE"}
        </text>
        <text x={18} y={h / 2 + 4} className={styles.screenTitle} fill="#ffffff">
          {project.title.toUpperCase()}
        </text>
        <text x={18} y={h / 2 + 30} className={styles.screenSmall} fill="#ffffffdd">
          {project.tagline}
        </text>
        <g className={styles.blink}>
          <text x={18} y={h - 18} className={styles.screenSmall} fill="#ffffff">
            ▶ BAŞLAT
          </text>
        </g>
      </g>
    );
  }
  return (
    <g>
      <rect width={w} height={h} fill="url(#rm-saver)" />
      <g className={`${styles.saverFloat} ${styles.ambient}`}>
        <text x={w / 2} y={h / 2 + 2} textAnchor="middle" className={styles.screenTitle} fill="#ffffff">
          anubix
        </text>
        <g transform={`translate(${w / 2 - 9} ${h / 2 - 54})`}>
          <path d="M9,0 L18,5 L9,10 L0,5 Z" fill="#ffffff" />
          <path d="M0,5 L9,10 L9,21 L0,16 Z" fill="#e3dcff" />
          <path d="M18,5 L9,10 L9,21 L18,16 Z" fill="#c7bbff" />
        </g>
      </g>
      <text x={w / 2} y={h - 18} textAnchor="middle" className={styles.screenSmall} fill="#ffffffd0">
        ← raftan bir proje seç
      </text>
    </g>
  );
}

/* ---------- Dikey monitör: gizli giriş ---------- */

export function VerticalScreen({ state }: { state: VerticalScreenState }) {
  const { w, h } = size("vertical");
  const isActive = state !== "saver";
  return (
    <g>
      <rect width={w} height={h} fill={isActive ? "#1b2a1f" : "#131120"} />
      {[
        [16, 40],
        [80, 70],
        [40, 120],
        [92, 170],
        [22, 210],
        [70, 236],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={3} height={3} fill="#ffffff" opacity={0.35} />
      ))}
      <text x={10} y={24} className={styles.screenSmall} fill="#8f86b3">
        &gt; <tspan className={styles.cursorBlink}>_</tspan>
      </text>
      {/* Merak edene küçük ipucu: arada bir parlayan piksel anahtar */}
      <g className={`${styles.keyHint} ${styles.ambient}`} transform={`translate(${w / 2 - 14} ${h / 2 - 10})`}>
        <rect x={0} y={4} width={12} height={12} fill="#ffe29a" />
        <rect x={4} y={8} width={4} height={4} fill="#131120" />
        <rect x={12} y={8} width={16} height={4} fill="#ffe29a" />
        <rect x={20} y={12} width={4} height={6} fill="#ffe29a" />
        <rect x={26} y={12} width={2} height={4} fill="#ffe29a" />
      </g>
      {isActive ? (
        <g>
          <rect x={14} y={h / 2 + 30} width={w - 28} height={30} rx={3} fill="#5cb85c" stroke="#2e6b2e" strokeWidth={3} />
          <text x={w / 2} y={h / 2 + 50} textAnchor="middle" className={styles.screenSmall} fill="#ffffff">
            GİRİŞ ▶
          </text>
          <g className={styles.mouseCursor}>
            <path d="M0,0 L0,22 L6,16 L11,26 L15,24 L10,14 L18,14 Z" fill="#ffffff" stroke="#000000" strokeWidth={1.5} />
          </g>
          <rect className={styles.clickFlash} width={w} height={h} fill="#ffffff" />
        </g>
      ) : null}
    </g>
  );
}

/* ---------- Televizyon: yarış oyununun oda içi ön izlemesi ---------- */

function PreviewCar({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-18} y={-20} width={8} height={17} fill="#0b1120" />
      <rect x={10} y={-20} width={8} height={17} fill="#0b1120" />
      <rect x={-18} y={10} width={8} height={17} fill="#0b1120" />
      <rect x={10} y={10} width={8} height={17} fill="#0b1120" />
      <path d="M0 -30 L8 -14 L10 17 L15 22 L-15 22 L-10 17 L-8 -14 Z" fill={color} />
      <rect x={-20} y={23} width={40} height={5} fill="#0b1120" />
      <rect x={-14} y={-26} width={28} height={5} fill="#0b1120" />
      <ellipse cy={0} rx={6} ry={9} fill="#10172a" />
    </g>
  );
}

export function TvScreen({ state }: { state: TvState }) {
  const { w, h } = size("tv");
  if (state === "off") return null;
  if (state === "boot") {
    return (
      <g>
        <rect width={w} height={h} fill="#120f1f" />
        <g className={styles.tvLogo}>
          <text x={w / 2} y={h / 2 + 12} textAnchor="middle" className={styles.tvTitle} fill="#ffffff">
            ANUBIX
          </text>
          <rect x={w / 2 - 70} y={h / 2 + 26} width={140} height={4} rx={2} fill="#b9a8f6" />
        </g>
      </g>
    );
  }
  return (
    <g>
      <rect width={w} height={h} fill="#102634" />
      <rect x={w * 0.16} width={w * 0.68} height={h} fill="#2d3d57" />
      <rect x={w * 0.16 + 8} width={w * 0.68 - 16} height={h} fill="#34445e" />
      <g className={`${styles.tvRaceMotion} ${styles.ambient}`}>
        {Array.from({ length: 9 }, (_, i) => i).map((i) => (
          <g key={i} transform={`translate(0 ${i * 70 - 90})`}>
            <rect x={w * 0.16} width={8} height={35} fill={i % 2 ? "#f6eee4" : "#ef615e"} />
            <rect x={w * 0.84 - 8} width={8} height={35} fill={i % 2 ? "#f6eee4" : "#ef615e"} />
            <rect x={w * 0.39} width={3} height={35} fill="#d8dce4" opacity={0.75} />
            <rect x={w * 0.61} width={3} height={35} fill="#d8dce4" opacity={0.75} />
          </g>
        ))}
      </g>
      <g className={`${styles.tvRaceRival} ${styles.ambient}`}><PreviewCar x={w * 0.39} y={h * 0.25} color="#ffd36e" /></g>
      <g className={`${styles.tvRaceRivalSecond} ${styles.ambient}`}><PreviewCar x={w * 0.61} y={h * 0.6} color="#75c6ee" /></g>
      <PreviewCar x={w * 0.5} y={h * 0.76} color="#f35b55" />
      <rect x={12} y={10} width={163} height={37} rx={5} fill="#10172a" opacity={0.92} />
      <text x={20} y={34} className={styles.tvLabel} fill="#ffffff">PIT LANE SPRINT</text>
      <circle cx={w - 31} cy={28} r={17} fill="#80e2d4" />
      <path d={`M${w - 28} 15 l-9 15 h7 l-4 13 13-18 h-8 l5-10Z`} fill="#123647" />
    </g>
  );
}
