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

/* ---------- Televizyon: mola modu ---------- */

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
      <rect width={w} height={h} fill="url(#rm-tv-sky)" />
      <circle cx={w * 0.72} cy={h * 0.42} r={38} fill="#ffe7a8" />
      <g className={`${styles.tvClouds}`}>
        <rect x={60} y={50} width={70} height={14} fill="#ffffff" opacity={0.8} />
        <rect x={76} y={40} width={36} height={12} fill="#ffffff" opacity={0.8} />
        <rect x={320} y={70} width={90} height={14} fill="#ffffff" opacity={0.7} />
        <rect x={610} y={46} width={70} height={14} fill="#ffffff" opacity={0.8} />
      </g>
      <g className={styles.tvHills}>
        {Array.from({ length: 16 }, (_, i) => i * 70).map((x, i) => (
          <rect key={x} x={x} y={h - 110 - ((i * 37) % 4) * 14} width={70} height={140} fill={i % 2 ? "#7fbf8f" : "#8fcf9a"} />
        ))}
      </g>
      <g className={styles.tvGround}>
        {Array.from({ length: 24 }, (_, i) => i * 48).map((x, i) => (
          <g key={x}>
            <rect x={x} y={h - 52} width={48} height={52} fill={i % 2 ? "#a77b56" : "#b88a62"} />
            <rect x={x} y={h - 58} width={48} height={10} fill={i % 2 ? "#6cbf6c" : "#7ccf72"} />
          </g>
        ))}
      </g>
      {/* Koşan küçük blok karakter */}
      <g transform={`translate(${w * 0.3} ${h - 96})`}>
        <g className={styles.runner}>
          <rect x={0} y={0} width={26} height={24} fill="#f3c5a4" />
          <rect x={0} y={0} width={26} height={8} fill="#3d3246" />
          <rect x={17} y={11} width={4} height={5} fill="#2d2640" />
          <rect x={2} y={24} width={22} height={18} fill="#7fd0ad" />
          <rect className={styles.runLegA} x={4} y={42} width={7} height={10} fill="#4c5175" />
          <rect className={styles.runLegB} x={15} y={42} width={7} height={10} fill="#4c5175" />
        </g>
      </g>
      <text x={18} y={34} className={styles.tvLabel} fill="#ffffff">
        MOLA MODU
      </text>
      <text x={18} y={58} className={styles.screenSmall} fill="#ffffffcc">
        ♪ lo-fi · kulaklık takılı
      </text>
      <g transform={`translate(${w - 110} ${h - 24})`}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect
            key={i}
            className={styles.eqBar}
            x={i * 16}
            y={-40}
            width={10}
            height={40}
            fill="#ffffff"
            opacity={0.85}
            style={{ animationDelay: `${i * -0.17}s` }}
          />
        ))}
      </g>
    </g>
  );
}
