import { memo } from "react";
import { IsoFace } from "@/components/iso/Iso";
import { C } from "./palette";
import styles from "./Scene.module.css";

/** Duvarlardaki pano, poster ve neon tabela. Hepsi özgün, hiçbiri hazır görsel değil. */
export const WallDecor = memo(function WallDecor() {
  return (
    <g>
      <Pegboard />
      <IslandPoster />
      <NeonSign />
      <GamePoster />
    </g>
  );
});

function Pegboard() {
  const w = 370;
  const h = 280;
  const dots = [];
  for (let x = 20; x < w; x += 22) {
    for (let y = 20; y < h; y += 22) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={2.4} fill="#efb59c" />);
  }
  return (
    <IsoFace plane="y" at={[3.2, 0.06, 10.5]}>
      <rect width={w} height={h} rx={10} fill="#ffd7c4" />
      {dots}
      <g transform="translate(36 40) rotate(-5)">
        <rect width={84} height={80} rx={4} fill="#fff1a8" />
        <rect x={12} y={18} width={58} height={6} rx={3} fill="#e0c96d" />
        <rect x={12} y={34} width={44} height={6} rx={3} fill="#e0c96d" />
        <rect x={12} y={50} width={52} height={6} rx={3} fill="#e0c96d" />
      </g>
      <g transform="translate(146 30) rotate(4)">
        <rect width={92} height={108} rx={4} fill="#ffffff" />
        <rect x={9} y={9} width={74} height={70} fill="#bfe3f7" />
        <rect x={9} y={58} width={74} height={21} fill="#9fd8a9" />
        <rect x={52} y={20} width={14} height={14} fill="#ffe29a" />
      </g>
      <g transform="translate(270 54) rotate(-3)">
        <rect width={74} height={70} rx={4} fill="#c9f0dd" />
        <path d="M18,30 h10 v-8 h10 v8 h10 v12 h-6 v8 h-6 v6 h-6 v-6 h-6 v-8 h-6 Z" fill="#f59fb4" />
      </g>
      <g transform="translate(60 168)">
        <rect width={250} height={14} rx={7} fill="#e9a487" />
        <rect x={20} y={-46} width={30} height={46} rx={6} fill="#8b7cf6" />
        <rect x={60} y={-36} width={24} height={36} rx={6} fill="#7fd0ad" />
        <rect x={96} y={-52} width={18} height={52} rx={5} fill="#ffe29a" />
        <rect x={150} y={-30} width={60} height={30} rx={6} fill="#ffffff" />
        <text x={180} y={-10} textAnchor="middle" className={styles.decorText} fill="#8b7cf6">
          TODO
        </text>
      </g>
    </IsoFace>
  );
}

function IslandPoster() {
  const w = 300;
  const h = 320;
  return (
    <IsoFace plane="y" at={[7.6, 0.06, 10.9]}>
      <rect width={w} height={h} rx={6} fill="#ffffff" />
      <rect x={16} y={16} width={w - 32} height={h - 70} fill="url(#rm-poster-sky)" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={196 + i * 4} y={48 + i * 4} width={34 - i * 8} height={34 - i * 8} fill="#fff1b8" opacity={0.9 - i * 0.2} />
      ))}
      {/* Düz çizilmiş küçük voxel ada */}
      <g transform="translate(150 175)">
        <path d="M0,-40 L70,-5 L0,30 L-70,-5 Z" fill="#8fd39a" />
        <path d="M-70,-5 L0,30 L0,58 L-70,23 Z" fill="#b98a62" />
        <path d="M70,-5 L0,30 L0,58 L70,23 Z" fill="#9c7350" />
        <rect x={-14} y={-62} width={10} height={30} fill="#9c7350" />
        <rect x={-34} y={-96} width={50} height={40} fill="#5fae6e" />
        <rect x={-24} y={-110} width={30} height={20} fill="#7cc98f" />
      </g>
      <text x={w / 2} y={h - 22} textAnchor="middle" className={styles.decorTitle} fill={C.ink}>
        ANUBIX · 2026
      </text>
    </IsoFace>
  );
}

function NeonSign() {
  return (
    <IsoFace plane="x" at={[0.06, 3.3, 10.2]}>
      <g className={`${styles.neon} ${styles.ambient}`} filter="url(#rm-neon)">
        <text x={120} y={92} textAnchor="middle" className={styles.neonText}>
          anubix
        </text>
        <path
          d="M120,170 C80,140 76,112 98,106 C110,103 118,112 120,118 C122,112 130,103 142,106 C164,112 160,140 120,170 Z"
          fill="none"
          stroke="#ff9ec4"
          strokeWidth={6}
          strokeLinejoin="round"
        />
      </g>
    </IsoFace>
  );
}

function GamePoster() {
  const w = 400;
  const h = 280;
  return (
    <IsoFace plane="x" at={[0.06, 15.3, 10.9]}>
      <rect width={w} height={h} rx={8} fill="#ffffff" />
      <rect x={14} y={14} width={w - 28} height={h - 28} rx={4} fill="#3c3462" />
      {Array.from({ length: 18 }, (_, i) => [30 + ((i * 53) % 340), 30 + ((i * 37) % 200)] as const).map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={4} height={4} fill="#ffffff" opacity={0.4} />
      ))}
      {/* Piksel oyun kumandası */}
      <g transform="translate(120 70)">
        <path d="M20,0 H140 V20 H160 V80 H120 V60 H40 V80 H0 V20 H20 Z" fill="#b9a8f6" />
        <rect x={30} y={30} width={10} height={30} fill="#3c3462" />
        <rect x={20} y={40} width={30} height={10} fill="#3c3462" />
        <rect x={112} y={30} width={12} height={12} fill="#f59f84" />
        <rect x={128} y={44} width={12} height={12} fill="#7fd0ad" />
      </g>
      <text x={w / 2} y={h - 48} textAnchor="middle" className={styles.decorTitle} fill="#ffe29a">
        PLAY · REST · REPEAT
      </text>
    </IsoFace>
  );
}
